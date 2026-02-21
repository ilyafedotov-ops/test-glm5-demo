"use client";

import { useEffect, useCallback, useId } from "react";
import { X } from "lucide-react";
import { FocusTrap } from "@/lib/accessibility/accessibility";
import { cn } from "@nexusops/ui";

type SheetSize = "md" | "lg" | "xl";

const sheetSizeClasses: Record<SheetSize, string> = {
  md: "md:max-w-[28rem]",
  lg: "md:max-w-[40rem]",
  xl: "md:max-w-[48rem]",
};

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  side?: "left" | "right";
  size?: SheetSize;
  bodyClassName?: string;
}

export function Sheet({
  open,
  onClose,
  title,
  children,
  side = "right",
  size = "md",
  bodyClassName,
}: SheetProps) {
  const titleId = useId();
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, handleEscape]);

  if (!open) return null;

  const slideClass =
    side === "right"
      ? "right-0 border-l animate-in slide-in-from-right"
      : "left-0 border-r animate-in slide-in-from-left";

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
      <FocusTrap active={open}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          className={cn(
            "fixed top-0 h-full w-full max-w-none bg-background shadow-xl",
            sheetSizeClasses[size],
            slideClass
          )}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 p-4 backdrop-blur-sm">
            {title ? (
              <h2 id={titleId} className="text-lg font-semibold">
                {title}
              </h2>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-2 hover:bg-accent"
              aria-label="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className={cn("h-[calc(100%-69px)] overflow-y-auto p-4", bodyClassName)}>
            {children}
          </div>
        </div>
      </FocusTrap>
    </div>
  );
}
