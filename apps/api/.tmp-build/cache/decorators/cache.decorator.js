"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheInvalidate = exports.Cache = exports.CACHE_INVALIDATE_KEY = exports.CACHE_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.CACHE_KEY = "cache";
exports.CACHE_INVALIDATE_KEY = "cache_invalidate";
const Cache = (options) => (0, common_1.SetMetadata)(exports.CACHE_KEY, options);
exports.Cache = Cache;
const CacheInvalidate = (options) => (0, common_1.SetMetadata)(exports.CACHE_INVALIDATE_KEY, options);
exports.CacheInvalidate = CacheInvalidate;
//# sourceMappingURL=cache.decorator.js.map