"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditInterceptor = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const rxjs_1 = require("rxjs");
const audited_decorator_1 = require("../decorators/audited.decorator");
const prisma_service_1 = require("@/prisma/prisma.service");
let AuditInterceptor = class AuditInterceptor {
    reflector;
    prisma;
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    intercept(context, next) {
        const auditOptions = this.reflector.get(audited_decorator_1.AUDIT_LOG_KEY, context.getHandler());
        if (!auditOptions || !this.prisma) {
            return next.handle();
        }
        const request = context.switchToHttp().getRequest();
        const auditContext = this.extractAuditContext(request);
        let previousValuePromise = null;
        if (auditOptions.capturePreviousValue) {
            previousValuePromise = this.capturePreviousValue(auditOptions, request.params, request.body);
        }
        return next.handle().pipe((0, rxjs_1.tap)(async (response) => {
            const previousValue = previousValuePromise ? await previousValuePromise : null;
            const newValue = auditOptions.captureNewValue ? this.extractNewValue(response) : null;
            await this.createAuditLog(auditOptions, auditContext, previousValue, newValue, request);
        }), (0, rxjs_1.catchError)((error) => {
            throw error;
        }));
    }
    extractAuditContext(request) {
        const user = request.user;
        return {
            organizationId: user?.organizationId,
            userId: user?.userId,
            correlationId: request.correlationId || request.headers["x-correlation-id"],
            ipAddress: this.extractIpAddress(request),
            userAgent: request.headers["user-agent"],
        };
    }
    async capturePreviousValue(options, params, body) {
        const resourceId = params?.id || body?.id;
        if (!resourceId || !this.prisma) {
            return null;
        }
        try {
            const model = this.prisma[options.resource];
            if (model && typeof model.findUnique === "function") {
                return await model.findUnique({
                    where: { id: resourceId },
                });
            }
        }
        catch (error) {
        }
        return null;
    }
    extractNewValue(response) {
        if (!response)
            return null;
        if (response.data) {
            return this.sanitizeValue(response.data);
        }
        return this.sanitizeValue(response);
    }
    sanitizeValue(value) {
        if (!value || typeof value !== "object")
            return value;
        const sensitiveFields = ["password", "passwordHash", "token", "secret", "apiKey"];
        const sanitized = { ...value };
        for (const field of sensitiveFields) {
            if (sanitized[field]) {
                sanitized[field] = "[REDACTED]";
            }
        }
        return sanitized;
    }
    async createAuditLog(options, context, previousValue, newValue, request) {
        try {
            await this.prisma.auditLog.create({
                data: {
                    organizationId: context.organizationId,
                    actorId: context.userId,
                    actorType: context.userId ? "user" : "system",
                    action: options.action,
                    resource: options.resource,
                    resourceId: request.params?.id || request.body?.id,
                    previousValue: previousValue ? this.sanitizeValue(previousValue) : null,
                    newValue: newValue ? this.sanitizeValue(newValue) : null,
                    metadata: options.metadata || {},
                    ipAddress: context.ipAddress,
                    userAgent: context.userAgent,
                    correlationId: context.correlationId || "unknown",
                },
            });
        }
        catch (error) {
            console.error("Failed to create audit log:", error);
        }
    }
    extractIpAddress(request) {
        const forwarded = request.headers["x-forwarded-for"];
        if (forwarded) {
            const ips = Array.isArray(forwarded) ? forwarded : forwarded.split(",");
            return ips[0].trim();
        }
        return request.socket?.remoteAddress || "unknown";
    }
};
exports.AuditInterceptor = AuditInterceptor;
exports.AuditInterceptor = AuditInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Optional)()),
    __param(1, (0, common_1.Inject)(prisma_service_1.PrismaService)),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService])
], AuditInterceptor);
//# sourceMappingURL=audit.interceptor.js.map