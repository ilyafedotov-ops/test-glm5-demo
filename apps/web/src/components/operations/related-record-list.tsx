"use client";

import Link from "next/link";

interface RelatedRecord {
  type: string;
  id: string;
  systemRecordId: string;
  relationship?: string;
}

interface RelatedRecordListProps {
  records: RelatedRecord[];
}

function toHref(type: string, id: string): string | null {
  const normalizedType = type.toLowerCase();
  if (normalizedType === "incident") return `/incidents/${id}`;
  if (normalizedType === "task") return `/tasks/${id}`;
  if (normalizedType === "workflow") return `/workflows/${id}`;
  if (normalizedType === "violation") return `/violations/${id}`;
  if (normalizedType === "policy") return `/compliance/${id}`;
  if (normalizedType === "audit_log") return `/audit-logs`;
  return null;
}

export function RelatedRecordList({ records }: RelatedRecordListProps) {
  if (!records.length) {
    return <span className="text-xs text-muted-foreground">No linked records</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {records.slice(0, 6).map((record) => {
        const href = toHref(record.type, record.id);
        const content = (
          <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-2 py-1 text-[11px] text-foreground">
            <span className="font-semibold uppercase tracking-wide text-muted-foreground">
              {record.type}
            </span>
            <span className="font-mono text-muted-foreground">{record.id.slice(0, 8)}</span>
          </span>
        );

        if (!href) {
          return (
            <span key={`${record.relationship}-${record.systemRecordId}`} title={record.relationship}>
              {content}
            </span>
          );
        }

        return (
          <Link
            key={`${record.relationship}-${record.systemRecordId}`}
            href={href}
            title={record.relationship}
            className="transition-transform hover:-translate-y-0.5"
          >
            {content}
          </Link>
        );
      })}
    </div>
  );
}
