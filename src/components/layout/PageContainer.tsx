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
        "flex flex-col min-h-0 h-full overflow-y-auto col-start-2 col-end-4 row-start-2 row-end-4",
        className
      )}
    >
      {/* Header with Glassmorphism */}
      <div className="border-b border-white/10 bg-white/[0.02] backdrop-blur-md px-6 py-4 shrink-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono mb-1.5">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-zinc-600">/</span>}
                <span
                  className={
                    idx === breadcrumbs.length - 1
                      ? "text-blue-400 font-medium"
                      : "text-zinc-400"
                  }
                >
                  {crumb.label}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-semibold tracking-tight text-zinc-100">
                {title}
              </h1>
              {badge}
            </div>
            {description && (
              <p className="text-[11px] text-zinc-400 max-w-2xl">{description}</p>
            )}
          </div>

          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      </div>

      {/* Page Content */}
      <div
        className={cn(
          "flex-1",
          fullWidth ? "w-full h-full p-0 flex flex-col" : "p-6 w-full max-w-7xl mx-auto"
        )}
      >
        {children}
      </div>
    </div>
  );
}
