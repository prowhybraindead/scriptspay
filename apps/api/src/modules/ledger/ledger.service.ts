import { Injectable, Logger, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Prisma, Currency, BalanceType, LedgerEntry } from "@prisma/client";

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ════════════════════════════════════════════════════════════════════
  // recordDoubleEntry
  // ════════════════════════════════════════════════════════════════════
  //
  // ⚠️  CONCURRENCY: Wrapped in Prisma.$transaction with SELECT ... FOR UPDATE
  //     on the User rows to serialize concurrent writes per account pair.
  //
  // ⚠️  IMMUTABILITY: LedgerEntry rows are append-only. Balances are NEVER
  //     stored — they are derived via SUM aggregation at read time.
  //
  // ⚠️  INVARIANT: Every call inserts exactly 2 entries whose amounts are
  //     identical, preserving sum(credits) === sum(debits) globally.
  // ════════════════════════════════════════════════════════════════════

  async recordDoubleEntry(
    creditAccountId: string,
    debitAccountId: string,
    amount: Prisma.Decimal,
    currency: Currency,
    transactionId: string,
    description: string,
    balanceType: BalanceType = "PENDING",
  ): Promise<{ creditEntry: LedgerEntry; debitEntry: LedgerEntry }> {
    if (amount.lessThanOrEqualTo(0)) {
      throw new InternalServerErrorException(
        "Ledger amount must be a positive non-zero value.",
      );
    }

    return this.prisma.$transaction(
      async (tx) => {
        // ── STEP 1: Acquire row-level locks ──────────────────────────
        // Lock the User rows (not LedgerEntry rows) so that ANY concurrent
        // transaction touching the same accounts is serialized. Locking on
        // User is deterministic — the rows always exist — whereas LedgerEntry
        // rows may not exist yet for a brand-new account.
        //
        // ORDER BY id ensures a consistent lock acquisition order across
        // concurrent transactions, preventing deadlocks (A→B vs B→A).
        await tx.$queryRaw`
          SELECT id FROM "User"
          WHERE id IN (${creditAccountId}, ${debitAccountId})
          ORDER BY id
          FOR UPDATE
        `;

        // ── STEP 2: Insert CREDIT entry (money IN to creditAccount) ──
        const creditEntry = await tx.ledgerEntry.create({
          data: {
            accountId: creditAccountId,
            type: "CREDIT",
            amount,
            currency,
            balanceType,
            transactionId,
            description,
          },
        });

        // ── STEP 3: Insert DEBIT entry (money OUT from debitAccount) ──
        const debitEntry = await tx.ledgerEntry.create({
          data: {
            accountId: debitAccountId,
            type: "DEBIT",
            amount,
            currency,
            balanceType,
            transactionId,
            description,
          },
        });

        this.logger.log(
          `Double-entry recorded: tx=${transactionId} credit=${creditEntry.id} debit=${debitEntry.id} amt=${amount} ${currency} [${balanceType}]`,
        );

        return { creditEntry, debitEntry };
      },
      {
        // Serializable is the strictest isolation level. Combined with
        // FOR UPDATE it provides an ironclad guarantee against phantom
        // reads and write skew on the locked rows.
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 10_000, // 10 s hard limit to prevent long-held locks
      },
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // calculateBalance
  // ════════════════════════════════════════════════════════════════════
  //
  // Balance = SUM(CREDIT amounts) − SUM(DEBIT amounts)
  // Computed dynamically — no stored balance column, no stale data.
  // ════════════════════════════════════════════════════════════════════

  async calculateBalance(
    accountId: string,
    currency: Currency,
    balanceType: BalanceType,
  ): Promise<Prisma.Decimal> {
    // Aggregate credits
    const creditAgg = await this.prisma.ledgerEntry.aggregate({
      where: { accountId, currency, balanceType, type: "CREDIT" },
      _sum: { amount: true },
    });

    // Aggregate debits
    const debitAgg = await this.prisma.ledgerEntry.aggregate({
      where: { accountId, currency, balanceType, type: "DEBIT" },
      _sum: { amount: true },
    });

    const totalCredits = creditAgg._sum.amount ?? new Prisma.Decimal(0);
    const totalDebits = debitAgg._sum.amount ?? new Prisma.Decimal(0);

    return totalCredits.minus(totalDebits);
  }

  // ════════════════════════════════════════════════════════════════════
  // settlePendingTransaction
  // ════════════════════════════════════════════════════════════════════
  //
  // ARCHITECTURAL CHOICE — Compensating Entries (Strict Immutability)
  //
  // LedgerEntry rows are IMMUTABLE: no UPDATE, no DELETE, ever.
  // To move funds from PENDING → AVAILABLE we insert TWO compensating
  // entry pairs (4 rows total):
  //
  //   Pair 1 (reverse PENDING):
  //     DEBIT  on the original creditAccount  (balanceType = PENDING)
  //     CREDIT on the original debitAccount   (balanceType = PENDING)
  //     → Net PENDING balance for both accounts returns to pre-tx state.
  //
  //   Pair 2 (record AVAILABLE):
  //     CREDIT on the original creditAccount  (balanceType = AVAILABLE)
  //     DEBIT  on the original debitAccount   (balanceType = AVAILABLE)
  //     → Funds now appear in AVAILABLE balance.
  //
  // This preserves a complete, auditable history. Every state change
  // is recorded as new rows — exactly like a real bank ledger.
  // ════════════════════════════════════════════════════════════════════

  async settlePendingTransaction(transactionId: string): Promise<void> {
    await this.prisma.$transaction(
      async (tx) => {
        // ── STEP 1: Fetch original PENDING entries ───────────────────
        const pendingEntries = await tx.ledgerEntry.findMany({
          where: { transactionId, balanceType: "PENDING" },
        });

        if (pendingEntries.length === 0) {
          this.logger.warn(
            `No PENDING entries found for transaction ${transactionId} — already settled or does not exist.`,
          );
          return;
        }

        // Identify the original credit and debit entries
        const originalCredit = pendingEntries.find((e) => e.type === "CREDIT");
        const originalDebit = pendingEntries.find((e) => e.type === "DEBIT");

        if (!originalCredit || !originalDebit) {
          throw new InternalServerErrorException(
            `Incomplete double-entry for transaction ${transactionId}: missing ${!originalCredit ? "CREDIT" : "DEBIT"} leg.`,
          );
        }

        // ── STEP 2: Lock both account rows ───────────────────────────
        await tx.$queryRaw`
          SELECT id FROM "User"
          WHERE id IN (${originalCredit.accountId}, ${originalDebit.accountId})
          ORDER BY id
          FOR UPDATE
        `;

        // ── STEP 3: Reverse PENDING entries (compensating pair) ──────
        // Debit the original credit account to zero-out its PENDING balance
        await tx.ledgerEntry.create({
          data: {
            accountId: originalCredit.accountId,
            type: "DEBIT",
            amount: originalCredit.amount,
            currency: originalCredit.currency,
            balanceType: "PENDING",
            transactionId,
            description: `Settlement reversal: clear PENDING for tx ${transactionId}`,
          },
        });

        // Credit the original debit account to zero-out its PENDING balance
        await tx.ledgerEntry.create({
          data: {
            accountId: originalDebit.accountId,
            type: "CREDIT",
            amount: originalDebit.amount,
            currency: originalDebit.currency,
            balanceType: "PENDING",
            transactionId,
            description: `Settlement reversal: clear PENDING for tx ${transactionId}`,
          },
        });

        // ── STEP 4: Record AVAILABLE entries (new pair) ──────────────
        // Credit the original credit account in AVAILABLE
        await tx.ledgerEntry.create({
          data: {
            accountId: originalCredit.accountId,
            type: "CREDIT",
            amount: originalCredit.amount,
            currency: originalCredit.currency,
            balanceType: "AVAILABLE",
            transactionId,
            description: `Settlement: funds available for tx ${transactionId}`,
          },
        });

        // Debit the original debit account in AVAILABLE
        await tx.ledgerEntry.create({
          data: {
            accountId: originalDebit.accountId,
            type: "DEBIT",
            amount: originalDebit.amount,
            currency: originalDebit.currency,
            balanceType: "AVAILABLE",
            transactionId,
            description: `Settlement: funds available for tx ${transactionId}`,
          },
        });

        this.logger.log(
          `Settled transaction ${transactionId}: PENDING → AVAILABLE (${originalCredit.amount} ${originalCredit.currency})`,
        );
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 10_000,
      },
    );
  }
}
