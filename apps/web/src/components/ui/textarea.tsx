import { useId } from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = "", ...props }: TextareaProps) {
  const generatedId = useId();
  const fieldId = props.id ?? generatedId;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={fieldId}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </label>
      )}
      <textarea
        id={fieldId}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={errorId}
        className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
