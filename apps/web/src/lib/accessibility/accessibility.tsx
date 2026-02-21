"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { clsx } from "clsx";

/**
 * Accessibility utilities and components for WCAG 2.1 AA compliance
 */

// ============================================
// Focus Management
// ============================================

/**
 * Focus trap component for modals and dialogs
 */
export function FocusTrap({
  children,
  active = true,
  className,
}: {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    // Store previous focus
    previousFocus.current = document.activeElement as HTMLElement;

    // Focus first focusable element
    const focusables = getFocusableElements(containerRef.current);
    if (focusables.length > 0) {
      focusables[0].focus();
    }

    return () => {
      // Restore focus on unmount
      previousFocus.current?.focus();
    };
  }, [active]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!active || e.key !== "Tab") return;

      const focusables = getFocusableElements(containerRef.current);
      if (focusables.length === 0) return;

      const firstFocusable = focusables[0];
      const lastFocusable = focusables[focusables.length - 1];

      if (e.shiftKey) {
        // Shift+Tab
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    },
    [active]
  );

  return (
    <div ref={containerRef} onKeyDown={handleKeyDown} className={className} role="presentation">
      {children}
    </div>
  );
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];

  const selector = [
    "a[href]:not([disabled])",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ].join(", ");

  return Array.from(container.querySelectorAll(selector)).filter(
    (el) => !el.hasAttribute("aria-hidden")
  ) as HTMLElement[];
}

/**
 * useFocus management hook
 */
export function useFocus<T extends HTMLElement = HTMLInputElement>() {
  const ref = useRef<T>(null);

  const focus = useCallback(() => {
    ref.current?.focus();
  }, []);

  const blur = useCallback(() => {
    ref.current?.blur();
  }, []);

  return { ref, focus, blur };
}

/**
 * Skip to content link component
 */
export function SkipToContent({
  targetId = "main-content",
  label = "Skip to main content",
}: {
  targetId?: string;
  label?: string;
}) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.tabIndex = -1;
      target.focus();
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
    >
      {label}
    </a>
  );
}

// ============================================
// ARIA Utilities
// ============================================

/**
 * Generate unique IDs for ARIA attributes
 */
let idCounter = 0;
export function useGeneratedId(prefix = "aria"): string {
  const [id] = useState(() => `${prefix}-${++idCounter}`);
  return id;
}

/**
 * ARIA live region announcer
 */
export function useAnnouncer() {
  const announcerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create announcer element if it doesn't exist
    if (!announcerRef.current) {
      announcerRef.current = document.createElement("div");
      announcerRef.current.setAttribute("role", "status");
      announcerRef.current.setAttribute("aria-live", "polite");
      announcerRef.current.setAttribute("aria-atomic", "true");
      announcerRef.current.className = "sr-only";
      document.body.appendChild(announcerRef.current);
    }

    return () => {
      announcerRef.current?.remove();
    };
  }, []);

  const announce = useCallback((message: string, priority: "polite" | "assertive" = "polite") => {
    if (announcerRef.current) {
      announcerRef.current.setAttribute("aria-live", priority);
      announcerRef.current.textContent = "";
      // Delay to ensure screen reader picks up the change
      setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = message;
        }
      }, 100);
    }
  }, []);

  return { announce };
}

/**
 * Screen reader only text wrapper
 */
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

// ============================================
// Keyboard Navigation
// ============================================

/**
 * Roving tabindex for grid/list navigation
 */
export function useRovingTabIndex(
  itemCount: number,
  options: {
    orientation?: "horizontal" | "vertical" | "both";
    loop?: boolean;
    cols?: number;
  } = {}
) {
  const { orientation = "vertical", loop = true, cols = 1 } = options;
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      let newIndex = index;

      switch (e.key) {
        case "ArrowDown":
          if (orientation !== "horizontal") {
            e.preventDefault();
            newIndex = index + cols;
            if (newIndex >= itemCount) {
              newIndex = loop ? newIndex % itemCount : index;
            }
          }
          break;
        case "ArrowUp":
          if (orientation !== "horizontal") {
            e.preventDefault();
            newIndex = index - cols;
            if (newIndex < 0) {
              newIndex = loop ? itemCount + newIndex : 0;
            }
          }
          break;
        case "ArrowRight":
          if (orientation !== "vertical") {
            e.preventDefault();
            newIndex = index + 1;
            if (newIndex >= itemCount) {
              newIndex = loop ? 0 : index;
            }
          }
          break;
        case "ArrowLeft":
          if (orientation !== "vertical") {
            e.preventDefault();
            newIndex = index - 1;
            if (newIndex < 0) {
              newIndex = loop ? itemCount - 1 : 0;
            }
          }
          break;
        case "Home":
          e.preventDefault();
          newIndex = 0;
          break;
        case "End":
          e.preventDefault();
          newIndex = itemCount - 1;
          break;
        default:
          return;
      }

      setCurrentIndex(newIndex);
    },
    [orientation, loop, cols, itemCount]
  );

  const getTabIndex = useCallback(
    (index: number) => (index === currentIndex ? 0 : -1),
    [currentIndex]
  );

  return {
    currentIndex,
    setCurrentIndex,
    handleKeyDown,
    getTabIndex,
  };
}

// ============================================
// Color Contrast
// ============================================

/**
 * Check if text meets WCAG contrast requirements
 */
export function checkContrast(
  _foreground: string,
  _background: string
): { ratio: number; passes: { aa: boolean; aaa: boolean } } {
  // Simplified contrast check - in production, use a proper color library
  // This is a placeholder implementation
  const ratio = 4.5; // Placeholder
  return {
    ratio,
    passes: {
      aa: ratio >= 4.5,
      aaa: ratio >= 7,
    },
  };
}

// ============================================
// Reduced Motion
// ============================================

/**
 * Hook to check user's reduced motion preference
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReducedMotion;
}

/**
 * Animated component that respects reduced motion preference
 */
export function AccessibleMotion({
  children,
  className,
  animateClassName,
  reducedMotionClassName,
}: {
  children: React.ReactNode;
  className?: string;
  animateClassName: string;
  reducedMotionClassName?: string;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div
      className={clsx(className, prefersReducedMotion ? reducedMotionClassName : animateClassName)}
    >
      {children}
    </div>
  );
}

// ============================================
// Form Accessibility
// ============================================

/**
 * Accessible form field wrapper
 */
export function AccessibleField({
  id,
  label,
  error,
  description,
  required,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  const descriptionId = useGeneratedId("desc");
  const errorId = useGeneratedId("error");

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {required && (
          <span className="text-rose-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {React.cloneElement(children as React.ReactElement, {
        id,
        "aria-describedby": [description && descriptionId, error && errorId]
          .filter(Boolean)
          .join(" "),
        "aria-invalid": error ? "true" : undefined,
        "aria-required": required ? "true" : undefined,
      })}
      {error && (
        <p id={errorId} role="alert" className="text-sm text-rose-500">
          {error}
        </p>
      )}
    </div>
  );
}

const accessibilityUtils = {
  FocusTrap,
  getFocusableElements,
  useFocus,
  SkipToContent,
  useGeneratedId,
  useAnnouncer,
  VisuallyHidden,
  useRovingTabIndex,
  usePrefersReducedMotion,
  AccessibleMotion,
  AccessibleField,
};

export default accessibilityUtils;
