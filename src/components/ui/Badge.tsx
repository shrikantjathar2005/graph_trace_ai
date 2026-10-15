import React from "react";
import { cn } from "@/lib/utils";
import { EntityType } from "@/types/entities";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "outline"
    | "requirement"
    | "architecture"
    | "component"
    | "module"
    | "class"
    | "method"
    | "test"
    | "documentation"
    | "success"
    | "warning"
    | "danger"
    | "info";
  size?: "sm" | "md";
  dot?: boolean;
}

const variantStyles: Record<string, string> = {
  default: "bg-zinc-800/80 text-zinc-300 border-zinc-700/60",
  outline: "bg-transparent text-zinc-400 border-zinc-700",
  
  // 8 Core Entity Colors
  requirement: "bg-amber-950/40 text-amber-300 border-amber-800/50",
  architecture: "bg-purple-950/40 text-purple-300 border-purple-800/50",
  component: "bg-cyan-950/40 text-cyan-300 border-cyan-800/50",
  module: "bg-indigo-950/40 text-indigo-300 border-indigo-800/50",
  class: "bg-blue-950/40 text-blue-300 border-blue-800/50",
  method: "bg-emerald-950/40 text-emerald-300 border-emerald-800/50",
  test: "bg-rose-950/40 text-rose-300 border-rose-800/50",
  documentation: "bg-teal-950/40 text-teal-300 border-teal-800/50",

  // Status Colors
  success: "bg-emerald-950/40 text-emerald-300 border-emerald-800/50",
  warning: "bg-amber-950/40 text-amber-300 border-amber-800/50",
  danger: "bg-rose-950/40 text-rose-300 border-rose-800/50",
  info: "bg-sky-950/40 text-sky-300 border-sky-800/50",
};

export const entityDotColors: Record<EntityType, string> = {
  requirement: "bg-amber-400",
  architecture: "bg-purple-400",
  component: "bg-cyan-400",
  module: "bg-indigo-400",
  class: "bg-blue-400",
  method: "bg-emerald-400",
  test: "bg-rose-400",
  documentation: "bg-teal-400",
};

export function Badge({
  className,
  variant = "default",
  size = "sm",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono font-medium border rounded-md uppercase tracking-wider select-none",
        size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        variantStyles[variant] || variantStyles.default,
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            variant in entityDotColors
              ? entityDotColors[variant as EntityType]
              : "bg-current"
          )}
        />
      )}
      {children}
    </span>
  );
}
