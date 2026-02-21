import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET") || "default-secret-change-me",
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    organizationId: string;
    roles: string[];
    permissions: string[];
  }) {
    return {
      userId: payload.sub,
      email: payload.email,
      organizationId: payload.organizationId,
      roles: payload.roles,
      permissions: payload.permissions,
    };
  }
}
