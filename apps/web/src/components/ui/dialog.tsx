"use client";

import { useEffect, useCallback, useId } from "react";
import { X } from "lucide-react";
import { FocusTrap } from "@/lib/accessibility/accessibility";
import { cn } from "@nexusops/ui";

type DialogSize = "sm" | "md" | "lg" | "xl" | "form";
type DialogMobileMode = "fullscreen" | "centered";

const dialogSizeClasses: Record<DialogSize, string> = {
  sm: "md:max-w-md",
  md: "md:max-w-lg",
  lg: "md:max-w-2xl",
  xl: "md:max-w-4xl",
  form: "md:max-w-[44rem] xl:max-w-[56rem]",
};

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: DialogSize;
  mobileMode?: DialogMobileMode;
  footer?: React.ReactNode;
  bodyClassName?: string;
  footerClassName?: string;
  children: React.ReactNode;
}

export function Dialog({
  open,
  onClose,
  title,
  size = "md",
  mobileMode = "centered",
  footer,
  bodyClassName,
  footerClassName,
  children,
}: DialogProps) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
      <FocusTrap active={open}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          className={cn(
            "relative z-50 flex w-full max-w-none flex-col overflow-hidden border bg-background shadow-lg",
            dialogSizeClasses[size],
            mobileMode === "fullscreen"
              ? "mx-0 h-[100dvh] max-h-[100dvh] rounded-none md:mx-4 md:h-auto md:max-h-[90vh] md:rounded-lg"
              : "mx-4 max-h-[90vh] rounded-lg"
          )}
        >
          {title ? (
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 p-4 backdrop-blur-sm">
              <h2 id={titleId} className="text-lg font-semibold">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1 hover:bg-accent"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          <div className={cn("min-h-0 overflow-y-auto p-6", bodyClassName)}>{children}</div>

          {footer ? (
            <div
              className={cn(
                "sticky bottom-0 z-10 border-t bg-background/95 px-6 py-4 backdrop-blur-sm",
                footerClassName
              )}
            >
              {footer}
            </div>
          ) : null}
        </div>
      </FocusTrap>
    </div>
  );
}
