import React from "react";
import { cn } from "@/lib/utils";

export interface PageContainerProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function PageContainer({
  title,
  description,
  badge,
  actions,
  breadcrumbs,
  children,
  className,
  fullWidth = false,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "flex flex-col min-h-0 h-full w-full overflow-y-auto",
        className
      )}
    >
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--surface-1)]/90 backdrop-blur-md px-4 sm:px-6 py-3.5 sm:py-4 shrink-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] font-mono mb-1.5 overflow-x-auto scrollbar-none">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-[var(--text-muted)] opacity-60">/</span>}
                <span
                  className={
                    idx === breadcrumbs.length - 1
                      ? "text-[var(--accent)] font-medium"
                      : "text-[var(--text-secondary)]"
                  }
                >
                  {crumb.label}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-base sm:text-lg font-semibold tracking-tight text-[var(--text-primary)]">
                {title}
              </h1>
              {badge}
            </div>
            {description && (
              <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] max-w-2xl">{description}</p>
            )}
          </div>

          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      </div>

      {/* Page Content */}
      <div
        className={cn(
          "flex-1 min-h-0",
          fullWidth ? "w-full h-full p-0 flex flex-col" : "p-4 sm:p-6 w-full max-w-7xl mx-auto"
        )}
      >
        {children}
      </div>
    </div>
  );
}
