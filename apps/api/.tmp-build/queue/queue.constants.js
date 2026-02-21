"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_JOB_OPTIONS = exports.QUEUE_NAMES = void 0;
exports.QUEUE_NAMES = {
    REPORTS: "reports",
    NOTIFICATIONS: "notifications",
    WORKFLOWS: "workflows",
    AUDIT: "audit",
    EMAIL: "email",
};
exports.DEFAULT_JOB_OPTIONS = {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
        type: "exponential",
        delay: 1000,
    },
};
//# sourceMappingURL=queue.constants.js.map