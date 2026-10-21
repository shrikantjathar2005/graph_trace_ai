"use client";

import React from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
} from "@xyflow/react";
import { cn } from "@/lib/utils";

const relationshipColorClasses: Record<string, string> = {
  REALIZES: "text-purple-300 border-purple-700/80 bg-purple-950/90 hover:border-purple-400",
  CONTAINS: "text-zinc-300 border-zinc-700 bg-zinc-900/90 hover:border-zinc-400",
  IMPLEMENTS: "text-cyan-300 border-cyan-700/80 bg-cyan-950/90 hover:border-cyan-400",
  CALLS: "text-emerald-300 border-emerald-700/80 bg-emerald-950/90 hover:border-emerald-400",
  VERIFIES: "text-rose-300 border-rose-700/80 bg-rose-950/90 hover:border-rose-400",
  DOCUMENTS: "text-teal-300 border-teal-700/80 bg-teal-950/90 hover:border-teal-400",
  DEPENDS_ON: "text-amber-300 border-amber-700/80 bg-amber-950/90 hover:border-amber-400",
};

interface RelationshipEdgeData {
  relationship?: string;
  confidence?: number;
  isDimmed?: boolean;
  isHighlighted?: boolean;
  onEdgeClick?: (edgeId: string) => void;
}

export function RelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const edgeData = data as RelationshipEdgeData | undefined;
  const relationship = edgeData?.relationship || "DEPENDS_ON";
  const badgeStyle = relationshipColorClasses[relationship] || "text-zinc-300 border-zinc-700 bg-zinc-900";
  const isDimmed = edgeData?.isDimmed ?? false;
  const isHighlighted = (edgeData?.isHighlighted ?? false) || Boolean(selected);

  const strokeColor = isHighlighted ? "#25C4B4" : "#4A5568";
  const strokeWidth = isHighlighted ? 2.5 : 1.5;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: strokeColor,
          strokeWidth,
          opacity: isDimmed ? 0.15 : 1,
          filter: isHighlighted ? "drop-shadow(0 0 6px rgba(37, 196, 180, 0.6))" : undefined,
          transition: "all 0.15s ease",
          ...style,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
            opacity: isDimmed ? 0.15 : 1,
            zIndex: isHighlighted ? 15 : 1,
          }}
          className="nodrag nopan transition-opacity duration-200"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              edgeData?.onEdgeClick?.(id);
            }}
            className={cn(
              "px-2 py-0.5 rounded text-[9.5px] font-mono font-semibold uppercase tracking-wider border shadow-md transition-all duration-150 select-none cursor-pointer",
              badgeStyle,
              isHighlighted && "ring-2 ring-[#25C4B4] scale-110 shadow-[0_0_12px_rgba(37,196,180,0.4)]"
            )}
            title={edgeData?.confidence !== undefined ? `${relationship} (Confidence: ${Math.round(edgeData.confidence * 100)}%)` : relationship}
          >
            {relationship}
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
