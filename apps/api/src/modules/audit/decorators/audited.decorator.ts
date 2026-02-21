import { SetMetadata } from "@nestjs/common";

export const AUDIT_LOG_KEY = "audit_log";

export interface AuditLogOptions {
  /**
   * The action being performed (e.g., "create", "update", "delete")
   */
  action: string;

  /**
   * The resource type being acted upon (e.g., "incident", "user")
   */
  resource: string;

  /**
   * Whether to capture the previous value before the change
   */
  capturePreviousValue?: boolean;

  /**
   * Whether to capture the new value after the change
   */
  captureNewValue?: boolean;

  /**
   * Fields to exclude from logging (e.g., passwords)
   */
  excludeFields?: string[];

  /**
   * Custom metadata to include
   */
  metadata?: Record<string, any>;
}

/**
 * Decorator to mark a method for automatic audit logging
 *
 * @example
 * ```typescript
 * @Audited({ action: "create", resource: "incident" })
 * async createIncident(dto: CreateIncidentDto) {
 *   // ...
 * }
 * ```
 */
export const Audited = (options: AuditLogOptions) => SetMetadata(AUDIT_LOG_KEY, options);
