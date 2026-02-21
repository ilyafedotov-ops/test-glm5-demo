"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@nexusops/ui";
import { clsx } from "clsx";

type MetricTone = "violet" | "blue" | "amber" | "emerald" | "rose" | "cyan" | "slate";

interface OperationsMetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: MetricTone;
  hint?: string;
  className?: string;
  valueClassName?: string;
}

const toneClasses: Record<MetricTone, { bg: string; icon: string; glow: string }> = {
  violet: {
    bg: "from-violet-500/10 via-purple-500/5 to-transparent",
    icon: "from-violet-500 to-purple-500",
    glow: "shadow-violet-500/25",
  },
  blue: {
    bg: "from-blue-500/10 via-indigo-500/5 to-transparent",
    icon: "from-blue-500 to-indigo-500",
    glow: "shadow-blue-500/25",
  },
  amber: {
    bg: "from-amber-500/10 via-orange-500/5 to-transparent",
    icon: "from-amber-500 to-orange-500",
    glow: "shadow-amber-500/25",
  },
  emerald: {
    bg: "from-emerald-500/10 via-teal-500/5 to-transparent",
    icon: "from-emerald-500 to-teal-500",
    glow: "shadow-emerald-500/25",
  },
  rose: {
    bg: "from-rose-500/10 via-pink-500/5 to-transparent",
    icon: "from-rose-500 to-pink-500",
    glow: "shadow-rose-500/25",
  },
  cyan: {
    bg: "from-cyan-500/10 via-blue-500/5 to-transparent",
    icon: "from-cyan-500 to-blue-500",
    glow: "shadow-cyan-500/25",
  },
  slate: {
    bg: "from-slate-500/10 via-gray-500/5 to-transparent",
    icon: "from-slate-500 to-gray-500",
    glow: "shadow-slate-500/25",
  },
};

export function OperationsMetricCard({
  label,
  value,
  icon: Icon,
  tone = "violet",
  hint,
  className,
  valueClassName,
}: OperationsMetricCardProps) {
  const styles = toneClasses[tone];

  return (
    <Card variant="glass" className={clsx("group relative overflow-hidden", className)}>
      <div className={clsx("absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-100", styles.bg)} />
      <CardContent className="relative pt-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={clsx("mt-1 text-3xl font-bold", valueClassName)}>{value}</p>
            {hint ? <p className="mt-2 text-xs text-muted-foreground">{hint}</p> : null}
          </div>
          <div className={clsx("h-12 w-12 rounded-2xl bg-gradient-to-br shadow-lg flex items-center justify-center", styles.icon, styles.glow)}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
