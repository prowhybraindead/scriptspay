import { Injectable, Logger } from "@nestjs/common";
import { Role } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Syncs the authenticated Supabase user into our local `User` table.
   * Called after JWT validation to ensure every authenticated user has
   * a corresponding row in our database (upsert by Supabase Auth UUID).
   *
   * @param supabaseUserId - UUID from the JWT `sub` claim
   * @param email          - Email from the JWT claims
   */
  async syncUserFromSupabase(
    supabaseUserId: string,
    email: string,
  ): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: supabaseUserId },
      update: {
        email,
      },
      create: {
        id: supabaseUserId,
        email,
        role: Role.MERCHANT,
      },
    });

    this.logger.log(`syncUserFromSupabase called for ${supabaseUserId}`);
  }
}
