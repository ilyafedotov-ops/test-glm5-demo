"use client";

import { clsx } from "clsx";

interface OperationsPageHeaderProps {
  title: string;
  description: string;
  actions?: React.ReactNode;
  className?: string;
}

export function OperationsPageHeader({
  title,
  description,
  actions,
  className,
}: OperationsPageHeaderProps) {
  return (
    <div className={clsx("flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between animate-fade-in", className)}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}
