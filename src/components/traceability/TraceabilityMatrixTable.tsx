"use client";

import React from "react";
import { Check, Minus, CheckCircle2 } from "lucide-react";
import { TraceabilityMatrixRow } from "@/types/traceability";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface TraceabilityMatrixTableProps {
  rows: TraceabilityMatrixRow[];
  selectedReqId: string | null;
  onSelectRequirement: (reqId: string) => void;
}

export function TraceabilityMatrixTable({
  rows,
  selectedReqId,
  onSelectRequirement,
}: TraceabilityMatrixTableProps) {
  const renderCell = (count: number, label?: string) => {
    if (count > 0) {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-emerald-400 font-semibold">
          <Check className="w-3 h-3 text-emerald-400 stroke-[2.5]" />
          <span>{count}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-zinc-600 font-mono">
        <Minus className="w-3 h-3" />
      </span>
    );
  };

  return (
    <div className="border border-zinc-800/80 rounded-lg bg-zinc-950/60 overflow-hidden">
      <div className="p-3 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-200">
            Traceability Matrix Overview
          </span>
          <span className="text-[10px] font-mono text-zinc-500">
            ({rows.length} specifications)
          </span>
        </div>
        <span className="text-[11px] font-mono text-zinc-500">
          Click any row to trace path
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/60 text-[10px] font-mono uppercase text-zinc-400">
              <th className="py-2.5 px-3 font-semibold">Requirement</th>
              <th className="py-2.5 px-3 font-semibold text-center">Architecture</th>
              <th className="py-2.5 px-3 font-semibold text-center">Component</th>
              <th className="py-2.5 px-3 font-semibold text-center">Module</th>
              <th className="py-2.5 px-3 font-semibold text-center">Class</th>
              <th className="py-2.5 px-3 font-semibold text-center">Method</th>
              <th className="py-2.5 px-3 font-semibold text-center">Test</th>
              <th className="py-2.5 px-3 font-semibold text-center">Docs</th>
              <th className="py-2.5 px-3 font-semibold text-right">Coverage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-sans">
            {rows.map((row) => {
              const isSelected = row.requirement.id === selectedReqId;

              return (
                <tr
                  key={row.requirement.id}
                  onClick={() => onSelectRequirement(row.requirement.id)}
                  className={cn(
                    "cursor-pointer transition-colors text-xs",
                    isSelected
                      ? "bg-zinc-900/90 font-medium"
                      : "hover:bg-zinc-900/40"
                  )}
                >
                  {/* Requirement Name */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400">
                        {row.requirement.reqCode}
                      </span>
                      <span className="text-zinc-200 truncate max-w-[220px]">
                        {row.requirement.name}
                      </span>
                    </div>
                  </td>

                  {/* Architecture */}
                  <td className="py-2.5 px-3 text-center">
                    {renderCell(row.architectureNodes.length)}
                  </td>

                  {/* Component */}
                  <td className="py-2.5 px-3 text-center">
                    {renderCell(row.components.length)}
                  </td>

                  {/* Module */}
                  <td className="py-2.5 px-3 text-center">
                    {renderCell(row.modules.length)}
                  </td>

                  {/* Class */}
                  <td className="py-2.5 px-3 text-center">
                    {renderCell(row.classes.length)}
                  </td>

                  {/* Method */}
                  <td className="py-2.5 px-3 text-center">
                    {renderCell(row.methods.length)}
                  </td>

                  {/* Test */}
                  <td className="py-2.5 px-3 text-center">
                    {renderCell(row.tests.length)}
                  </td>

                  {/* Docs */}
                  <td className="py-2.5 px-3 text-center">
                    {renderCell(row.documents.length)}
                  </td>

                  {/* Coverage */}
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-mono text-zinc-300 font-semibold">
                        {row.coverageScore}%
                      </span>
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
