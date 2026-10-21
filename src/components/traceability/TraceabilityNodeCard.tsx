"use client";

import React from "react";
import Link from "next/link";
import {
  FileText,
  Boxes,
  Layers,
  FileCode2,
  Binary,
  Code2,
  CheckCircle2,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { AnyTraceEntity, EntityType } from "@/types/entities";
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

interface TraceabilityNodeCardProps {
  entity: AnyTraceEntity;
  isSelected?: boolean;
  onSelect: (entity: AnyTraceEntity) => void;
  relationLabel?: string;
}

export function TraceabilityNodeCard({
  entity,
  isSelected = false,
  onSelect,
  relationLabel,
}: TraceabilityNodeCardProps) {
  void relationLabel;
  const Icon = entityIcons[entity.type] || FileCode2;

  // Derive status badge
  let statusBadge: React.ReactNode = null;
  if ("lastRunStatus" in entity) {
    statusBadge = (
      <Badge variant={entity.lastRunStatus === "PASSED" ? "success" : "danger"} size="sm">
        {entity.lastRunStatus}
      </Badge>
    );
  } else if ("status" in entity) {
    statusBadge = (
      <Badge variant="default" size="sm">
        {entity.status}
      </Badge>
    );
  } else if ("visibility" in entity) {
    statusBadge = (
      <Badge variant="default" size="sm">
        {entity.visibility}
      </Badge>
    );
  } else if ("layer" in entity) {
    statusBadge = (
      <Badge variant="architecture" size="sm">
        {entity.layer}
      </Badge>
    );
  }

  return (
    <div
      onClick={() => onSelect(entity)}
      className={cn(
        "p-3.5 rounded-lg border bg-zinc-900/80 hover:bg-zinc-900 transition-all duration-150 cursor-pointer text-left space-y-2 group shadow-sm relative",
        isSelected
          ? "border-cyan-500 ring-2 ring-cyan-500/40 bg-zinc-900 shadow-cyan-950/40"
          : "border-zinc-800 hover:border-zinc-700"
      )}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Badge variant={entity.type} size="sm" dot>
            {entity.type}
          </Badge>
          {statusBadge}
        </div>

        {/* Action: Open in Graph */}
        <Link
          href={`/graph?entity=${entity.id}`}
          onClick={(e) => e.stopPropagation()}
          className="p-1 rounded text-zinc-500 hover:text-cyan-300 hover:bg-zinc-800 transition-colors"
          title="Open this entity in Knowledge Graph Explorer"
        >
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Title & Details */}
      <div className="flex items-start gap-2">
        <Icon className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-semibold text-zinc-100 group-hover:text-cyan-300 transition-colors truncate">
            {entity.name}
          </h4>
          {"signature" in entity && (
            <p className="text-[11px] font-mono text-emerald-400 truncate mt-0.5">
              {entity.signature}
            </p>
          )}
          {entity.filePath && (
            <p className="text-[10px] font-mono text-zinc-500 truncate mt-0.5">
              {entity.filePath}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
