"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import {
  FileText,
  Boxes,
  Layers,
  FileCode2,
  Binary,
  Code2,
  CheckCircle2,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EntityType } from "@/types/entities";
import { GraphNodeData } from "@/types/graph";
import { cn } from "@/lib/utils";

const entityIcons: Record<EntityType, React.ElementType> = {
  requirement: FileText,
  architecture: Boxes,
  component: Layers,
  module: FileCode2,
  class: Binary,
  method: Code2,
  test: CheckCircle2,
  documentation: BookOpen,
};

const entityAccentBorders: Record<EntityType, string> = {
  requirement: "hover:border-amber-500/70 border-l-amber-500",
  architecture: "hover:border-purple-500/70 border-l-purple-500",
  component: "hover:border-cyan-500/70 border-l-cyan-500",
  module: "hover:border-indigo-500/70 border-l-indigo-500",
  class: "hover:border-blue-500/70 border-l-blue-500",
  method: "hover:border-emerald-500/70 border-l-emerald-500",
  test: "hover:border-rose-500/70 border-l-rose-500",
  documentation: "hover:border-teal-500/70 border-l-teal-500",
};

export const CustomEntityNode = memo(({ data, selected, targetPosition, sourcePosition }: NodeProps) => {
  const nodeData = data as unknown as GraphNodeData;
  const Icon = entityIcons[nodeData.type] || FileCode2;
  const accentBorder = entityAccentBorders[nodeData.type] || "border-l-zinc-500";

  return (
    <div
      className={cn(
        "w-[260px] rounded-md border border-zinc-800 bg-zinc-950/95 backdrop-blur-md p-3 shadow-md transition-all duration-150 border-l-4 text-left group",
        accentBorder,
        selected && "ring-2 ring-cyan-400 border-zinc-600 bg-zinc-900 shadow-cyan-950/30",
        nodeData.highlighted && "ring-2 ring-amber-400/80 bg-zinc-900"
      )}
    >
      {/* React Flow Handles */}
      <Handle
        type="target"
        position={targetPosition || Position.Top}
        className="!w-2 !h-2 !bg-zinc-600 !border-zinc-900 group-hover:!bg-cyan-400 transition-colors"
      />
      <Handle
        type="source"
        position={sourcePosition || Position.Bottom}
        className="!w-2 !h-2 !bg-zinc-600 !border-zinc-900 group-hover:!bg-cyan-400 transition-colors"
      />

      {/* Header with Entity Badge & ID */}
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Badge variant={nodeData.type} size="sm" dot>
            {nodeData.type}
          </Badge>
        </div>
        <span className="text-[9px] font-mono text-zinc-500 truncate max-w-[80px]">
          {nodeData.id}
        </span>
      </div>

      {/* Node Main Title */}
      <div className="flex items-start gap-2 mt-1">
        <Icon className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-semibold text-zinc-100 truncate group-hover:text-cyan-300 transition-colors">
            {nodeData.label}
          </h4>
          {nodeData.subtitle && (
            <p className="text-[10px] text-zinc-400 font-mono truncate mt-0.5">
              {nodeData.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Metrics / Risk Footer */}
      {(nodeData.metrics || nodeData.risk) && (
        <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            {nodeData.metrics?.loc && (
              <span>{nodeData.metrics.loc} LOC</span>
            )}
            {nodeData.metrics?.methods && (
              <span>{nodeData.metrics.methods} methods</span>
            )}
            {nodeData.metrics?.testsCount && (
              <span>{nodeData.metrics.testsCount} tests</span>
            )}
            {nodeData.metrics?.complexity && (
              <span>CC: {nodeData.metrics.complexity}</span>
            )}
          </div>

          {nodeData.risk && (
            <span
              className={cn(
                "flex items-center gap-1 font-semibold",
                nodeData.risk === "CRITICAL"
                  ? "text-rose-400"
                  : nodeData.risk === "HIGH"
                  ? "text-amber-400"
                  : "text-zinc-400"
              )}
            >
              <AlertTriangle className="w-2.5 h-2.5" />
              {nodeData.risk}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

CustomEntityNode.displayName = "CustomEntityNode";
