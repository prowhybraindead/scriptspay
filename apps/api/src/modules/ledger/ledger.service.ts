import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records an immutable double-entry accounting pair (DEBIT + CREDIT).
   *
   * ════════════════════════════════════════════════════════════════════
   * ⚠️  CRITICAL CONCURRENCY RULE — DO NOT REMOVE THIS COMMENT  ⚠️
   * ════════════════════════════════════════════════════════════════════
   * This method MUST be wrapped in a Prisma interactive transaction
   * (`prisma.$transaction(async (tx) => { ... })`) and MUST execute:
   *
   *   SELECT ... FROM "LedgerEntry" WHERE "accountId" IN (...)
   *   FOR UPDATE
   *
   * BEFORE inserting new rows. The `FOR UPDATE` row-level lock prevents
   * race conditions where two concurrent payments could read stale
   * balances and produce an inconsistent ledger.
   *
   * Steps inside the transaction:
   *   1. SELECT ... FOR UPDATE on both accountIds to acquire row locks.
   *   2. Validate business rules (e.g., sufficient balance if needed).
   *   3. INSERT two LedgerEntry rows: one DEBIT, one CREDIT.
   *   4. The amounts MUST be equal — sum(debits) === sum(credits).
   *
   * NEVER update balances directly. Balances are always derived from
   * the sum of ledger entries. This is the immutable ledger rule.
   * ════════════════════════════════════════════════════════════════════
   *
   * @param creditAccountId - UUID of the account being credited
   * @param debitAccountId  - UUID of the account being debited
   * @param amount          - Transaction amount (Decimal-safe)
   * @param currency        - Currency enum (VND, USD, EUR)
   * @param transactionId   - FK to the parent Transaction record
   * @param description     - Human-readable entry description
   */
  async recordDoubleEntry(
    creditAccountId: string,
    debitAccountId: string,
    amount: Prisma.Decimal,
    currency: string,
    transactionId: string,
    description: string,
  ): Promise<void> {
    // TODO: Implement inside prisma.$transaction(async (tx) => { ... })
    //
    // 1. Acquire row-level locks:
    //    await tx.$queryRaw`SELECT id FROM "LedgerEntry"
    //      WHERE "accountId" IN (${creditAccountId}, ${debitAccountId})
    //      FOR UPDATE`;
    //
    // 2. Create CREDIT entry:
    //    await tx.ledgerEntry.create({ data: {
    //      accountId: creditAccountId, type: 'CREDIT',
    //      amount, currency, balanceType: 'PENDING',
    //      transactionId, description
    //    }});
    //
    // 3. Create DEBIT entry:
    //    await tx.ledgerEntry.create({ data: {
    //      accountId: debitAccountId, type: 'DEBIT',
    //      amount, currency, balanceType: 'PENDING',
    //      transactionId, description
    //    }});

    this.logger.log(
      `recordDoubleEntry called: credit=${creditAccountId} debit=${debitAccountId} amt=${amount} tx=${transactionId}`,
    );
  }
}
