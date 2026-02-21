"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Audited = exports.AUDIT_LOG_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.AUDIT_LOG_KEY = "audit_log";
const Audited = (options) => (0, common_1.SetMetadata)(exports.AUDIT_LOG_KEY, options);
exports.Audited = Audited;
//# sourceMappingURL=audited.decorator.js.map