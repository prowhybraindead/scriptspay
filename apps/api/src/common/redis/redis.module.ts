import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

export const REDIS_CLIENT = "REDIS_CLIENT";

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.get<string>("REDIS_HOST", "localhost");
        const port = config.get<number>("REDIS_PORT", 6379);
        const password = config.get<string>("REDIS_PASSWORD");
        const useTls = config.get<string>("REDIS_TLS") === "true";

        return new Redis({
          host,
          port,
          password: password || undefined,
          tls: useTls ? {} : undefined,
          maxRetriesPerRequest: 3,
        });
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
