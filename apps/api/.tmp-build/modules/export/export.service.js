"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportService = void 0;
const common_1 = require("@nestjs/common");
let ExportService = class ExportService {
    toCSV(data, fields) {
        if (!data || data.length === 0) {
            return "";
        }
        const header = fields.join(",");
        const rows = data.map((item) => {
            return fields
                .map((field) => {
                let value = this.getNestedValue(item, field);
                if (value === null || value === undefined) {
                    return "";
                }
                value = String(value);
                if (value.includes(",") || value.includes('"') || value.includes("\n")) {
                    value = '"' + value.replace(/"/g, '""') + '"';
                }
                return value;
            })
                .join(",");
        });
        return header + "\n" + rows.join("\n");
    }
    getNestedValue(obj, path) {
        return path.split(".").reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : null;
        }, obj);
    }
    formatExportFilename(prefix) {
        const date = new Date().toISOString().split("T")[0];
        return `${prefix}_export_${date}.csv`;
    }
};
exports.ExportService = ExportService;
exports.ExportService = ExportService = __decorate([
    (0, common_1.Injectable)()
], ExportService);
//# sourceMappingURL=export.service.js.map