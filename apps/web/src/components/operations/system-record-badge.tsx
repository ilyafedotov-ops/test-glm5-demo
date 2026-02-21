"use client";

interface SystemRecordBadgeProps {
  value: string;
  compact?: boolean;
}

export function SystemRecordBadge({ value, compact = false }: SystemRecordBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md border border-border/60 bg-muted/60 font-mono text-[11px] text-muted-foreground ${
        compact ? "px-1.5 py-0.5" : "px-2 py-1"
      }`}
      title={value}
    >
      {value}
    </span>
  );
}
