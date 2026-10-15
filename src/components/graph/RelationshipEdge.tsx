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
  REALIZES: "text-purple-400 border-purple-800/60 bg-purple-950/80",
  CONTAINS: "text-zinc-400 border-zinc-700 bg-zinc-900/90",
  IMPLEMENTS: "text-cyan-400 border-cyan-800/60 bg-cyan-950/80",
  CALLS: "text-emerald-400 border-emerald-800/60 bg-emerald-950/80",
  VERIFIES: "text-rose-400 border-rose-800/60 bg-rose-950/80",
  DOCUMENTS: "text-teal-400 border-teal-800/60 bg-teal-950/80",
  DEPENDS_ON: "text-amber-400 border-amber-800/60 bg-amber-950/80",
};

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

  const edgeData = data as { relationship?: string; confidence?: number } | undefined;
  const relationship = edgeData?.relationship || "DEPENDS_ON";
  const badgeStyle = relationshipColorClasses[relationship] || "text-zinc-400 border-zinc-700 bg-zinc-900";

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: "#3f3f46",
          strokeWidth: 1.5,
          ...style,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          <div
            className={cn(
              "px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold uppercase tracking-wider border shadow-xs transition-transform hover:scale-105 select-none",
              badgeStyle
            )}
            title={edgeData?.confidence ? `Confidence: ${Math.round(edgeData.confidence * 100)}%` : undefined}
          >
            {relationship}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
