import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "xs" | "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

const variantClasses: Record<string, string> = {
  primary:
    "bg-[var(--accent)] text-[#10151F] font-semibold hover:bg-[var(--accent-hover)] active:bg-[#1ea294] border-transparent shadow-sm shadow-[var(--accent)]/20",
  secondary:
    "bg-white/[0.07] text-zinc-200 hover:bg-white/[0.12] active:bg-white/[0.08] border-white/10 shadow-sm",
  outline:
    "bg-transparent text-zinc-300 hover:bg-white/[0.05] border-white/15 hover:border-white/25",
  ghost:
    "bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05] border-transparent",
  danger:
    "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 active:bg-rose-500/40 border-rose-500/30",
};

const sizeClasses: Record<string, string> = {
  xs: "px-2 py-1 text-[11px] gap-1 rounded-md",
  sm: "px-2.5 py-1.5 text-xs gap-1.5 rounded-lg",
  md: "px-3.5 py-2 text-xs gap-2 rounded-lg font-medium",
  lg: "px-4 py-2.5 text-sm gap-2.5 rounded-xl font-medium",
};

export function Button({
  className,
  variant = "secondary",
  size = "sm",
  icon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-sans transition-all duration-150 border focus:outline-none focus:ring-2 focus:ring-blue-400/40 disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
