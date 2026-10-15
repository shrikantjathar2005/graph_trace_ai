import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

export interface ErrorBannerProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorBanner({
  title = "Failed to load data",
  message,
  onRetry,
  className,
}: ErrorBannerProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3.5 rounded-lg border border-rose-900/60 bg-rose-950/30 text-rose-200 text-xs",
        className
      )}
    >
      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-rose-300">{title}</p>
        <p className="text-rose-200/80 mt-0.5">{message}</p>
      </div>
      {onRetry && (
        <Button
          size="xs"
          variant="danger"
          onClick={onRetry}
          icon={<RefreshCw className="w-3 h-3" />}
        >
          Retry
        </Button>
      )}
    </div>
  );
}
