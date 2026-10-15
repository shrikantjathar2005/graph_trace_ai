"use client";

import React from "react";
import Link from "next/link";
import {
  ExternalLink,
  ArrowLeft,
  FileText,
  Boxes,
  Layers,
  FileCode2,
  Binary,
  Code2,
  CheckCircle2,
  BookOpen,
  ShieldCheck,
  Check,
  AlertTriangle,
} from "lucide-react";
import { TraceabilityMatrixRow } from "@/types/traceability";
import { AnyTraceEntity, EntityType, RequirementEntity, MethodEntity, TestEntity, ClassEntity } from "@/types/entities";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface TraceabilityInspectorProps {
  row: TraceabilityMatrixRow | null;
  selectedEntity: AnyTraceEntity | null;
  onResetToRequirement: () => void;
  onSelectEntity: (entity: AnyTraceEntity) => void;
}

export function TraceabilityInspector({
  row,
  selectedEntity,
  onResetToRequirement,
  onSelectEntity,
}: TraceabilityInspectorProps) {
  if (!row) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center text-zinc-500 border border-zinc-800/80 rounded-lg bg-zinc-950/60">
        <p className="text-xs font-mono">Select an artifact to inspect bidirectional traceability.</p>
      </div>
    );
  }

  const isRequirement = !selectedEntity || selectedEntity.id === row.requirement.id;
  const currentEntity = isRequirement ? row.requirement : selectedEntity;

  const req = row.requirement;
  const methodEntity = currentEntity.type === "method" ? (currentEntity as MethodEntity) : null;
  const testEntity = currentEntity.type === "test" ? (currentEntity as TestEntity) : null;
  const classEntity = currentEntity.type === "class" ? (currentEntity as ClassEntity) : null;

  return (
    <div className="flex flex-col h-full border border-zinc-800/80 rounded-lg bg-zinc-950/60 overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {!isRequirement && (
            <button
              onClick={onResetToRequirement}
              className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Return to requirement overview"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-xs font-semibold text-zinc-100 truncate">
            {isRequirement ? "Requirement Inspector" : "Artifact Drill-Down"}
          </span>
        </div>

        {/* Primary Action: Open in Graph */}
        <Link href={`/graph?entity=${currentEntity.id}`}>
          <Button
            size="xs"
            variant="outline"
            icon={<ExternalLink className="w-3 h-3 text-cyan-400" />}
          >
            Open in Graph
          </Button>
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Entity Card */}
        <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/70 space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant={currentEntity.type} size="sm" dot>
              {currentEntity.type}
            </Badge>
            <span className="font-mono text-[10px] text-zinc-500">{currentEntity.id}</span>
          </div>

          <h3 className="text-sm font-semibold text-zinc-100">{currentEntity.name}</h3>

          {currentEntity.description && (
            <p className="text-zinc-300 leading-relaxed">{currentEntity.description}</p>
          )}

          {currentEntity.filePath && (
            <div className="pt-2 border-t border-zinc-800/80">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">File Location</span>
              <p className="text-xs font-mono text-cyan-300 truncate mt-0.5">
                {currentEntity.filePath}
              </p>
            </div>
          )}
        </div>

        {/* 1. If looking at Requirement */}
        {isRequirement && (
          <>
            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded border border-zinc-800 bg-zinc-900/40 font-mono">
                <span className="text-[10px] text-zinc-500 uppercase block">Category</span>
                <span className="font-semibold text-zinc-200">{req.category}</span>
              </div>
              <div className="p-2.5 rounded border border-zinc-800 bg-zinc-900/40 font-mono">
                <span className="text-[10px] text-zinc-500 uppercase block">Priority</span>
                <span
                  className={cn(
                    "font-semibold",
                    req.priority === "CRITICAL"
                      ? "text-rose-400"
                      : req.priority === "HIGH"
                      ? "text-amber-400"
                      : "text-zinc-300"
                  )}
                >
                  {req.priority}
                </span>
              </div>
            </div>

            {/* Acceptance Criteria */}
            {req.acceptanceCriteria && req.acceptanceCriteria.length > 0 && (
              <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/40 space-y-2">
                <span className="text-[10px] font-mono uppercase text-amber-400 font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Acceptance Criteria
                </span>
                <ul className="space-y-1.5 text-zinc-300">
                  {req.acceptanceCriteria.map((c, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Implementation Summary */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase text-zinc-500 font-semibold">
                Implementation Units ({row.classes.length + row.methods.length})
              </span>
              <div className="space-y-1.5">
                {row.components.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => onSelectEntity(c)}
                    className="p-2 rounded border border-zinc-800/80 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 cursor-pointer flex items-center justify-between"
                  >
                    <span className="font-medium text-zinc-200">{c.name}</span>
                    <Badge variant="component" size="sm">Component</Badge>
                  </div>
                ))}
                {row.methods.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => onSelectEntity(m)}
                    className="p-2 rounded border border-zinc-800/80 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 cursor-pointer flex items-center justify-between"
                  >
                    <span className="font-mono text-emerald-400 truncate pr-2">{m.name}()</span>
                    <Badge variant="method" size="sm">Method</Badge>
                  </div>
                ))}
                {row.components.length === 0 && row.methods.length === 0 && (
                  <p className="text-xs text-zinc-500 italic p-2 border border-dashed border-zinc-800 rounded">
                    No code components or methods mapped.
                  </p>
                )}
              </div>
            </div>

            {/* Tests Summary */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase text-zinc-500 font-semibold">
                Verification Tests ({row.tests.length})
              </span>
              <div className="space-y-1.5">
                {row.tests.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onSelectEntity(t)}
                    className="p-2 rounded border border-zinc-800/80 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 cursor-pointer flex items-center justify-between"
                  >
                    <span className="font-mono text-zinc-200 truncate pr-2">{t.name}</span>
                    <Badge variant="success" size="sm">{t.lastRunStatus}</Badge>
                  </div>
                ))}
                {row.tests.length === 0 && (
                  <div className="p-2.5 rounded border border-rose-900/60 bg-rose-950/20 text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>0 tests mapped. Verification gap detected.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Documentation Summary */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase text-zinc-500 font-semibold">
                Documentation ({row.documents.length})
              </span>
              <div className="space-y-1.5">
                {row.documents.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => onSelectEntity(d)}
                    className="p-2 rounded border border-zinc-800/80 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 cursor-pointer flex items-center justify-between"
                  >
                    <span className="text-zinc-200 truncate pr-2">{d.name}</span>
                    <Badge variant="documentation" size="sm">{d.docType}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 2. If looking at an Artifact Drill-Down (Bidirectional Linkages) */}
        {!isRequirement && (
          <div className="space-y-4">
            {/* Bidirectional: Implements which Requirement */}
            <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/40 space-y-2">
              <span className="text-[10px] font-mono uppercase text-cyan-400 font-semibold block">
                Traces To Requirement
              </span>
              <div
                onClick={onResetToRequirement}
                className="p-2 rounded border border-zinc-800 hover:border-zinc-700 bg-zinc-900 cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Badge variant="requirement" size="sm">{req.reqCode}</Badge>
                  <span className="font-medium text-zinc-200 truncate">{req.name}</span>
                </div>
              </div>
            </div>

            {/* AST Details if Method */}
            {methodEntity && (
              <div className="space-y-2 font-mono">
                <span className="text-[10px] text-zinc-500 uppercase">Method Signature</span>
                <pre className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-emerald-300 text-[11px] overflow-x-auto">
                  {methodEntity.signature}
                </pre>
                <div className="pt-2 text-zinc-400">
                  <span className="text-zinc-500">Return: </span>
                  <code>{methodEntity.returnType}</code>
                </div>
              </div>
            )}

            {/* Test Details if Test */}
            {testEntity && (
              <div className="space-y-2 font-mono">
                <div className="p-2.5 rounded border border-zinc-800 bg-zinc-900/40">
                  <span className="text-[10px] text-zinc-500 uppercase block">Framework</span>
                  <span className="text-zinc-200">{testEntity.framework} • {testEntity.testType}</span>
                </div>
                <div className="p-2.5 rounded border border-zinc-800 bg-zinc-900/40">
                  <span className="text-[10px] text-zinc-500 uppercase block">Duration</span>
                  <span className="text-zinc-200">{testEntity.durationMs}ms</span>
                </div>
              </div>
            )}

            {/* Class Details if Class */}
            {classEntity && (
              <div className="space-y-2 font-mono">
                <div className="p-2.5 rounded border border-zinc-800 bg-zinc-900/40">
                  <span className="text-[10px] text-zinc-500 uppercase block">Methods Count</span>
                  <span className="text-zinc-200">{classEntity.methodsCount} methods parsed</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
