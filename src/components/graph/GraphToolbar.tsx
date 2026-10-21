"use client";

import React from "react";
import {
  Filter,
  Search,
  RotateCcw,
  Maximize2,
  Crosshair,
  X,
  Layers,
  ArrowDown,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge, entityDotColors } from "@/components/ui/Badge";
import { EntityType } from "@/types/entities";
import { LayoutMode } from "@/lib/layoutEngine";

interface GraphToolbarProps {
  activeFilters: Set<EntityType>;
  onToggleFilter: (type: EntityType) => void;
  onSelectAllFilters: () => void;
  onClearFilters: () => void;
  filterCounts: Record<EntityType, number>;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  searchMatchCount: number;
  layoutMode: LayoutMode;
  onChangeLayoutMode: (mode: LayoutMode) => void;
  isFocusNeighborhoodActive: boolean;
  onToggleFocusNeighborhood: () => void;
  hasSelectedNode: boolean;
  selectedNodeLabel?: string;
  onClearSelection: () => void;
  onFitView: () => void;
  onRelayout: () => void;
  nodeCount: number;
  totalNodes: number;
  edgeCount: number;
  requirementCount: number;
  testCount: number;
  isDependenciesView?: boolean;
  dependencyEdgesCount?: number;
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
  filterCounts,
  searchQuery,
  onSearchChange,
  searchMatchCount,
  layoutMode,
  onChangeLayoutMode,
  isFocusNeighborhoodActive,
  onToggleFocusNeighborhood,
  hasSelectedNode,
  selectedNodeLabel,
  onClearSelection,
  onFitView,
  onRelayout,
  nodeCount,
  totalNodes,
  edgeCount,
  requirementCount,
  testCount,
  isDependenciesView = false,
  dependencyEdgesCount = 0,
}: GraphToolbarProps) {
  const allSelected = activeFilters.size === entityTypes.length;

  return (
    <div className="border-b border-[#2A3547] bg-[#141B27]/95 backdrop-blur-md px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5 z-30 transition-colors">
      {/* Category Filter Badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-mono text-zinc-400 mr-1 flex items-center gap-1 font-semibold">
          <Filter className="w-3.5 h-3.5 text-[#25C4B4]" /> Filters:
        </span>

        {isDependenciesView && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#25C4B4]/15 border border-[#25C4B4]/40 text-[#25C4B4] text-[11px] font-mono">
            <Layers className="w-3 h-3 text-[#25C4B4]" />
            <span>Dependency Mode ({dependencyEdgesCount} links)</span>
          </div>
        )}

        {isDependenciesView && dependencyEdgesCount === 0 && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-950/40 border border-amber-800/40 text-amber-300 text-[10px] font-mono">
            <span>No structural call/import coupling detected</span>
          </div>
        )}

        <button
          type="button"
          onClick={allSelected ? onClearFilters : onSelectAllFilters}
          className="px-2 py-0.5 rounded text-[11px] font-mono border border-[#2A3547] bg-[#10151F] text-zinc-300 hover:bg-[#192333] hover:border-[#25C4B4]/50 transition-colors cursor-pointer"
        >
          {allSelected ? "Clear" : "All"}
        </button>

        {entityTypes.map((type) => {
          const isActive = activeFilters.has(type);
          const count = filterCounts[type] || 0;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onToggleFilter(type)}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border transition-all cursor-pointer ${
                isActive
                  ? "bg-[#10151F] text-zinc-200 border-[#2A3547] shadow-xs hover:border-[#25C4B4]/50"
                  : "bg-[#10151F]/40 text-zinc-600 border-[#1c2433] opacity-50 hover:opacity-80"
              }`}
              title={`${type}: ${count} nodes`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${entityDotColors[type]}`} />
              <span className="capitalize">{type}</span>
              <span className="text-[9.5px] opacity-70 font-mono">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Right Controls: Search, Layout Selector, Focus Neighborhood, Fit, Counts */}
      <div className="flex items-center gap-2 flex-wrap ml-auto">
        {/* Search Input */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search nodes by name or ID..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-[#10151F] border border-[#2A3547] rounded-md px-2.5 pl-8 pr-7 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#25C4B4] font-mono w-44 md:w-52 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2 text-zinc-500 hover:text-zinc-300"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {searchQuery && (
          <span className="text-[10.5px] font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
            {searchMatchCount} {searchMatchCount === 1 ? "match" : "matches"}
          </span>
        )}

        {/* Selected Node Status Pill */}
        {hasSelectedNode && (
          <div className="flex items-center gap-1.5 bg-[#192333] border border-[#25C4B4]/40 px-2 py-1 rounded-md text-[11px] font-mono text-[#25C4B4]">
            <span className="truncate max-w-[120px]">{selectedNodeLabel || "Selected"}</span>
            <button
              type="button"
              onClick={onClearSelection}
              className="text-zinc-400 hover:text-zinc-200 ml-1"
              title="Clear selection"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Focus Neighborhood Action */}
        <Button
          size="xs"
          variant={isFocusNeighborhoodActive ? "primary" : "outline"}
          onClick={onToggleFocusNeighborhood}
          disabled={!hasSelectedNode}
          title={
            hasSelectedNode
              ? isFocusNeighborhoodActive
                ? "Exit Neighborhood Focus"
                : "Focus directly connected neighborhood"
              : "Select a node to focus its neighborhood"
          }
          icon={<Crosshair className="w-3.5 h-3.5" />}
        >
          {isFocusNeighborhoodActive ? "Focused" : "Focus"}
        </Button>

        {/* Layout Selector */}
        <div className="flex items-center border border-[#2A3547] rounded-md overflow-hidden bg-[#10151F]">
          <button
            type="button"
            onClick={() => onChangeLayoutMode("TB")}
            className={`px-2 py-1 text-[11px] font-mono flex items-center gap-1 transition-colors ${
              layoutMode === "TB"
                ? "bg-[#25C4B4] text-[#10151F] font-bold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-[#192333]"
            }`}
            title="Hierarchical DAG (Top to Bottom)"
          >
            <ArrowDown className="w-3 h-3" /> DAG
          </button>
          <button
            type="button"
            onClick={() => onChangeLayoutMode("TIERED")}
            className={`px-2 py-1 text-[11px] font-mono flex items-center gap-1 transition-colors border-l border-[#2A3547] ${
              layoutMode === "TIERED"
                ? "bg-[#25C4B4] text-[#10151F] font-bold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-[#192333]"
            }`}
            title="8-Tier Architecture Grid"
          >
            <Layers className="w-3 h-3" /> Tiered
          </button>
          <button
            type="button"
            onClick={() => onChangeLayoutMode("LR")}
            className={`px-2 py-1 text-[11px] font-mono flex items-center gap-1 transition-colors border-l border-[#2A3547] ${
              layoutMode === "LR"
                ? "bg-[#25C4B4] text-[#10151F] font-bold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-[#192333]"
            }`}
            title="Horizontal Architecture Flow (Left to Right)"
          >
            <ArrowRight className="w-3 h-3" /> Flow
          </button>
        </div>

        {/* Fit View */}
        <Button
          size="xs"
          variant="outline"
          onClick={onFitView}
          icon={<Maximize2 className="w-3.5 h-3.5" />}
          title="Fit graph to view with optimal padding"
        >
          Fit
        </Button>

        {/* Relayout */}
        <Button
          size="xs"
          variant="outline"
          onClick={onRelayout}
          icon={<RotateCcw className="w-3.5 h-3.5" />}
          title="Recompute layout and re-align nodes"
        >
          Reset
        </Button>

        {/* Computed Project Metrics Badges */}
        <div className="hidden xl:flex items-center gap-1.5 pl-2 border-l border-[#2A3547] text-[11px] font-mono text-zinc-400">
          <Badge variant="outline" size="sm" title="Visible vs total nodes in active graph">
            {nodeCount} / {totalNodes} Nodes
          </Badge>
          <Badge variant="outline" size="sm" title="Total relationship trace links in active graph">
            {edgeCount} Edges
          </Badge>
          <Badge variant="outline" size="sm" title="Discovered software requirements in project">
            {requirementCount} Req
          </Badge>
          <Badge variant="outline" size="sm" title="Discovered test suite artifacts in project (static verification mapping)">
            {testCount} Tests
          </Badge>
        </div>
      </div>
    </div>
  );
}
