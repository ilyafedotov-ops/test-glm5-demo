"use client";

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  task: { label: "Task", color: "text-violet-600 dark:text-violet-400" },
  incident: { label: "Incident", color: "text-rose-600 dark:text-rose-400" },
  workflow: { label: "Workflow", color: "text-cyan-600 dark:text-cyan-400" },
  violation: { label: "Violation", color: "text-amber-600 dark:text-amber-400" },
  policy: { label: "Policy", color: "text-emerald-600 dark:text-emerald-400" },
  change: { label: "Change", color: "text-blue-600 dark:text-blue-400" },
  user: { label: "User", color: "text-indigo-600 dark:text-indigo-400" },
  team: { label: "Team", color: "text-teal-600 dark:text-teal-400" },
  article: { label: "Article", color: "text-orange-600 dark:text-orange-400" },
};

function parseSystemRecord(value: string) {
  const colonIndex = value.indexOf(":");
  if (colonIndex === -1) return { type: null, id: value };
  const type = value.slice(0, colonIndex);
  const id = value.slice(colonIndex + 1);
  return { type, id };
}

function formatCompactId(id: string) {
  if (id.length <= 14) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

interface SystemRecordBadgeProps {
  value: string;
  compact?: boolean;
}

export function SystemRecordBadge({ value, compact = false }: SystemRecordBadgeProps) {
  const { type, id } = parseSystemRecord(value);
  const meta = type ? TYPE_LABELS[type] : null;
  const displayId = compact ? formatCompactId(id) : id;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/60 text-[11px] text-muted-foreground ${
        compact ? "px-1.5 py-0.5" : "px-2 py-1"
      }`}
      title={value}
    >
      {meta ? (
        <>
          <span className={`font-medium ${meta.color}`}>{meta.label}</span>
          <span className="opacity-40">·</span>
          <span className="font-mono">{displayId}</span>
        </>
      ) : (
        <span className="font-mono">{value}</span>
      )}
    </span>
  );
}
