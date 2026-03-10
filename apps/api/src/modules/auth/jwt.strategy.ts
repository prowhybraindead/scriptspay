import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";

/**
 * Validates JWTs issued by Supabase Auth.
 * The JWKS endpoint or SUPABASE_JWT_SECRET from env is used to verify tokens.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>("SUPABASE_JWT_SECRET"),
    });
  }

  /**
   * Called after token is verified. The `payload` contains Supabase Auth claims:
   * - sub: user UUID
   * - email: user email
   * - role: authenticated
   * - aud: authenticated
   */
  async validate(payload: {
    sub: string;
    email: string;
    role: string;
  }): Promise<{ userId: string; email: string; role: string }> {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
