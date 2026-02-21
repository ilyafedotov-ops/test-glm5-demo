import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { REQUIRED_PERMISSIONS_KEY } from "../decorators/permissions.decorator";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];

    // No permission metadata means endpoint is allowed.
    if (requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as
      | {
          roles?: string[];
          permissions?: string[];
        }
      | undefined;

    if (!user) {
      throw new ForbiddenException("Missing authentication context");
    }

    const userRoles = user.roles || [];
    const userPermissions = user.permissions || [];

    if (userRoles.includes("admin") || userPermissions.includes("admin:all")) {
      return true;
    }

    const hasRequiredPermission = requiredPermissions.some((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasRequiredPermission) {
      throw new ForbiddenException("Insufficient permissions");
    }

    return true;
  }
}
