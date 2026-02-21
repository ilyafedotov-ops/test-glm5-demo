"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";

export interface RecordPickerOption {
  id: string;
  label: string;
  subtitle?: string;
  status?: string;
}

interface RecordPickerProps {
  label: string;
  placeholder?: string;
  hint?: string;
  selected?: RecordPickerOption | null;
  onSelect: (option: RecordPickerOption) => void;
  onClear?: () => void;
  loadOptions: (query: string) => Promise<RecordPickerOption[]>;
  disabled?: boolean;
  required?: boolean;
}

export function RecordPicker({
  label,
  placeholder = "Search records",
  hint,
  selected,
  onSelect,
  onClear,
  loadOptions,
  disabled,
  required,
}: RecordPickerProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<RecordPickerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fieldId = useId();
  const listboxId = `${fieldId}-options`;
  const hintId = `${fieldId}-hint`;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const nextOptions = await loadOptions(query.trim());
        setOptions(nextOptions);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [query, open, loadOptions]);

  const emptyStateMessage = useMemo(() => {
    if (loading) return "Searching...";
    if (query.trim().length === 0) return "Start typing to search";
    return "No matches found";
  }, [loading, query]);

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <label htmlFor={fieldId} className="text-sm font-medium leading-none">
        {label}
        {required ? " *" : ""}
      </label>

      {selected ? (
        <div className="flex items-center justify-between rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">
          <div className="min-w-0">
            <p className="truncate font-medium">{selected.label}</p>
            {selected.subtitle ? (
              <p className="truncate text-xs text-muted-foreground">{selected.subtitle}</p>
            ) : null}
          </div>
          {onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="rounded-md p-1 hover:bg-accent"
              aria-label={`Clear ${label.toLowerCase()}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id={fieldId}
          type="text"
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-describedby={hint ? hintId : undefined}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
            }
          }}
        />

        {open ? (
          <div
            id={listboxId}
            role="listbox"
            className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-lg"
          >
            {options.length > 0 ? (
              options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="w-full rounded-md px-3 py-2 text-left hover:bg-accent"
                  onClick={() => {
                    onSelect(option);
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  <p className="truncate text-sm font-medium">{option.label}</p>
                  {option.subtitle ? (
                    <p className="truncate text-xs text-muted-foreground">{option.subtitle}</p>
                  ) : null}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-xs text-muted-foreground">{emptyStateMessage}</div>
            )}
          </div>
        ) : null}
      </div>

      {hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
