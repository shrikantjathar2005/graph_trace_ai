"use client";

import React, { useState, useMemo } from "react";
import { Search, Filter, Layers, CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";
import { TraceabilityMatrixRow, CoverageStatus } from "@/types/traceability";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

interface RequirementListProps {
  rows: TraceabilityMatrixRow[];
  selectedReqId: string | null;
  onSelectRequirement: (reqId: string) => void;
}

export function RequirementList({
  rows,
  selectedReqId,
  onSelectRequirement,
}: RequirementListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "FUNCTIONAL" | "NON_FUNCTIONAL">("ALL");
  const [coverageFilter, setCoverageFilter] = useState<"ALL" | CoverageStatus>("ALL");

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const req = row.requirement;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          req.reqCode.toLowerCase().includes(q) ||
          req.name.toLowerCase().includes(q) ||
          req.description?.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Category filter
      if (categoryFilter === "FUNCTIONAL" && req.category !== "FUNCTIONAL") {
        return false;
      }
      if (
        categoryFilter === "NON_FUNCTIONAL" &&
        req.category === "FUNCTIONAL"
      ) {
        return false;
      }

      // Coverage filter
      if (coverageFilter !== "ALL" && row.coverageStatus !== coverageFilter) {
        return false;
      }

      return true;
    });
  }, [rows, searchQuery, categoryFilter, coverageFilter]);

  return (
    <div className="flex flex-col h-full border border-zinc-800/80 rounded-lg bg-zinc-950/60 overflow-hidden">
      {/* Search Header */}
      <div className="p-3 border-b border-zinc-800/80 bg-zinc-900/40 space-y-2.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search requirements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 font-sans"
          />
        </div>

        {/* Filters */}
        <div className="space-y-1.5 text-[11px] font-mono">
          {/* Category Tabs */}
          <div className="flex items-center gap-1">
            <span className="text-zinc-500 text-[10px] uppercase w-12 shrink-0">Type:</span>
            {(["ALL", "FUNCTIONAL", "NON_FUNCTIONAL"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] border transition-colors cursor-pointer",
                  categoryFilter === cat
                    ? "bg-zinc-800 border-zinc-700 text-zinc-100 font-medium"
                    : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-300"
                )}
              >
                {cat === "ALL" ? "All" : cat === "FUNCTIONAL" ? "Functional" : "Non-Func"}
              </button>
            ))}
          </div>

          {/* Coverage Tabs */}
          <div className="flex items-center gap-1">
            <span className="text-zinc-500 text-[10px] uppercase w-12 shrink-0">Status:</span>
            {(["ALL", "FULL", "PARTIAL", "UNTESTED"] as const).map((cov) => (
              <button
                key={cov}
                onClick={() => setCoverageFilter(cov)}
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] border transition-colors cursor-pointer",
                  coverageFilter === cov
                    ? "bg-zinc-800 border-zinc-700 text-zinc-100 font-medium"
                    : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-300"
                )}
              >
                {cov === "ALL" ? "All" : cov}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List items */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60 p-1">
        {filteredRows.length > 0 ? (
          filteredRows.map((row) => {
            const req = row.requirement;
            const isSelected = req.id === selectedReqId;

            return (
              <div
                key={req.id}
                onClick={() => onSelectRequirement(req.id)}
                className={cn(
                  "p-3 rounded-md cursor-pointer transition-all duration-150 space-y-1.5 my-0.5 border text-left group",
                  isSelected
                    ? "bg-zinc-900 border-zinc-700 shadow-xs ring-1 ring-cyan-500/50"
                    : "bg-transparent border-transparent hover:bg-zinc-900/50 hover:border-zinc-800/80"
                )}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-xs text-amber-400">
                      {req.reqCode}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 px-1 py-0.2 rounded bg-zinc-900 border border-zinc-800">
                      {req.category}
                    </span>
                  </div>

                  <Badge
                    variant={
                      row.coverageStatus === "FULL"
                        ? "success"
                        : row.coverageStatus === "PARTIAL"
                        ? "warning"
                        : "danger"
                    }
                    size="sm"
                  >
                    {row.coverageStatus}
                  </Badge>
                </div>

                <p
                  className={cn(
                    "text-xs font-medium line-clamp-1 transition-colors",
                    isSelected ? "text-cyan-200" : "text-zinc-200 group-hover:text-zinc-100"
                  )}
                >
                  {req.name}
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                  <span>{row.tests.length} tests linked</span>
                  <span className="text-zinc-400">{row.coverageScore}% covered</span>
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState
            title="No requirements found"
            description="Try relaxing your search query or status filter."
            actionLabel="Reset filters"
            onAction={() => {
              setSearchQuery("");
              setCategoryFilter("ALL");
              setCoverageFilter("ALL");
            }}
          />
        )}
      </div>

      {/* Footer count */}
      <div className="p-2.5 border-t border-zinc-800/80 bg-zinc-950/80 text-[11px] font-mono text-zinc-500 flex items-center justify-between">
        <span>Showing {filteredRows.length} of {rows.length}</span>
        <span className="text-zinc-400">Click to trace</span>
      </div>
    </div>
  );
}
