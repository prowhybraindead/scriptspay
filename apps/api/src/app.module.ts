import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { BullModule } from "@nestjs/bullmq";
import { HealthModule } from "./modules/health/health.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./common/redis/redis.module";
import { AuthModule } from "./modules/auth/auth.module";
import { PaymentModule } from "./modules/payment/payment.module";
import { LedgerModule } from "./modules/ledger/ledger.module";
import { WebhookModule } from "./modules/webhook/webhook.module";
import { AiModule } from "./modules/support-ai/ai.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? "localhost",
        port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
        password: process.env.REDIS_PASSWORD,
        tls: process.env.REDIS_TLS === "true" ? {} : undefined,
      },
    }),
    PrismaModule,
    RedisModule,
    HealthModule,
    AuthModule,
    PaymentModule,
    LedgerModule,
    WebhookModule,
    AiModule,
  ],
})
export class AppModule {}
