"use client";

import { useState, useRef, useEffect } from "react";

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "center" | "end";
}

export function DropdownMenu({ trigger, children, align = "end" }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const alignClass = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0",
  }[align];

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div
          className={`absolute ${alignClass} top-full mt-1 min-w-[180px] bg-background border rounded-lg shadow-lg z-50 py-1 animate-in fade-in-0 zoom-in-95`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "default" | "destructive";
}

export function DropdownMenuItem({
  children,
  onClick,
  disabled,
  variant = "default",
}: DropdownMenuItemProps) {
  return (
    <button
      className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        variant === "destructive"
        ? "text-destructive hover:bg-destructive/10"
        : "hover:bg-accent"
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator() {
  return <div className="h-px bg-border my-1" />;
}

export function DropdownMenuLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">{children}</div>;
}
