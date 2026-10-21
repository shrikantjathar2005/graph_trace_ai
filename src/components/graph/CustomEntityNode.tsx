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
  requirement: "border-l-amber-500 hover:border-amber-500/70",
  architecture: "border-l-purple-500 hover:border-purple-500/70",
  component: "border-l-cyan-500 hover:border-cyan-500/70",
  module: "border-l-indigo-500 hover:border-indigo-500/70",
  class: "border-l-blue-500 hover:border-blue-500/70",
  method: "border-l-emerald-500 hover:border-emerald-500/70",
  test: "border-l-rose-500 hover:border-rose-500/70",
  documentation: "border-l-teal-400 hover:border-teal-400/70",
};

interface CustomEntityNodeData extends GraphNodeData {
  isDimmed?: boolean;
  isNeighborhood?: boolean;
}

export const CustomEntityNode = memo(({ data, selected, targetPosition, sourcePosition }: NodeProps) => {
  const nodeData = data as unknown as CustomEntityNodeData;
  const Icon = entityIcons[nodeData.type] || FileCode2;
  const accentBorder = entityAccentBorders[nodeData.type] || "border-l-zinc-500";
  const isDimmed = nodeData.isDimmed ?? false;
  const isNeighborhood = nodeData.isNeighborhood ?? false;

  return (
    <div
      className={cn(
        "w-[270px] min-h-[110px] rounded-lg border border-[#2A3547] bg-[#141B27]/95 backdrop-blur-md p-3.5 shadow-lg transition-all duration-150 border-l-[4px] text-left group cursor-pointer relative",
        accentBorder,
        selected && "ring-2 ring-[#25C4B4] border-[#25C4B4] bg-[#192333] shadow-[0_0_24px_rgba(37,196,180,0.3)] scale-[1.02] z-20",
        nodeData.highlighted && !selected && "ring-2 ring-amber-400/90 border-amber-400/80 bg-[#1e201c] shadow-[0_0_18px_rgba(245,158,11,0.25)]",
        isNeighborhood && !selected && "ring-1 ring-[#25C4B4]/70 border-[#25C4B4]/50 shadow-[0_0_12px_rgba(37,196,180,0.15)]",
        isDimmed && "opacity-20 grayscale filter transition-opacity duration-200 pointer-events-none"
      )}
    >
      {/* React Flow Connection Handles */}
      <Handle
        type="target"
        position={targetPosition || Position.Top}
        className="!w-2.5 !h-2.5 !bg-[#2A3547] !border-2 !border-[#10151F] group-hover:!bg-[#25C4B4] transition-colors"
      />
      <Handle
        type="source"
        position={sourcePosition || Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-[#2A3547] !border-2 !border-[#10151F] group-hover:!bg-[#25C4B4] transition-colors"
      />

      {/* Header: Entity Badge & ID */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Badge variant={nodeData.type} size="sm" dot>
            {nodeData.type}
          </Badge>
        </div>
        <span className="text-[10px] font-mono text-zinc-400 bg-[#10151F]/80 px-1.5 py-0.5 rounded border border-[#2A3547]/80 truncate max-w-[95px]">
          {nodeData.id}
        </span>
      </div>

      {/* Title & Subtitle */}
      <div className="flex items-start gap-2">
        <Icon className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5 group-hover:text-[#25C4B4] transition-colors" />
        <div className="min-w-0 flex-1">
          <h4
            className="text-[12.5px] font-semibold text-zinc-100 leading-snug line-clamp-2 group-hover:text-[#25C4B4] transition-colors"
            title={nodeData.label}
          >
            {nodeData.label}
          </h4>
          {nodeData.subtitle && (
            <p
              className="text-[10px] text-zinc-400 font-mono truncate mt-1"
              title={nodeData.subtitle}
            >
              {nodeData.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Metrics / Risk Footer */}
      {(nodeData.metrics || nodeData.risk) && (
        <div className="mt-2.5 pt-2 border-t border-[#2A3547]/60 flex items-center justify-between text-[10px] font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            {nodeData.metrics?.loc !== undefined && (
              <span>{nodeData.metrics.loc} LOC</span>
            )}
            {nodeData.metrics?.methods !== undefined && (
              <span>{nodeData.metrics.methods} meth</span>
            )}
            {nodeData.metrics?.testsCount !== undefined && (
              <span>{nodeData.metrics.testsCount} tests</span>
            )}
            {nodeData.metrics?.complexity !== undefined && (
              <span>CC: {nodeData.metrics.complexity}</span>
            )}
          </div>

          {nodeData.risk && (
            <span
              className={cn(
                "flex items-center gap-1 font-semibold px-1 py-0.5 rounded text-[9px]",
                nodeData.risk === "CRITICAL"
                  ? "text-rose-400 bg-rose-950/40 border border-rose-800/40"
                  : nodeData.risk === "HIGH"
                  ? "text-amber-400 bg-amber-950/40 border border-amber-800/40"
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
