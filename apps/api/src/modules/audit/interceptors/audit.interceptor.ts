import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Optional,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, tap, catchError } from "rxjs";
import { AUDIT_LOG_KEY, AuditLogOptions } from "../decorators/audited.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { Request } from "express";

interface AuditContext {
  organizationId?: string;
  userId?: string;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    @Optional()
    @Inject(PrismaService)
    private readonly prisma?: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditOptions = this.reflector.get<AuditLogOptions>(
      AUDIT_LOG_KEY,
      context.getHandler(),
    );

    // If not audited, just continue
    if (!auditOptions || !this.prisma) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const auditContext = this.extractAuditContext(request);

    // Capture previous value if needed
    let previousValuePromise: Promise<any> | null = null;
    if (auditOptions.capturePreviousValue) {
      previousValuePromise = this.capturePreviousValue(
        auditOptions,
        request.params,
        request.body,
      );
    }

    return next.handle().pipe(
      tap(async (response) => {
        // Wait for previous value if capturing
        const previousValue = previousValuePromise ? await previousValuePromise : null;

        // Extract new value from response if capturing
        const newValue = auditOptions.captureNewValue ? this.extractNewValue(response) : null;

        // Create audit log
        await this.createAuditLog(auditOptions, auditContext, previousValue, newValue, request);
      }),
      catchError((error) => {
        // Optionally log failed operations
        throw error;
      }),
    );
  }

  private extractAuditContext(request: Request): AuditContext {
    const user = (request as any).user;
    return {
      organizationId: user?.organizationId,
      userId: user?.userId,
      correlationId: (request as any).correlationId || request.headers["x-correlation-id"] as string,
      ipAddress: this.extractIpAddress(request),
      userAgent: request.headers["user-agent"],
    };
  }

  private async capturePreviousValue(
    options: AuditLogOptions,
    params: any,
    body: any,
  ): Promise<any> {
    // This is a simplified version - in production, you'd query the actual entity
    // based on the resource type and ID from params
    const resourceId = params?.id || body?.id;
    if (!resourceId || !this.prisma) {
      return null;
    }

    try {
      const model = this.prisma[options.resource as keyof PrismaService];
      if (model && typeof (model as any).findUnique === "function") {
        return await (model as any).findUnique({
          where: { id: resourceId },
        });
      }
    } catch {
      // Ignore errors in capturing previous value
    }

    return null;
  }

  private extractNewValue(response: any): any {
    if (!response) return null;

    // If response has a data property, extract it
    if (response.data) {
      return this.sanitizeValue(response.data);
    }

    return this.sanitizeValue(response);
  }

  private sanitizeValue(value: any): any {
    if (!value || typeof value !== "object") return value;

    const sensitiveFields = ["password", "passwordHash", "token", "secret", "apiKey"];
    const sanitized = { ...value };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = "[REDACTED]";
      }
    }

    return sanitized;
  }

  private async createAuditLog(
    options: AuditLogOptions,
    context: AuditContext,
    previousValue: any,
    newValue: any,
    request: Request,
  ): Promise<void> {
    try {
      await this.prisma!.auditLog.create({
        data: {
          organizationId: context.organizationId,
          actorId: context.userId,
          actorType: context.userId ? "user" : "system",
          action: options.action,
          resource: options.resource,
          resourceId: request.params?.id || (request.body as any)?.id,
          previousValue: previousValue ? this.sanitizeValue(previousValue) : null,
          newValue: newValue ? this.sanitizeValue(newValue) : null,
          metadata: options.metadata || {},
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          correlationId: context.correlationId || "unknown",
        },
      });
    } catch (error) {
      // Don't fail the request if audit logging fails
      console.error("Failed to create audit log:", error);
    }
  }

  private extractIpAddress(request: Request): string {
    const forwarded = request.headers["x-forwarded-for"];
    if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded : forwarded.split(",");
      return ips[0].trim();
    }
    return request.socket?.remoteAddress || "unknown";
  }
}
