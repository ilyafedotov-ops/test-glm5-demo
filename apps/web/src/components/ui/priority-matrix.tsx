"use client";

import { useState, useEffect } from "react";
import { Badge } from "./badge";

interface PriorityMatrixSelectorProps {
  impact?: string;
  urgency?: string;
  onImpactChange?: (impact: string) => void;
  onUrgencyChange?: (urgency: string) => void;
  onPriorityChange?: (priority: string) => void;
  showPreview?: boolean;
  disabled?: boolean;
}

const PRIORITY_MATRIX: Record<string, Record<string, string>> = {
  critical: {
    critical: "critical",
    high: "critical",
    medium: "high",
    low: "medium",
  },
  high: {
    critical: "critical",
    high: "high",
    medium: "high",
    low: "medium",
  },
  medium: {
    critical: "high",
    high: "high",
    medium: "medium",
    low: "low",
  },
  low: {
    critical: "medium",
    high: "medium",
    medium: "low",
    low: "low",
  },
};

const priorityColors: Record<string, string> = {
  critical: "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30",
  high: "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30",
  medium: "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30",
  low: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
};

const levels = ["critical", "high", "medium", "low"];

export function PriorityMatrixSelector({
  impact = "medium",
  urgency = "medium",
  onImpactChange,
  onUrgencyChange,
  onPriorityChange,
  showPreview = true,
  disabled = false,
}: PriorityMatrixSelectorProps) {
  const [calculatedPriority, setCalculatedPriority] = useState<string>("medium");

  useEffect(() => {
    const priority = PRIORITY_MATRIX[impact]?.[urgency] || "medium";
    setCalculatedPriority(priority);
    onPriorityChange?.(priority);
  }, [impact, urgency, onPriorityChange]);

  const buttonClass = (level: string, currentValue: string, type: "impact" | "urgency") => {
    const isSelected = level === currentValue;
    const baseClasses = "px-4 py-2 rounded-lg text-sm font-medium transition-all border";
    
    if (disabled) {
      return `${baseClasses} opacity-50 cursor-not-allowed bg-muted/50 border-white/10 text-muted-foreground`;
    }
    
    if (isSelected) {
      const colorClass = priorityColors[level];
      return `${baseClasses} ${colorClass} ring-2 ring-offset-2 ring-offset-background`;
    }
    
    return `${baseClasses} bg-white/5 border-white/10 hover:bg-white/10 text-foreground`;
  };

  return (
    <div className="space-y-4">
      {/* Impact Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Impact</label>
        <p className="text-xs text-muted-foreground">
          How widespread is the impact of this incident?
        </p>
        <div className="flex gap-2 flex-wrap">
          {levels.map((level) => (
            <button
              key={level}
              type="button"
              disabled={disabled}
              onClick={() => onImpactChange?.(level)}
              className={buttonClass(level, impact, "impact")}
            >
              <span className="capitalize">{level}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Urgency Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Urgency</label>
        <p className="text-xs text-muted-foreground">
          How quickly does this need to be resolved?
        </p>
        <div className="flex gap-2 flex-wrap">
          {levels.map((level) => (
            <button
              key={level}
              type="button"
              disabled={disabled}
              onClick={() => onUrgencyChange?.(level)}
              className={buttonClass(level, urgency, "urgency")}
            >
              <span className="capitalize">{level}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Priority Preview */}
      {showPreview && (
        <div className="p-4 rounded-xl bg-muted/50 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Calculated Priority</p>
              <p className="text-xs text-muted-foreground mt-1">
                Based on Impact ({impact}) × Urgency ({urgency})
              </p>
            </div>
            <Badge
              variant="outline"
              className={`px-4 py-2 text-base font-semibold ${priorityColors[calculatedPriority]}`}
            >
              {calculatedPriority.toUpperCase()}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}

// Mini version for inline display
export function PriorityBadge({ priority }: { priority: string }) {
  const colorClass = priorityColors[priority] || priorityColors["medium"];
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold ${colorClass} border`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}

// Impact/Urgency badge
export function ImpactUrgencyBadge({ impact, urgency }: { impact: string; urgency: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${priorityColors[impact]}`}>
        I: {impact.charAt(0).toUpperCase()}
      </span>
      <span className="text-muted-foreground">×</span>
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${priorityColors[urgency]}`}>
        U: {urgency.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}
