"use client";

import { useEffect, useState } from "react";
import { Clock, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "./badge";

interface SLAIndicatorProps {
  dueAt: string | Date;
  type?: "response" | "resolution";
  compact?: boolean;
}

type SLAStatus = "on_track" | "at_risk" | "breached";

function formatTimeRemaining(mins: number): string {
  if (mins < 60) {
    return `${mins}m`;
  } else if (mins < 1440) {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  } else {
    const days = Math.floor(mins / 1440);
    const hours = Math.floor((mins % 1440) / 60);
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
}

function formatOverdue(mins: number): string {
  const prefix = mins > 0 ? "+" : "";
  return `${prefix}${formatTimeRemaining(mins)}`;
}

export function SLAIndicator({ dueAt, type = "response", compact = false }: SLAIndicatorProps) {
  const [status, setStatus] = useState<SLAStatus>("on_track");
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const due = new Date(dueAt);
      const diffMs = due.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      // Determine status
      if (diffMs < 0) {
        setStatus("breached");
        setTimeRemaining(formatOverdue(Math.abs(diffMins)));
      } else if (diffMins < 30) {
        setStatus("at_risk");
        setTimeRemaining(formatTimeRemaining(diffMins));
      } else {
        setStatus("on_track");
        setTimeRemaining(formatTimeRemaining(diffMins));
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [dueAt]);

  const config = {
    on_track: {
      icon: CheckCircle,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    at_risk: {
      icon: AlertTriangle,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    breached: {
      icon: XCircle,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
    },
  };

  const { icon: Icon, color, bg, border } = config[status];

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg ${bg} ${border} border`}>
        <Icon className={`h-3.5 w-3.5 ${color}`} />
        <span className={`text-xs font-medium ${color}`}>{timeRemaining}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl ${bg} ${border} border`}>
      <div className={`p-2 rounded-lg ${bg}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {type === "response" ? "Response SLA" : "Resolution SLA"}
          </span>
          <Badge variant={status === "breached" ? "destructive" : status === "at_risk" ? "warning" : "success"}>
            {status.replace("_", " ")}
          </Badge>
        </div>
        <div className={`text-sm font-semibold ${color} flex items-center gap-1 mt-1`}>
          <Clock className="h-3.5 w-3.5" />
          {timeRemaining}
          {status === "breached" && <span className="text-xs ml-1">overdue</span>}
        </div>
      </div>
    </div>
  );
}
