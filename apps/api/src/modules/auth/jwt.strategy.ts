import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { AuthenticatedUser } from "./types/authenticated-user";

type JwtPayload = {
  sub?: string;
  companyId?: string;
  role?: AuthenticatedUser["role"];
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secretOrKey = process.env.JWT_SECRET;

    if (!secretOrKey) {
      throw new Error("JWT_SECRET is required");
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    if (!payload.sub || !payload.companyId || !payload.role) {
      throw new UnauthorizedException();
    }

    return {
      userId: payload.sub,
      companyId: payload.companyId,
      role: payload.role
    };
  }
}
