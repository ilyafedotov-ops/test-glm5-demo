/**
 * React hook for logging in components
 * 
 * Provides easy access to the logger with component context
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { logger, FrontendLogger } from '@/lib/logger';

interface UseLoggerOptions {
  /** Component name for context */
  component?: string;
  /** Log mount/unmount events */
  logLifecycle?: boolean;
  /** Log render count */
  logRenderCount?: boolean;
}

interface UseLoggerReturn {
  log: FrontendLogger['info'];
  debug: FrontendLogger['debug'];
  info: FrontendLogger['info'];
  warn: FrontendLogger['warn'];
  error: FrontendLogger['error'];
  logAction: FrontendLogger['logAction'];
  logPerformance: FrontendLogger['logPerformance'];
}

/**
 * Hook for logging in React components
 */
export function useLogger(options: UseLoggerOptions = {}): UseLoggerReturn {
  const { component, logLifecycle = false, logRenderCount = false } = options;
  
  const renderCount = useRef(0);
  const componentLogger = useMemo(
    () => (component ? logger.child(component) : logger),
    [component]
  );

  // Log render count
  if (logRenderCount) {
    renderCount.current++;
  }

  // Log mount/unmount
  useEffect(() => {
    const initialRenderCount = renderCount.current;

    if (logLifecycle && component) {
      componentLogger.debug(`Component mounted: ${component}`, {
        renderCount: initialRenderCount,
      });
    }

    return () => {
      if (logLifecycle && component) {
        componentLogger.debug(`Component unmounting: ${component}`, {
          renderCount: initialRenderCount,
        });
      }
    };
  }, [component, componentLogger, logLifecycle]);

  // Log render if tracking render count
  useEffect(() => {
    if (logRenderCount && component && renderCount.current > 1) {
      componentLogger.debug(`Component re-rendered: ${component}`, {
        renderCount: renderCount.current,
      });
    }
  }, [component, componentLogger, logRenderCount]);

  // Memoized log functions with component context
  const log = useCallback<FrontendLogger['info']>(
    (message, metadata) => componentLogger.info(message, { component, ...metadata }),
    [component, componentLogger]
  );

  const debug = useCallback<FrontendLogger['debug']>(
    (message, metadata) => componentLogger.debug(message, { component, ...metadata }),
    [component, componentLogger]
  );

  const info = useCallback<FrontendLogger['info']>(
    (message, metadata) => componentLogger.info(message, { component, ...metadata }),
    [component, componentLogger]
  );

  const warn = useCallback<FrontendLogger['warn']>(
    (message, metadata) => componentLogger.warn(message, { component, ...metadata }),
    [component, componentLogger]
  );

  const error = useCallback<FrontendLogger['error']>(
    (message, err, metadata) => componentLogger.error(message, err, { component, ...metadata }),
    [component, componentLogger]
  );

  const logAction = useCallback<FrontendLogger['logAction']>(
    (action, details) => componentLogger.info(`User action: ${action}`, { action, component, ...details }),
    [component, componentLogger]
  );

  const logPerformance = useCallback<FrontendLogger['logPerformance']>(
    (metric, value, unit) => componentLogger.debug(`Performance: ${metric} = ${value}${unit}`, { metric, value, unit }),
    [componentLogger]
  );

  return {
    log,
    debug,
    info,
    warn,
    error,
    logAction,
    logPerformance,
  };
}

export default useLogger;
