import React from "react";
import { cn } from "@/lib/utils";
import { FolderSearch } from "lucide-react";
import { Button } from "./Button";

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon = <FolderSearch className="w-8 h-8 text-zinc-500" />,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-lg border border-dashed border-zinc-800 bg-zinc-950/40 my-4",
        className
      )}
    >
      <div className="p-3 rounded-full bg-zinc-900 border border-zinc-800 mb-3">
        {icon}
      </div>
      <h3 className="text-sm font-medium text-zinc-200">{title}</h3>
      <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
