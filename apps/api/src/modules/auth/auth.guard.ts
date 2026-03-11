import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Request } from "express";

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

  constructor(private readonly config: ConfigService) {}

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
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token.");
    }

    const token = header.slice("Bearer ".length).trim();
    if (!token) {
      throw new UnauthorizedException("Invalid bearer token.");
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

    return true;
  }
}
