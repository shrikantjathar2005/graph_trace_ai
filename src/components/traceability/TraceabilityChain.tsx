"use client";

import React from "react";
import {
  ArrowDown,
  AlertTriangle,
  FileText,
  Boxes,
  Layers,
  FileCode2,
  Binary,
  Code2,
  CheckCircle2,
  BookOpen,
  Info,
} from "lucide-react";
import { TraceabilityMatrixRow } from "@/types/traceability";
import { AnyTraceEntity, EntityType } from "@/types/entities";
import { TraceabilityNodeCard } from "./TraceabilityNodeCard";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface TraceabilityChainProps {
  row: TraceabilityMatrixRow | null;
  selectedEntity: AnyTraceEntity | null;
  onSelectEntity: (entity: AnyTraceEntity) => void;
}

interface TierDefinition {
  tier: EntityType;
  label: string;
  relationLabel: string;
  icon: React.ElementType;
}

const tiers: TierDefinition[] = [
  { tier: "requirement", label: "Requirement", relationLabel: "DEFINES", icon: FileText },
  { tier: "architecture", label: "Architecture", relationLabel: "REALIZES", icon: Boxes },
  { tier: "component", label: "Component", relationLabel: "CONTAINS", icon: Layers },
  { tier: "module", label: "Module", relationLabel: "IMPLEMENTS", icon: FileCode2 },
  { tier: "class", label: "Class", relationLabel: "CONTAINS", icon: Binary },
  { tier: "method", label: "Method", relationLabel: "CALLS", icon: Code2 },
  { tier: "test", label: "Test Verification", relationLabel: "VERIFIES", icon: CheckCircle2 },
  { tier: "documentation", label: "Documentation", relationLabel: "DOCUMENTS", icon: BookOpen },
];

export function TraceabilityChain({
  row,
  selectedEntity,
  onSelectEntity,
}: TraceabilityChainProps) {
  if (!row) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
        <p className="text-xs font-mono">Select a requirement from the left list to trace its path.</p>
      </div>
    );
  }

  // Get items for each tier from the row
  const getTierItems = (tier: EntityType): AnyTraceEntity[] => {
    switch (tier) {
      case "requirement":
        return [row.requirement];
      case "architecture":
        return row.architectureNodes;
      case "component":
        return row.components;
      case "module":
        return row.modules;
      case "class":
        return row.classes;
      case "method":
        return row.methods;
      case "test":
        return row.tests;
      case "documentation":
        return row.documents;
      default:
        return [];
    }
  };

  return (
    <div className="flex flex-col h-full border border-zinc-800/80 rounded-lg bg-zinc-950/60 overflow-hidden">
      {/* Header Bar */}
      <div className="p-3.5 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-amber-400">
            {row.requirement.reqCode}
          </span>
          <span className="text-xs font-medium text-zinc-200 truncate">
            {row.requirement.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
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
            {row.coverageStatus} COVERAGE
          </Badge>
          <span className="text-xs font-mono font-bold text-zinc-100">
            {row.coverageScore}%
          </span>
        </div>
      </div>

      {/* Centerpiece Visual Path Flow */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {tiers.map((t, idx) => {
          const items = getTierItems(t.tier);
          const hasItems = items.length > 0;
          const isOptionalClassTier = t.tier === "class" && (row.methods.length > 0 || row.modules.some(m => m.language === "Go" || m.language === "Python"));
          
          // Check if explicit missing link is declared
          const missingDeclaration = row.missingLinks?.find((m) => m.tier === t.tier);

          return (
            <React.Fragment key={t.tier}>
              {/* Connector between tiers */}
              {idx > 0 && (
                <div className="flex flex-col items-center justify-center my-1 py-1">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-500">
                    <ArrowDown className="w-2.5 h-2.5 text-cyan-400" />
                    <span>{t.relationLabel}</span>
                  </div>
                </div>
              )}

              {/* Tier Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span className="flex items-center gap-1.5 uppercase font-semibold">
                    <span className="text-zinc-600">{idx + 1}.</span>
                    <span>{t.label}</span>
                  </span>
                  <span className="text-[10px]">
                    {hasItems ? `${items.length} mapped` : "0 mapped"}
                  </span>
                </div>

                {hasItems ? (
                  <div className="space-y-2">
                    {items.map((item) => (
                      <TraceabilityNodeCard
                        key={item.id}
                        entity={item}
                        isSelected={selectedEntity?.id === item.id}
                        onSelect={onSelectEntity}
                        relationLabel={t.relationLabel}
                      />
                    ))}
                  </div>
                ) : (
                  /* MISSING LINK VISUALIZATION */
                  <div
                    className={cn(
                      "p-3.5 rounded-lg border flex items-start gap-3 transition-colors",
                      t.tier === "test"
                        ? "border-rose-900/60 bg-rose-950/20 text-rose-300"
                        : "border-amber-900/60 bg-amber-950/20 text-amber-300"
                    )}
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs">
                          {t.tier === "test"
                            ? "TEST COVERAGE MISSING"
                            : `${t.label.toUpperCase()} LINK MISSING`}
                        </span>
                        <Badge variant="danger" size="sm">
                          GAP DETECTED
                        </Badge>
                      </div>
                      <p className="text-xs mt-1 text-zinc-300">
                        {missingDeclaration?.message ||
                          `No ${t.label.toLowerCase()} artifact linked in the knowledge graph. This breaks end-to-end verification.`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
