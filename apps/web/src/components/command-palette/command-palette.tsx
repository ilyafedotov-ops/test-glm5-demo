"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";
import {
  Search,
  Command,
  ArrowRight,
  Clock,
  FileText,
  Settings,
  Users,
  Shield,
  AlertTriangle,
  CheckSquare,
  GitBranch,
  BarChart3,
  Home,
  Plus,
  Download,
  LogOut,
  HelpCircle,
  Moon,
  Sun,
  Layers,
  Star,
  Trash2,
} from "lucide-react";

// Types
export interface CommandAction {
  id: string;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  shortcut?: string[];
  category?: string;
  keywords?: string[];
  action: () => void | Promise<void>;
  disabled?: boolean;
}

export interface CommandGroup {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  priority?: number;
}

export interface CommandPaletteProps {
  commands: CommandAction[];
  groups?: CommandGroup[];
  recentCommands?: string[];
  maxRecent?: number;
  onRecentChange?: (recent: string[]) => void;
  isOpen: boolean;
  onClose: () => void;
  placeholder?: string;
  emptyMessage?: string;
}

// Fuzzy search utility
function fuzzyMatch(text: string, query: string): { score: number; matches: number[] } {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  if (!query) return { score: 100, matches: [] };
  if (textLower === queryLower) return { score: 100, matches: [] };

  let score = 0;
  let matches: number[] = [];
  let queryIndex = 0;

  for (let i = 0; i < text.length && queryIndex < query.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      score += 10;
      if (i === 0 || text[i - 1] === " ") {
        score += 10; // Bonus for word start
      }
      matches.push(i);
      queryIndex++;
    }
  }

  if (queryIndex < query.length) {
    return { score: 0, matches: [] };
  }

  return { score, matches };
}

// Icon map for rendering
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Home,
  file: FileText,
  settings: Settings,
  users: Users,
  shield: Shield,
  alert: AlertTriangle,
  tasks: CheckSquare,
  workflow: GitBranch,
  chart: BarChart3,
  plus: Plus,
  download: Download,
  logout: LogOut,
  help: HelpCircle,
  moon: Moon,
  sun: Sun,
  layers: Layers,
  star: Star,
  trash: Trash2,
};

export function CommandPalette({
  commands,
  groups = [],
  recentCommands = [],
  maxRecent = 5,
  onRecentChange,
  isOpen,
  onClose,
  placeholder = "Type a command or search...",
  emptyMessage = "No commands found",
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query) {
      // Show recent commands first, then all commands
      const recent = recentCommands
        .map((id) => commands.find((c) => c.id === id))
        .filter(Boolean) as CommandAction[];

      return { recent, all: commands };
    }

    // Fuzzy search
    const results = commands
      .map((cmd) => {
        const labelMatch = fuzzyMatch(cmd.label, query);
        const descMatch = cmd.description ? fuzzyMatch(cmd.description, query) : { score: 0, matches: [] };
        const keywordMatch = cmd.keywords
          ? Math.max(...cmd.keywords.map((k) => fuzzyMatch(k, query).score))
          : 0;

        const score = Math.max(labelMatch.score, descMatch.score * 0.7, keywordMatch * 0.5);

        return { cmd, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ cmd }) => cmd);

    return { recent: [], all: results };
  }, [commands, query, recentCommands]);

  // Group commands
  const groupedCommands = useMemo(() => {
    const groupsMap = new Map<string, { group: CommandGroup | null; commands: CommandAction[] }>();

    // Add recent group
    if (filteredCommands.recent.length > 0) {
      groupsMap.set("recent", {
        group: { id: "recent", label: "Recent", icon: Clock },
        commands: filteredCommands.recent.slice(0, maxRecent),
      });
    }

    // Group remaining commands
    const grouped = filteredCommands.all.reduce((acc, cmd) => {
      const categoryId = cmd.category || "other";
      if (!acc.has(categoryId)) {
        const group = groups.find((g) => g.id === categoryId) || {
          id: categoryId,
          label: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
        };
        acc.set(categoryId, { group, commands: [] });
      }
      acc.get(categoryId)!.commands.push(cmd);
      return acc;
    }, new Map<string, { group: CommandGroup | null; commands: CommandAction[] }>());

    // Sort groups by priority
    const sortedGroups = Array.from(grouped.values()).sort((a, b) => {
      const aPriority = a.group?.priority ?? 100;
      const bPriority = b.group?.priority ?? 100;
      return aPriority - bPriority;
    });

    return Array.from(groupsMap.values()).concat(sortedGroups);
  }, [filteredCommands, groups, maxRecent]);

  // Flatten commands for selection
  const flatCommands = useMemo(() => {
    return groupedCommands.flatMap((g) => g.commands);
  }, [groupedCommands]);

  // Execute command
  const executeCommand = useCallback(
    async (cmd: CommandAction) => {
      if (cmd.disabled) return;

      // Add to recent
      const newRecent = [cmd.id, ...recentCommands.filter((id) => id !== cmd.id)].slice(
        0,
        maxRecent
      );
      onRecentChange?.(newRecent);

      // Execute action
      await cmd.action();
      onClose();
    },
    [recentCommands, maxRecent, onRecentChange, onClose]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, flatCommands.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (flatCommands[selectedIndex]) {
            executeCommand(flatCommands[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, flatCommands, executeCommand, onClose]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Scroll selected into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selected?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Global Cmd+K listener
  useEffect(() => {
    const handleGlobal = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // This would need to be handled by parent component
        }
      }
    };

    window.addEventListener("keydown", handleGlobal);
    return () => window.removeEventListener("keydown", handleGlobal);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl">
        <div
          className={clsx(
            "mx-4 rounded-2xl border border-white/20 dark:border-white/10",
            "bg-background/95 backdrop-blur-xl shadow-2xl",
            "overflow-hidden"
          )}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs text-muted-foreground">
              <Command className="h-3 w-3" />K
            </kbd>
          </div>

          {/* Commands list */}
          <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
            {flatCommands.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p>{emptyMessage}</p>
              </div>
            ) : (
              groupedCommands.map((group, groupIndex) => (
                <div key={group.group?.id || `group-${groupIndex}`}>
                  {group.group && (
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {group.group.label}
                    </div>
                  )}
                  {group.commands.map((cmd, cmdIndex) => {
                    const Icon = cmd.icon;
                    const globalIndex = flatCommands.indexOf(cmd);
                    const isSelected = globalIndex === selectedIndex;

                    return (
                      <button
                        key={cmd.id}
                        data-index={globalIndex}
                        onClick={() => executeCommand(cmd)}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        disabled={cmd.disabled}
                        className={clsx(
                          "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                          isSelected && "bg-primary/10",
                          cmd.disabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {Icon && (
                          <div
                            className={clsx(
                              "flex items-center justify-center w-8 h-8 rounded-lg",
                              isSelected ? "bg-primary/20" : "bg-muted"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{cmd.label}</div>
                          {cmd.description && (
                            <div className="text-sm text-muted-foreground truncate">
                              {cmd.description}
                            </div>
                          )}
                        </div>
                        {cmd.shortcut && (
                          <div className="hidden sm:flex items-center gap-1">
                            {cmd.shortcut.map((key, i) => (
                              <kbd
                                key={i}
                                className="px-1.5 py-0.5 rounded bg-muted text-xs text-muted-foreground"
                              >
                                {key}
                              </kbd>
                            ))}
                          </div>
                        )}
                        {isSelected && (
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-muted">↑↓</kbd> Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-muted">↵</kbd> Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-muted">esc</kbd> Close
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Hook for managing command palette state
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [recentCommands, setRecentCommands] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("commandPalette_recent");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const handleRecentChange = useCallback((recent: string[]) => {
    setRecentCommands(recent);
    try {
      localStorage.setItem("commandPalette_recent", JSON.stringify(recent));
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  return {
    isOpen,
    open,
    close,
    toggle,
    recentCommands,
    handleRecentChange,
  };
}

export default CommandPalette;
