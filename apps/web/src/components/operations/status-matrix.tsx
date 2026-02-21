"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@nexusops/ui";

interface StatusMatrixItem {
  name: string;
  value: number;
  target?: number;
  hint?: string;
}

interface StatusMatrixProps {
  title: string;
  items: StatusMatrixItem[];
}

function getPercent(value: number, target?: number): number {
  if (!target || target <= 0) {
    return 100;
  }
  return Math.max(0, Math.min(100, Math.round((value / target) * 100)));
}

export function StatusMatrix({ title, items }: StatusMatrixProps) {
  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => {
          const percent = getPercent(item.value, item.target);
          return (
            <div key={item.name} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.name}</span>
                <span className="font-semibold">{item.value}</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
              {item.hint && <p className="text-xs text-muted-foreground">{item.hint}</p>}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
