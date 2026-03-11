import { Injectable } from "@nestjs/common";
import {
  BalanceType,
  Currency,
  NotificationMode,
  Prisma,
  Role,
  Transaction,
  TxStatus,
} from "@prisma/client";
import { randomBytes } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { LedgerService } from "../ledger/ledger.service";

type MerchantProfileSummary = {
  id: string;
  userId: string;
  businessName: string;
  taxId: string | null;
  supportEmail: string | null;
  statementDescriptor: string | null;
  notificationMode: NotificationMode;
  isKycApproved: boolean;
};

@Injectable()
export class MerchantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
  ) {}

  private toNumber(value: Prisma.Decimal): number {
    return Number(value.toString());
  }

  private deriveBusinessName(email: string): string {
    const [localPart = "merchant"] = email.split("@");
    const label = localPart
      .split(/[._-]+/)
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");

    return label || "Scripts Merchant";
  }

  private deriveStatementDescriptor(businessName: string): string {
    return businessName
      .replace(/[^A-Za-z0-9 ]/g, "")
      .trim()
      .slice(0, 22)
      .toUpperCase();
  }

  private parseNotificationMode(value?: string): NotificationMode | undefined {
    if (!value) {
      return undefined;
    }

    const normalized = value.toUpperCase();
    if (normalized === "ALL") {
      return NotificationMode.ALL;
    }
    if (normalized === "CRITICAL") {
      return NotificationMode.CRITICAL;
    }
    if (normalized === "NONE") {
      return NotificationMode.NONE;
    }

    return undefined;
  }

  private buildApiKey(prefix: "pk_test" | "sk_test"): string {
    return `${prefix}_${randomBytes(18).toString("hex")}`;
  }

  buildWebhookSecret(): string {
    return `whsec_${randomBytes(24).toString("hex")}`;
  }

  async ensureMerchantProfile(
    userId: string,
    email: string,
  ): Promise<MerchantProfileSummary> {
    await this.prisma.user.upsert({
      where: { id: userId },
      update: { email },
      create: {
        id: userId,
        email,
        role: Role.MERCHANT,
      },
    });

    const profile = await this.prisma.merchantProfile.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        businessName: this.deriveBusinessName(email),
        supportEmail: email,
        statementDescriptor: this.deriveStatementDescriptor(
          this.deriveBusinessName(email),
        ),
      },
      select: {
        id: true,
        userId: true,
        businessName: true,
        taxId: true,
        supportEmail: true,
        statementDescriptor: true,
        notificationMode: true,
        isKycApproved: true,
      },
    });

    return profile;
  }

  async ensureActiveApiKeys(merchantId: string) {
    const existingKey = await this.prisma.apiKey.findFirst({
      where: { merchantId, isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (existingKey) {
      return existingKey;
    }

    return this.prisma.apiKey.create({
      data: {
        merchantId,
        publicKey: this.buildApiKey("pk_test"),
        secretKey: this.buildApiKey("sk_test"),
      },
    });
  }

  async getBalance(userId: string, email: string) {
    await this.ensureMerchantProfile(userId, email);

    const [available, pending] = await Promise.all([
      this.ledgerService.calculateBalance(userId, Currency.VND, BalanceType.AVAILABLE),
      this.ledgerService.calculateBalance(userId, Currency.VND, BalanceType.PENDING),
    ]);

    return {
      available: this.toNumber(available),
      pending: this.toNumber(pending),
    };
  }

  async getTransactions(userId: string, email: string) {
    const profile = await this.ensureMerchantProfile(userId, email);
    const transactions = await this.prisma.transaction.findMany({
      where: { merchantId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 25,
    });

    return transactions.map((transaction) => this.serializeTransaction(transaction));
  }

  async getProfile(userId: string, email: string) {
    const profile = await this.ensureMerchantProfile(userId, email);

    return {
      ...profile,
      kycStatus: profile.isKycApproved ? "approved" : "pending",
      notificationMode: profile.notificationMode.toLowerCase(),
    };
  }

  async updateProfile(
    userId: string,
    email: string,
    body: {
      businessName?: string;
      taxId?: string | null;
      supportEmail?: string | null;
      statementDescriptor?: string | null;
      notificationMode?: string;
    },
  ) {
    const profile = await this.ensureMerchantProfile(userId, email);
    const businessName = body.businessName?.trim() || profile.businessName;

    const updatedProfile = await this.prisma.merchantProfile.update({
      where: { id: profile.id },
      data: {
        businessName,
        taxId: body.taxId?.trim() || null,
        supportEmail: body.supportEmail?.trim() || profile.supportEmail || email,
        statementDescriptor:
          body.statementDescriptor?.trim() ||
          profile.statementDescriptor ||
          this.deriveStatementDescriptor(businessName),
        notificationMode:
          this.parseNotificationMode(body.notificationMode) ||
          profile.notificationMode,
      },
      select: {
        id: true,
        userId: true,
        businessName: true,
        taxId: true,
        supportEmail: true,
        statementDescriptor: true,
        notificationMode: true,
        isKycApproved: true,
      },
    });

    return {
      ...updatedProfile,
      kycStatus: updatedProfile.isKycApproved ? "approved" : "pending",
      notificationMode: updatedProfile.notificationMode.toLowerCase(),
    };
  }

  async getApiKeys(userId: string, email: string) {
    const profile = await this.ensureMerchantProfile(userId, email);
    const keyPair = await this.ensureActiveApiKeys(profile.id);

    return {
      publicKey: keyPair.publicKey,
      secretKey: keyPair.secretKey,
    };
  }

  async rollApiKeys(userId: string, email: string) {
    const profile = await this.ensureMerchantProfile(userId, email);

    await this.prisma.apiKey.updateMany({
      where: { merchantId: profile.id, isActive: true },
      data: { isActive: false },
    });

    const nextKeyPair = await this.prisma.apiKey.create({
      data: {
        merchantId: profile.id,
        publicKey: this.buildApiKey("pk_test"),
        secretKey: this.buildApiKey("sk_test"),
      },
    });

    return {
      publicKey: nextKeyPair.publicKey,
      secretKey: nextKeyPair.secretKey,
    };
  }

  async getOverview(userId: string, email: string) {
    const profile = await this.ensureMerchantProfile(userId, email);
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);

    const [balances, activeWebhookEndpoints, todayTransactions, recentAiLogs] =
      await Promise.all([
        this.getBalance(userId, email),
        this.prisma.webhookEndpoint.count({
          where: { merchantId: profile.id, isActive: true },
        }),
        this.prisma.transaction.findMany({
          where: {
            merchantId: profile.id,
            createdAt: { gte: dayStart },
          },
          orderBy: { createdAt: "desc" },
        }),
        this.prisma.apiRequestLog.findMany({
          where: { merchantId: profile.id },
          orderBy: { createdAt: "desc" },
          take: 8,
        }),
      ]);

    const grossVolume = todayTransactions.reduce(
      (sum, transaction) => sum + this.toNumber(transaction.amount),
      0,
    );
    const succeededCount = todayTransactions.filter(
      (transaction) => transaction.status === TxStatus.SUCCEEDED,
    ).length;
    const successRate =
      todayTransactions.length > 0
        ? Math.round((succeededCount / todayTransactions.length) * 1000) / 10
        : 100;
    const recentFailures = recentAiLogs.filter((log) => log.statusCode >= 400).length;

    return {
      grossVolume,
      availableBalance: balances.available,
      pendingBalance: balances.pending,
      successRate,
      pendingCount: todayTransactions.filter(
        (transaction) => transaction.status === TxStatus.PENDING,
      ).length,
      activeWebhookEndpoints,
      recentFailures,
      recentTransactions: todayTransactions.slice(0, 5).map((transaction) => this.serializeTransaction(transaction)),
    };
  }

  private serializeTransaction(transaction: Transaction) {
    return {
      id: transaction.id,
      amount: this.toNumber(transaction.amount),
      status: transaction.status,
      method: transaction.method,
      createdAt: transaction.createdAt,
    };
  }
}