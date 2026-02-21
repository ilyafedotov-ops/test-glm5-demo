import { SetMetadata } from "@nestjs/common";

export const CACHE_KEY = "cache";
export const CACHE_INVALIDATE_KEY = "cache_invalidate";

export interface CacheDecoratorOptions {
  /**
   * Cache key prefix (will be combined with method arguments)
   */
  key: string;

  /**
   * Time to live in seconds
   */
  ttl?: number;

  /**
   * Key prefix for namespacing (e.g., organization ID)
   */
  prefix?: string;
}

export interface CacheInvalidateOptions {
  /**
   * Keys to invalidate
   */
  keys: string[];

  /**
   * Pattern to match and invalidate
   */
  pattern?: string;
}

/**
 * Decorator to cache method results
 *
 * @example
 * ```typescript
 * @Cache({ key: "user", ttl: 3600 })
 * async getUser(id: string) {
 *   return this.prisma.user.findUnique({ where: { id } });
 * }
 * ```
 */
export const Cache = (options: CacheDecoratorOptions) =>
  SetMetadata(CACHE_KEY, options);

/**
 * Decorator to invalidate cache after method execution
 *
 * @example
 * ```typescript
 * @CacheInvalidate({ keys: ["user"], pattern: "user:*" })
 * async updateUser(id: string, data: any) {
 *   return this.prisma.user.update({ where: { id }, data });
 * }
 * ```
 */
export const CacheInvalidate = (options: CacheInvalidateOptions) =>
  SetMetadata(CACHE_INVALIDATE_KEY, options);
