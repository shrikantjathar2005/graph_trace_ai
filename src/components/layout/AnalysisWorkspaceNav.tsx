"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Network, Layers, FileCheck2, Flame, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisWorkspaceNavProps {
  currentEntityId?: string | null;
  className?: string;
}

export function AnalysisWorkspaceNav({ currentEntityId, className }: AnalysisWorkspaceNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeView = searchParams.get("view");
  const entityParam = currentEntityId || searchParams.get("entity") || searchParams.get("req") || searchParams.get("target");

  const views = [
    {
      id: "map",
      label: "Repository Map",
      href: "/graph",
      icon: Network,
      isActive: pathname === "/graph" && activeView !== "dependencies",
      description: "Full 8-tier architectural knowledge graph",
    },
    {
      id: "dependencies",
      label: "Dependencies",
      href: "/graph?view=dependencies",
      icon: Layers,
      isActive: pathname === "/graph" && activeView === "dependencies",
      description: "Code imports, invocations, and module coupling",
    },
    {
      id: "traceability",
      label: "Traceability Matrix",
      href: entityParam ? `/traceability?entity=${encodeURIComponent(entityParam)}` : "/traceability",
      icon: FileCheck2,
      isActive: pathname === "/traceability",
      description: "Requirements-to-code verification chains",
    },
    {
      id: "impact",
      label: "Change Impact",
      href: entityParam ? `/impact?entity=${encodeURIComponent(entityParam)}` : "/impact",
      icon: Flame,
      isActive: pathname === "/impact",
      description: "Heuristic blast radius and regression risk",
    },
    {
      id: "rules",
      label: "Architecture Rules",
      href: entityParam ? `/rules?entity=${encodeURIComponent(entityParam)}` : "/rules",
      icon: ShieldCheck,
      isActive: pathname === "/rules",
      description: "Layer constraint validation and drift detection",
    },
  ];

  return (
    <nav
      aria-label="Analysis Perspectives"
      className={cn(
        "flex items-center gap-1.5 overflow-x-auto scrollbar-none border-b border-[#2A3547] bg-[#141B27]/95 px-4 py-2 text-xs font-mono select-none",
        className
      )}
    >
      <span className="text-[10px] uppercase font-bold text-zinc-500 mr-2 shrink-0 tracking-wider hidden sm:inline-block">
        Perspective:
      </span>

      <div className="flex items-center gap-1 shrink-0">
        {views.map((v) => {
          const Icon = v.icon;
          return (
            <Link
              key={v.id}
              href={v.href}
              title={v.description}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-150 cursor-pointer font-medium border",
                v.isActive
                  ? "bg-[#192333] text-[#25C4B4] border-[#25C4B4]/50 shadow-[0_0_12px_rgba(37,196,180,0.2)]"
                  : "bg-transparent text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-[#10151F]/80 hover:border-[#2A3547]"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5 shrink-0", v.isActive ? "text-[#25C4B4]" : "text-zinc-500")} />
              <span>{v.label}</span>
              {v.id === "dependencies" && activeView === "dependencies" && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#25C4B4] animate-pulse" />
              )}
            </Link>
          );
        })}
      </div>

      {entityParam && (
        <div className="ml-auto flex items-center gap-1.5 text-[10.5px] font-mono text-zinc-400 bg-[#10151F] px-2.5 py-1 rounded border border-[#2A3547] shrink-0">
          <span className="text-zinc-500">Active Entity:</span>
          <span className="text-[#25C4B4] font-semibold truncate max-w-[140px]">{entityParam}</span>
        </div>
      )}
    </nav>
  );
}
