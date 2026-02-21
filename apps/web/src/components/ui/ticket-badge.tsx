"use client";

import { Ticket, AlertTriangle, Wrench, FileText } from "lucide-react";

interface TicketNumberBadgeProps {
  ticketNumber: string;
  compact?: boolean;
}

export function TicketNumberBadge({ ticketNumber, compact = false }: TicketNumberBadgeProps) {
  const prefix = ticketNumber.split("-")[0];
  
  const config = {
    INC: {
      icon: AlertTriangle,
      gradient: "from-rose-500 to-pink-500",
      bg: "bg-rose-500/10",
      text: "text-rose-600 dark:text-rose-400",
      label: "Incident",
    },
    PRB: {
      icon: Wrench,
      gradient: "from-purple-500 to-violet-500",
      bg: "bg-purple-500/10",
      text: "text-purple-600 dark:text-purple-400",
      label: "Problem",
    },
    CHG: {
      icon: FileText,
      gradient: "from-blue-500 to-cyan-500",
      bg: "bg-blue-500/10",
      text: "text-blue-600 dark:text-blue-400",
      label: "Change",
    },
    REQ: {
      icon: Ticket,
      gradient: "from-emerald-500 to-teal-500",
      bg: "bg-emerald-500/10",
      text: "text-emerald-600 dark:text-emerald-400",
      label: "Request",
    },
  };

  const ticketConfig = config[prefix as keyof typeof config] || config.INC;
  const { icon: Icon, bg, text, gradient } = ticketConfig;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-xs font-semibold ${bg} ${text}`}>
        {ticketNumber}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${bg} border border-white/10`}>
      <div className={`p-1.5 rounded-lg bg-gradient-to-br ${gradient}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <span className={`font-mono text-sm font-bold ${text}`}>{ticketNumber}</span>
    </div>
  );
}

// Channel badge
interface ChannelBadgeProps {
  channel: string;
}

export function ChannelBadge({ channel }: ChannelBadgeProps) {
  const channels: Record<string, { icon: string; color: string }> = {
    portal: { icon: "🌐", color: "bg-blue-500/10 text-blue-600" },
    email: { icon: "📧", color: "bg-purple-500/10 text-purple-600" },
    phone: { icon: "📞", color: "bg-emerald-500/10 text-emerald-600" },
    chat: { icon: "💬", color: "bg-amber-500/10 text-amber-600" },
    api: { icon: "🔌", color: "bg-slate-500/10 text-slate-600" },
  };

  const config = channels[channel] || channels["portal"];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
      <span>{config.icon}</span>
      <span className="capitalize">{channel}</span>
    </span>
  );
}
