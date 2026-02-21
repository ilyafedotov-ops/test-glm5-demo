"use client";

import NextDynamic from "next/dynamic";
import { ComponentType, createElement } from "react";

/**
 * Lazy loading utilities for code splitting and performance optimization
 */

// Loading spinner component
function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

// Skeleton loader
export function SkeletonLoader({
  className = "",
  count = 1,
}: {
  className?: string;
  count?: number;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-muted/50 rounded animate-pulse"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  );
}

/**
 * Creates a lazy-loaded component with suspense
 */
export function lazyLoad<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: {
    loading?: ComponentType;
    ssr?: boolean;
  } = {}
) {
  const LazyComponent = NextDynamic(() => importFn(), {
    ssr: options.ssr ?? false,
    loading: () =>
      options.loading ? createElement(options.loading) : createElement(LoadingSpinner),
  });

  return LazyComponent;
}

/**
 * Preloads a component for faster navigation
 */
export function preloadComponent(importFn: () => Promise<unknown>): void {
  importFn().catch(() => {
    // Silently fail preload
  });
}

/**
 * Prefetches data for a route
 */
export function prefetchRoute(route: string): void {
  if (typeof window !== "undefined") {
    // Use Next.js prefetch mechanism
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = route;
    document.head.appendChild(link);
  }
}

/**
 * Image optimization helper
 */
export function getOptimizedImageUrl(
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: "webp" | "avif" | "auto";
  } = {}
): string {
  const params = new URLSearchParams();

  if (options.width) params.set("w", options.width.toString());
  if (options.height) params.set("h", options.height.toString());
  if (options.quality) params.set("q", options.quality.toString());
  if (options.format && options.format !== "auto") {
    params.set("f", options.format);
  }

  const queryString = params.toString();
  return queryString ? `${src}?${queryString}` : src;
}

/**
 * Debounce utility for performance
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttle utility for performance
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Request Idle Callback polyfill
 */
export const requestIdleCallback =
  typeof window !== "undefined" && "requestIdleCallback" in window
    ? window.requestIdleCallback
    : (cb: IdleRequestCallback) =>
        setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 50 } as IdleDeadline), 1);

/**
 * Run task during idle time
 */
export function runIdleTask(task: () => void): void {
  if (typeof window !== "undefined") {
    requestIdleCallback(task);
  } else {
    task();
  }
}

/**
 * Web Vitals measurement
 */
export function measureWebVitals(): {
  cls: number | null;
  fid: number | null;
  lcp: number | null;
  fcp: number | null;
  ttfb: number | null;
} {
  const vitals = {
    cls: null as number | null,
    fid: null as number | null,
    lcp: null as number | null,
    fcp: null as number | null,
    ttfb: null as number | null,
  };

  if (typeof window === "undefined") return vitals;

  // CLS
  try {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if ("value" in entry) {
          clsValue += (entry as any).value;
        }
      }
      vitals.cls = clsValue;
    });
    observer.observe({ type: "layout-shift", buffered: true });
  } catch {
    // Browser does not support this metric observer.
  }

  // LCP
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      vitals.lcp = lastEntry.startTime;
    });
    observer.observe({ type: "largest-contentful-paint", buffered: true });
  } catch {
    // Browser does not support this metric observer.
  }

  // FCP
  try {
    const entries = performance.getEntriesByName("first-contentful-paint");
    if (entries.length > 0) {
      vitals.fcp = (entries[0] as PerformanceEntry).startTime;
    }
  } catch {
    // Browser does not support this performance entry lookup.
  }

  // TTFB
  try {
    const entries = performance.getEntriesByType("navigation");
    if (entries.length > 0 && "responseStart" in entries[0]) {
      vitals.ttfb = (entries[0] as PerformanceNavigationTiming).responseStart;
    }
  } catch {
    // Browser does not support this navigation timing lookup.
  }

  return vitals;
}

/**
 * Memory usage reporter
 */
export function getMemoryUsage(): {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
} | null {
  if (typeof window !== "undefined" && "memory" in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };
  }
  return null;
}

const lazyLoadUtils = {
  lazyLoad,
  preloadComponent,
  prefetchRoute,
  getOptimizedImageUrl,
  debounce,
  throttle,
  runIdleTask,
  measureWebVitals,
  getMemoryUsage,
};

export default lazyLoadUtils;
