"use client";

import React from "react";
import {
  Filter,
  Search,
  RotateCcw,
  Maximize2,
  ArrowDown,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge, entityDotColors } from "@/components/ui/Badge";
import { EntityType } from "@/types/entities";

interface GraphToolbarProps {
  activeFilters: Set<EntityType>;
  onToggleFilter: (type: EntityType) => void;
  onSelectAllFilters: () => void;
  onClearFilters: () => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  layoutDirection: "TB" | "LR";
  onToggleDirection: () => void;
  onFitView: () => void;
  onRelayout: () => void;
  nodeCount: number;
  edgeCount: number;
}

const entityTypes: EntityType[] = [
  "requirement",
  "architecture",
  "component",
  "module",
  "class",
  "method",
  "test",
  "documentation",
];

export function GraphToolbar({
  activeFilters,
  onToggleFilter,
  onSelectAllFilters,
  onClearFilters,
  searchQuery,
  onSearchChange,
  layoutDirection,
  onToggleDirection,
  onFitView,
  onRelayout,
  nodeCount,
  edgeCount,
}: GraphToolbarProps) {
  const allSelected = activeFilters.size === entityTypes.length;

  return (
    <div className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 z-30">
      {/* Entity Type Filter Pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-mono text-zinc-500 mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3" /> Filter:
        </span>

        <button
          onClick={allSelected ? onClearFilters : onSelectAllFilters}
          className="px-2 py-0.5 rounded text-[11px] font-mono border border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          {allSelected ? "Clear" : "All"}
        </button>

        {entityTypes.map((type) => {
          const isActive = activeFilters.has(type);
          return (
            <button
              key={type}
              onClick={() => onToggleFilter(type)}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border transition-all cursor-pointer ${
                isActive
                  ? "bg-zinc-900 text-zinc-200 border-zinc-700 shadow-xs"
                  : "bg-zinc-950/60 text-zinc-600 border-zinc-900 opacity-60 hover:opacity-90"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${entityDotColors[type]}`} />
              <span className="capitalize">{type}</span>
            </button>
          );
        })}
      </div>

      {/* Right Controls: Search, Direction, Fit, Stats */}
      <div className="flex items-center gap-2.5 ml-auto">
        {/* Search */}
        <div className="relative">
          <Search className="w-3 h-3 text-zinc-500 absolute left-2 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded px-2 pl-6 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 font-mono w-40"
          />
        </div>

        {/* Direction Switcher (TB / LR) */}
        <Button
          size="xs"
          variant="outline"
          onClick={onToggleDirection}
          title={`Switch Layout: Currently ${layoutDirection === "TB" ? "Top-to-Bottom" : "Left-to-Right"}`}
          icon={layoutDirection === "TB" ? <ArrowDown className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
        >
          {layoutDirection}
        </Button>

        {/* Fit View */}
        <Button
          size="xs"
          variant="outline"
          onClick={onFitView}
          icon={<Maximize2 className="w-3 h-3" />}
          title="Fit view"
        >
          Fit
        </Button>

        {/* Relayout */}
        <Button
          size="xs"
          variant="outline"
          onClick={onRelayout}
          icon={<RotateCcw className="w-3 h-3" />}
          title="Re-run Dagre auto-layout"
        >
          Re-align
        </Button>

        {/* Counts badge */}
        <div className="hidden md:flex items-center gap-1.5 pl-2 border-l border-zinc-800 text-[11px] font-mono text-zinc-400">
          <Badge variant="outline" size="sm">
            {nodeCount} Nodes
          </Badge>
          <Badge variant="outline" size="sm">
            {edgeCount} Edges
          </Badge>
        </div>
      </div>
    </div>
  );
}
