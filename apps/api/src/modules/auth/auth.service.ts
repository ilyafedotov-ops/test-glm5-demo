import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma/prisma.service";
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const permissions = user.roles.flatMap((ur) =>
      ur.role.permissions.map((rp) => ({
        name: rp.permission.name,
        resource: rp.permission.resource,
        action: rp.permission.action,
        conditions: rp.conditions,
      }))
    );

    const payload = {
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
      roles: user.roles.map((r) => r.role.name),
      permissions: permissions.map((p) => p.name),
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        organizationId: user.organizationId,
        roles: user.roles.map((r) => ({ id: r.role.id, name: r.role.name })),
        permissions,
      },
    };
  }

  async refreshToken(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("User not found or inactive");
    }

    const permissions = user.roles.flatMap((ur) =>
      ur.role.permissions.map((rp) => ({
        name: rp.permission.name,
        resource: rp.permission.resource,
        action: rp.permission.action,
        conditions: rp.conditions,
      }))
    );

    const payload = {
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
      roles: user.roles.map((r) => r.role.name),
      permissions: permissions.map((p) => p.name),
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
