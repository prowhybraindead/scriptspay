import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Request } from "express";
import { AuthService } from "./auth.service";

interface AuthenticatedRequest extends Request {
  user?: { userId: string; email: string; role: string };
}

/**
 * Global / route-level guard that enforces Supabase authentication.
 * Usage: @UseGuards(SupabaseAuthGuard)
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private supabase: SupabaseClient | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  private extractBearerToken(req: AuthenticatedRequest): string | null {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return null;
    }

    const token = header.slice("Bearer ".length).trim();
    return token || null;
  }

  private extractApiKey(req: AuthenticatedRequest): string | null {
    const apiKeyHeader = req.headers["x-api-key"];
    if (typeof apiKeyHeader === "string" && apiKeyHeader.trim()) {
      return apiKeyHeader.trim();
    }

    const bearerToken = this.extractBearerToken(req);
    if (bearerToken?.startsWith("sk_test_")) {
      return bearerToken;
    }

    return null;
  }

  private async authenticateWithApiKey(
    apiKey: string,
    req: AuthenticatedRequest,
  ): Promise<boolean> {
    const keyPair = await this.prisma.apiKey.findFirst({
      where: {
        secretKey: apiKey,
        isActive: true,
      },
      include: {
        merchant: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!keyPair) {
      throw new UnauthorizedException("Invalid API key.");
    }

    req.user = {
      userId: keyPair.merchant.userId,
      email: keyPair.merchant.user.email,
      role: keyPair.merchant.user.role.toLowerCase(),
    };

    return true;
  }

  private getSupabaseClient(): SupabaseClient {
    if (!this.supabase) {
      this.supabase = createClient(
        this.config.getOrThrow<string>("SUPABASE_URL"),
        this.config.getOrThrow<string>("SUPABASE_SERVICE_ROLE_KEY"),
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        },
      );
    }
    return this.supabase;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const apiKey = this.extractApiKey(req);
    if (apiKey) {
      return this.authenticateWithApiKey(apiKey, req);
    }

    const token = this.extractBearerToken(req);
    if (!token) {
      throw new UnauthorizedException("Missing bearer token or x-api-key.");
    }

    const supabase = this.getSupabaseClient();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      throw new UnauthorizedException("Invalid or expired token.");
    }

    const role =
      (typeof data.user.app_metadata?.role === "string" &&
        data.user.app_metadata.role) ||
      (typeof data.user.user_metadata?.role === "string" &&
        data.user.user_metadata.role) ||
      "authenticated";

    req.user = {
      userId: data.user.id,
      email: data.user.email ?? "",
      role,
    };

    await this.authService.syncUserFromSupabase(
      req.user.userId,
      req.user.email,
    );

    return true;
  }
}
