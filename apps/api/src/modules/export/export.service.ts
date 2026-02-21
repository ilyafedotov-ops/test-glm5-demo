import { Injectable } from "@nestjs/common";

@Injectable()
export class ExportService {
  toCSV(data: any[], fields: string[]): string {
    if (!data || data.length === 0) {
      return "";
    }

    // Header
    const header = fields.join(",");

    // Rows
    const rows = data.map((item) => {
      return fields
        .map((field) => {
          let value = this.getNestedValue(item, field);
          
          // Handle null/undefined
          if (value === null || value === undefined) {
            return "";
          }
          
          // Convert to string
          value = String(value);
          
          // Escape quotes and wrap in quotes if contains comma or quote
          if (value.includes(",") || value.includes('"') || value.includes("\n")) {
            value = '"' + value.replace(/"/g, '""') + '"';
          }
          
          return value;
        })
        .join(",");
    });

    return header + "\n" + rows.join("\n");
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  formatExportFilename(prefix: string): string {
    const date = new Date().toISOString().split("T")[0];
    return `${prefix}_export_${date}.csv`;
  }
}
