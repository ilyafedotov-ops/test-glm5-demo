"use client";

import React, { useState, useCallback, useMemo, createContext, useContext } from "react";
import { clsx } from "clsx";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Save,
  AlertCircle,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { Button } from "@nexusops/ui";

// Types
export interface WizardStep<T = unknown> {
  id: string;
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** Whether this step can be skipped */
  optional?: boolean;
  /** Custom validation function */
  validate?: (data: T) => Promise<boolean> | boolean;
  /** Async action before moving to next step */
  onBeforeNext?: (data: T) => Promise<void | string>;
  /** Check if step should be shown */
  shouldShow?: (data: T) => boolean;
  /** Estimated time to complete (in seconds) */
  estimatedTime?: number;
}

export interface WizardProps<T = unknown> {
  steps: WizardStep<T>[];
  /** Initial data */
  initialData?: T;
  /** Current step index (controlled) */
  currentStep?: number;
  /** Callback when step changes */
  onStepChange?: (step: number, data: T) => void;
  /** Callback when data changes */
  onDataChange?: (data: T) => void;
  /** Callback when wizard completes */
  onComplete?: (data: T) => Promise<void>;
  /** Callback when wizard is cancelled */
  onCancel?: (data: T) => void;
  /** Callback to save progress */
  onSaveProgress?: (step: number, data: T) => Promise<void>;
  /** Render step content */
  children: (props: WizardRenderProps<T>) => React.ReactNode;
  /** Allow saving progress */
  allowSave?: boolean;
  /** Allow skipping steps */
  allowSkip?: boolean;
  /** Show step numbers */
  showStepNumbers?: boolean;
  /** Show estimated time */
  showEstimatedTime?: boolean;
  /** Persist key for saving state to localStorage */
  persistKey?: string;
  /** Custom class name */
  className?: string;
  /** Loading state for entire wizard */
  isLoading?: boolean;
  /** Custom labels */
  labels?: {
    next?: string;
    back?: string;
    skip?: string;
    complete?: string;
    save?: string;
    cancel?: string;
  };
}

export interface WizardRenderProps<T = unknown> {
  currentStep: number;
  step: WizardStep<T>;
  data: T;
  setData: (data: Partial<T> | ((prev: T) => T)) => void;
  setStepData: (stepId: string, data: unknown) => void;
  getStepData: (stepId: string) => unknown;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
  setError: (field: string, error: string | null) => void;
  clearErrors: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  nextStep: () => Promise<void>;
  prevStep: () => void;
  goToStep: (step: number) => void;
  canGoNext: boolean;
  canGoBack: boolean;
  isLoading: boolean;
}

// Context
interface WizardContextValue<T = unknown> {
  data: T;
  setData: (data: Partial<T> | ((prev: T) => T)) => void;
  currentStep: number;
  step: WizardStep<T>;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
  setError: (field: string, error: string | null) => void;
  clearErrors: () => void;
  stepData: Record<string, unknown>;
  setStepData: (stepId: string, data: unknown) => void;
  getStepData: (stepId: string) => unknown;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function useWizardContext<T = unknown>(): WizardContextValue<T> {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("useWizardContext must be used within a Wizard");
  }
  return context as WizardContextValue<T>;
}

// Main Wizard Component
export function Wizard<T extends Record<string, any> = Record<string, any>>({
  steps: propSteps,
  initialData = {} as T,
  currentStep: controlledStep,
  onStepChange,
  onDataChange,
  onComplete,
  onCancel,
  onSaveProgress,
  children,
  allowSave = true,
  allowSkip = false,
  showStepNumbers = true,
  showEstimatedTime = false,
  persistKey,
  className,
  isLoading: externalLoading = false,
  labels = {},
}: WizardProps<T>) {
  const labelDefaults = {
    next: "Continue",
    back: "Back",
    skip: "Skip",
    complete: "Complete",
    save: "Save Progress",
    cancel: "Cancel",
    ...labels,
  };

  // Load persisted state
  const loadPersistedState = useCallback(() => {
    if (!persistKey || typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(`wizard_${persistKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed;
      }
    } catch {
      // Ignore parsing errors
    }
    return null;
  }, [persistKey]);

  const persistedState = loadPersistedState();

  // State
  const [internalStep, setInternalStep] = useState(
    persistedState?.step ?? 0
  );
  const [data, setData] = useState<T>(
    persistedState?.data ?? initialData
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stepData, setStepDataState] = useState<Record<string, unknown>>(
    persistedState?.stepData ?? {}
  );
  const [isStepLoading, setIsStepLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(
    new Set(persistedState?.completedSteps ?? [])
  );

  // Current step (controlled or internal)
  const currentStep = controlledStep ?? internalStep;

  // Filter visible steps
  const steps = useMemo(() => {
    return propSteps.filter((step) => {
      if (step.shouldShow) {
        return step.shouldShow(data);
      }
      return true;
    });
  }, [propSteps, data]);

  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const isLoading = externalLoading || isStepLoading;

  // Persist state
  const persistState = useCallback(
    (stepIndex: number, state: T, sd: Record<string, unknown>, completed: Set<string>) => {
      if (!persistKey || typeof window === "undefined") return;
      try {
        localStorage.setItem(
          `wizard_${persistKey}`,
          JSON.stringify({
            step: stepIndex,
            data: state,
            stepData: sd,
            completedSteps: Array.from(completed),
            timestamp: Date.now(),
          })
        );
      } catch {
        // Ignore storage errors
      }
    },
    [persistKey]
  );

  // Update data helper
  const updateData = useCallback(
    (newData: Partial<T> | ((prev: T) => T)) => {
      setData((prev) => {
        const next = typeof newData === "function" ? newData(prev) : { ...prev, ...newData };
        onDataChange?.(next);
        return next;
      });
    },
    [onDataChange]
  );

  // Step data helpers
  const updateStepData = useCallback((stepId: string, sd: unknown) => {
    setStepDataState((prev) => ({ ...prev, [stepId]: sd }));
  }, []);

  const getStepData = useCallback(
    (stepId: string) => stepData[stepId],
    [stepData]
  );

  // Error helpers
  const setError = useCallback((field: string, error: string | null) => {
    setErrors((prev) => {
      if (error === null) {
        const { [field]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [field]: error };
    });
  }, []);

  const clearErrors = useCallback(() => setErrors({}), []);

  // Navigation
  const goToStep = useCallback(
    (targetStep: number) => {
      if (targetStep < 0 || targetStep >= steps.length) return;
      setInternalStep(targetStep);
      onStepChange?.(targetStep, data);
    },
    [steps.length, data, onStepChange]
  );

  const validateStep = useCallback(async (): Promise<boolean> => {
    clearErrors();

    if (step.validate) {
      try {
        const isValid = await step.validate(data);
        if (!isValid) {
          return false;
        }
      } catch (err) {
        if (err instanceof Error) {
          setError("_form", err.message);
        }
        return false;
      }
    }

    return true;
  }, [step, data, clearErrors, setError]);

  const nextStep = useCallback(async () => {
    if (isLastStep) {
      // Complete wizard
      setIsStepLoading(true);
      try {
        await onComplete?.(data);
        setCompletedSteps((prev) => new Set([...prev, step.id]));
        // Clear persisted state on completion
        if (persistKey) {
          localStorage.removeItem(`wizard_${persistKey}`);
        }
      } finally {
        setIsStepLoading(false);
      }
      return;
    }

    // Validate current step
    const isValid = await validateStep();
    if (!isValid) return;

    // Execute onBeforeNext if exists
    if (step.onBeforeNext) {
      setIsStepLoading(true);
      try {
        const error = await step.onBeforeNext(data);
        if (error) {
          setError("_form", error);
          setIsStepLoading(false);
          return;
        }
      } catch (err) {
        if (err instanceof Error) {
          setError("_form", err.message);
        }
        setIsStepLoading(false);
        return;
      } finally {
        setIsStepLoading(false);
      }
    }

    // Mark step as completed
    setCompletedSteps((prev) => new Set([...prev, step.id]));

    // Move to next step
    const nextStepIndex = currentStep + 1;
    setInternalStep(nextStepIndex);
    onStepChange?.(nextStepIndex, data);
    persistState(nextStepIndex, data, stepData, completedSteps);
  }, [
    isLastStep,
    currentStep,
    data,
    step,
    validateStep,
    onComplete,
    onStepChange,
    persistState,
    stepData,
    completedSteps,
    persistKey,
    setError,
  ]);

  const prevStep = useCallback(() => {
    if (isFirstStep) return;
    const prevStepIndex = currentStep - 1;
    setInternalStep(prevStepIndex);
    onStepChange?.(prevStepIndex, data);
  }, [isFirstStep, currentStep, data, onStepChange]);

  const handleSaveProgress = useCallback(async () => {
    if (!onSaveProgress) return;
    setIsStepLoading(true);
    try {
      await onSaveProgress(currentStep, data);
      persistState(currentStep, data, stepData, completedSteps);
    } finally {
      setIsStepLoading(false);
    }
  }, [onSaveProgress, currentStep, data, persistState, stepData, completedSteps]);

  const handleCancel = useCallback(() => {
    onCancel?.(data);
  }, [onCancel, data]);

  // Can navigate flags
  const canGoBack = !isFirstStep && !isLoading;
  const canGoNext = !isLoading;

  // Calculate progress
  const progress = ((currentStep + 1) / steps.length) * 100;
  const totalEstimatedTime = steps.reduce(
    (sum, s) => sum + (s.estimatedTime || 0),
    0
  );

  // Context value
  const contextValue: WizardContextValue<T> = useMemo(
    () => ({
      data,
      setData: updateData,
      currentStep,
      step,
      errors,
      setErrors,
      setError,
      clearErrors,
      stepData,
      setStepData: updateStepData,
      getStepData,
    }),
    [
      data,
      updateData,
      currentStep,
      step,
      errors,
      setErrors,
      setError,
      clearErrors,
      stepData,
      updateStepData,
      getStepData,
    ]
  );

  // Render props
  const renderProps: WizardRenderProps<T> = useMemo(
    () => ({
      currentStep,
      step,
      data,
      setData: updateData,
      setStepData: updateStepData,
      getStepData,
      errors,
      setErrors,
      setError,
      clearErrors,
      isFirstStep,
      isLastStep,
      nextStep,
      prevStep,
      goToStep,
      canGoNext,
      canGoBack,
      isLoading,
    }),
    [
      currentStep,
      step,
      data,
      updateData,
      updateStepData,
      getStepData,
      errors,
      setErrors,
      setError,
      clearErrors,
      isFirstStep,
      isLastStep,
      nextStep,
      prevStep,
      goToStep,
      canGoNext,
      canGoBack,
      isLoading,
    ]
  );

  return (
    <WizardContext.Provider value={contextValue}>
      <div className={clsx("flex flex-col", className)}>
        {/* Stepper Header */}
        <div className="mb-8">
          {/* Progress bar */}
          <div className="h-1.5 bg-muted rounded-full mb-6 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step indicators */}
          <div className="flex items-start justify-between">
            {steps.map((s, index) => {
              const StepIcon = s.icon;
              const isActive = index === currentStep;
              const isCompleted = completedSteps.has(s.id);
              const isPast = index < currentStep;

              return (
                <div
                  key={s.id}
                  className="flex flex-col items-center flex-1 relative"
                >
                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div
                      className={clsx(
                        "absolute top-4 left-[60%] right-0 h-0.5 -z-10",
                        isPast || isCompleted
                          ? "bg-gradient-to-r from-violet-500 to-purple-500"
                          : "bg-muted"
                      )}
                    />
                  )}

                  {/* Step circle */}
                  <button
                    onClick={() => {
                      if (isPast || isCompleted) goToStep(index);
                    }}
                    disabled={!isPast && !isCompleted}
                    className={clsx(
                      "relative flex items-center justify-center w-10 h-10 rounded-full transition-all",
                      isActive &&
                        "bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/25",
                      isCompleted && !isActive && "bg-emerald-500 text-white",
                      isPast && !isCompleted && !isActive && "bg-primary text-primary-foreground",
                      !isPast && !isActive && !isCompleted && "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : StepIcon ? (
                      <StepIcon className="h-5 w-5" />
                    ) : showStepNumbers ? (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    ) : (
                      <Circle className="h-3 w-3" />
                    )}
                  </button>

                  {/* Step label */}
                  <div className="mt-2 text-center">
                    <p
                      className={clsx(
                        "text-sm font-medium",
                        isActive ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {s.title}
                    </p>
                    {s.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 max-w-[120px]">
                        {s.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {errors["_form"] && (
            <div className="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {errors["_form"]}
            </div>
          )}
          {children(renderProps)}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-6 border-t border-white/10 mt-8">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={handleCancel} disabled={isLoading}>
              {labelDefaults.cancel}
            </Button>
            {allowSave && onSaveProgress && (
              <Button
                variant="ghost"
                onClick={handleSaveProgress}
                disabled={isLoading}
              >
                <Save className="h-4 w-4" />
                {labelDefaults.save}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {canGoBack && (
              <Button variant="glass" onClick={prevStep} disabled={isLoading}>
                <ChevronLeft className="h-4 w-4" />
                {labelDefaults.back}
              </Button>
            )}

            {allowSkip && step.optional && !isLastStep && (
              <Button variant="ghost" onClick={nextStep} disabled={isLoading}>
                {labelDefaults.skip}
              </Button>
            )}

            <Button
              variant="gradient"
              onClick={nextStep}
              disabled={!canGoNext}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : isLastStep ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {labelDefaults.complete}
                </>
              ) : (
                <>
                  {labelDefaults.next}
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Estimated time */}
        {showEstimatedTime && totalEstimatedTime > 0 && (
          <div className="text-center mt-4 text-sm text-muted-foreground">
            Estimated time: {Math.ceil(totalEstimatedTime / 60)} min
          </div>
        )}
      </div>
    </WizardContext.Provider>
  );
}

// Sub-components
export function WizardStepTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-bold mb-2">{children}</h2>;
}

export function WizardStepDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground mb-6">{children}</p>;
}

export function WizardStepContent({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6">{children}</div>;
}

export default Wizard;
