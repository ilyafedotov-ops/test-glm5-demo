import React from "react";
import { ColumnDef, DeepKeys } from "@tanstack/react-table";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";

/**
 * Column helper factory for creating typed column definitions
 */
export function createColumnHelper<TData>() {
  return {
    /**
     * Create a basic text column
     */
    text<TKey extends DeepKeys<TData>>(
      accessor: TKey,
      header: string,
      options?: {
        size?: number;
        enableSorting?: boolean;
        enableFiltering?: boolean;
        cell?: (value: any, row: TData) => React.ReactNode;
      }
    ): ColumnDef<TData> {
      return {
        accessorKey: accessor as string,
        header,
        size: options?.size ?? 150,
        enableSorting: options?.enableSorting ?? true,
        enableColumnFilter: options?.enableFiltering ?? false,
        cell: options?.cell
          ? ({ getValue, row }) => options.cell!(getValue(), row.original)
          : undefined,
      };
    },

    /**
     * Create a date column with formatting
     */
    date<TKey extends DeepKeys<TData>>(
      accessor: TKey,
      header: string,
      options?: {
        format?: string;
        size?: number;
      }
    ): ColumnDef<TData> {
      return {
        accessorKey: accessor as string,
        header,
        size: options?.size ?? 150,
        cell: ({ getValue }) => {
          const value = getValue() as string | Date | null;
          if (!value) return <span className="text-muted-foreground">—</span>;
          try {
            return format(new Date(value), options?.format ?? "MMM d, yyyy");
          } catch {
            return <span className="text-muted-foreground">Invalid</span>;
          }
        },
      };
    },

    /**
     * Create a datetime column with formatting
     */
    datetime<TKey extends DeepKeys<TData>>(
      accessor: TKey,
      header: string,
      options?: {
        format?: string;
        size?: number;
      }
    ): ColumnDef<TData> {
      return this.date(accessor, header, {
        format: options?.format ?? "MMM d, yyyy h:mm a",
        size: options?.size ?? 180,
      });
    },

    /**
     * Create a status badge column
     */
    status<TKey extends DeepKeys<TData>>(
      accessor: TKey,
      header: string,
      config: Record<
        string,
        {
          label: string;
          color: string;
          bgColor: string;
          icon?: React.ComponentType<{ className?: string }>;
        }
      >,
      options?: { size?: number }
    ): ColumnDef<TData> {
      return {
        accessorKey: accessor as string,
        header,
        size: options?.size ?? 120,
        cell: ({ getValue }) => {
          const value = getValue() as string;
          const cfg = config[value] ?? {
            label: value,
            color: "text-gray-600",
            bgColor: "bg-gray-500/10",
          };
          const Icon = cfg.icon;

          return (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${cfg.bgColor} ${cfg.color}`}
            >
              {Icon && <Icon className="h-3 w-3" />}
              {cfg.label}
            </span>
          );
        },
      };
    },

    /**
     * Create a priority badge column
     */
    priority<TKey extends DeepKeys<TData>>(
      accessor: TKey,
      header: string = "Priority",
      options?: { size?: number }
    ): ColumnDef<TData> {
      const config: Record<string, { label: string; gradient: string }> = {
        critical: { label: "Critical", gradient: "from-rose-500 to-pink-500" },
        high: { label: "High", gradient: "from-orange-500 to-amber-500" },
        medium: { label: "Medium", gradient: "from-amber-500 to-yellow-500" },
        low: { label: "Low", gradient: "from-emerald-500 to-teal-500" },
      };

      return {
        accessorKey: accessor as string,
        header,
        size: options?.size ?? 100,
        cell: ({ getValue }) => {
          const value = getValue() as string;
          const cfg = config[value] ?? {
            label: value,
            gradient: "from-gray-400 to-gray-500",
          };

          return (
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gradient-to-r ${cfg.gradient} text-white`}
            >
              {cfg.label}
            </span>
          );
        },
      };
    },

    /**
     * Create a user/avatar column
     */
    user<TKey extends DeepKeys<TData>>(
      accessor: TKey,
      header: string = "User",
      options?: {
        size?: number;
        nameField?: string;
        avatarField?: string;
      }
    ): ColumnDef<TData> {
      return {
        accessorKey: accessor as string,
        header,
        size: options?.size ?? 180,
        cell: ({ row }) => {
          const user = row.getValue(accessor as string) as {
            firstName?: string;
            lastName?: string;
            email?: string;
            avatarUrl?: string;
          } | null;

          if (!user) {
            return <span className="text-muted-foreground">Unassigned</span>;
          }

          const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
          const initials = name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2);

          return (
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={name || user.email || "User avatar"}
                    width={28}
                    height={28}
                    className="aspect-square h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <AvatarFallback className="text-xs bg-gradient-to-br from-violet-500 to-purple-500 text-white">
                    {initials || "?"}
                  </AvatarFallback>
                )}
              </Avatar>
              <span className="font-medium truncate">{name || user.email}</span>
            </div>
          );
        },
      };
    },

    /**
     * Create a number column with formatting
     */
    number<TKey extends DeepKeys<TData>>(
      accessor: TKey,
      header: string,
      options?: {
        format?: (value: number) => string;
        size?: number;
        align?: "left" | "right" | "center";
      }
    ): ColumnDef<TData> {
      return {
        accessorKey: accessor as string,
        header,
        size: options?.size ?? 100,
        cell: ({ getValue }) => {
          const value = getValue() as number | null;
          if (value === null || value === undefined) {
            return <span className="text-muted-foreground">—</span>;
          }
          const formatted = options?.format ? options.format(value) : value.toLocaleString();
          return (
            <span className={options?.align === "right" ? "text-right block" : ""}>
              {formatted}
            </span>
          );
        },
      };
    },

    /**
     * Create a boolean column with icons
     */
    boolean<TKey extends DeepKeys<TData>>(
      accessor: TKey,
      header: string,
      options?: {
        trueLabel?: string;
        falseLabel?: string;
        size?: number;
      }
    ): ColumnDef<TData> {
      return {
        accessorKey: accessor as string,
        header,
        size: options?.size ?? 80,
        cell: ({ getValue }) => {
          const value = getValue() as boolean;
          return (
            <span className="flex items-center">
              {value ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <XCircle className="h-4 w-4 text-gray-400" />
              )}
            </span>
          );
        },
      };
    },

    /**
     * Create a tags column
     */
    tags<TKey extends DeepKeys<TData>>(
      accessor: TKey,
      header: string = "Tags",
      options?: {
        maxVisible?: number;
        size?: number;
      }
    ): ColumnDef<TData> {
      const maxVisible = options?.maxVisible ?? 3;

      return {
        accessorKey: accessor as string,
        header,
        size: options?.size ?? 200,
        cell: ({ getValue }) => {
          const tags = getValue() as string[];
          if (!tags || tags.length === 0) {
            return <span className="text-muted-foreground">—</span>;
          }

          return (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, maxVisible).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {tags.length > maxVisible && (
                <Badge variant="secondary" className="text-xs">
                  +{tags.length - maxVisible}
                </Badge>
              )}
            </div>
          );
        },
      };
    },

    /**
     * Create a relative time column (e.g., "2 hours ago")
     */
    relativeTime<TKey extends DeepKeys<TData>>(
      accessor: TKey,
      header: string,
      options?: { size?: number }
    ): ColumnDef<TData> {
      return {
        accessorKey: accessor as string,
        header,
        size: options?.size ?? 120,
        cell: ({ getValue }) => {
          const value = getValue() as string | Date | null;
          if (!value) return <span className="text-muted-foreground">—</span>;

          const date = new Date(value);
          const now = new Date();
          const diffMs = now.getTime() - date.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMins / 60);
          const diffDays = Math.floor(diffHours / 24);

          let relative: string;
          if (diffMins < 1) {
            relative = "Just now";
          } else if (diffMins < 60) {
            relative = `${diffMins}m ago`;
          } else if (diffHours < 24) {
            relative = `${diffHours}h ago`;
          } else if (diffDays < 7) {
            relative = `${diffDays}d ago`;
          } else {
            relative = format(date, "MMM d");
          }

          return (
            <span className="text-muted-foreground text-sm" title={format(date, "PPpp")}>
              {relative}
            </span>
          );
        },
      };
    },

    /**
     * Create a SLA status column
     */
    sla<TKey extends DeepKeys<TData>>(
      accessor: TKey,
      header: string = "SLA",
      options?: { size?: number }
    ): ColumnDef<TData> {
      return {
        accessorKey: accessor as string,
        header,
        size: options?.size ?? 100,
        cell: ({ getValue }) => {
          const value = getValue() as {
            status?: "on_track" | "at_risk" | "breached" | "completed";
            minutesRemaining?: number;
          } | null;

          if (!value) return <span className="text-muted-foreground">—</span>;

          const statusConfig = {
            on_track: { color: "text-emerald-500", icon: CheckCircle2 },
            at_risk: { color: "text-amber-500", icon: Clock },
            breached: { color: "text-rose-500", icon: AlertTriangle },
            completed: { color: "text-blue-500", icon: CheckCircle2 },
          };

          const cfg = statusConfig[value.status ?? "on_track"];
          const Icon = cfg.icon;

          const formatTime = (mins: number): string => {
            if (mins < 0) return `${Math.abs(mins)}m over`;
            if (mins < 60) return `${mins}m`;
            return `${Math.floor(mins / 60)}h ${mins % 60}m`;
          };

          return (
            <div className={`flex items-center gap-1.5 ${cfg.color}`}>
              <Icon className="h-4 w-4" />
              <span className="text-sm">
                {value.status === "completed"
                  ? "Done"
                  : value.minutesRemaining !== undefined
                    ? formatTime(value.minutesRemaining)
                    : value.status?.replace("_", " ")}
              </span>
            </div>
          );
        },
      };
    },

    /**
     * Create an actions column with dropdown menu
     */
    actions(
      render: (row: TData) => React.ReactNode,
      options?: { size?: number }
    ): ColumnDef<TData> {
      return {
        id: "actions",
        header: "",
        size: options?.size ?? 50,
        enableSorting: false,
        enablePinning: true,
        cell: ({ row }) => render(row.original),
      } as ColumnDef<TData>;
    },
  };
}
