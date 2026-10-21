"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  X,
  FileText,
  Boxes,
  Layers,
  FileCode2,
  Binary,
  Code2,
  CheckCircle2,
  FileCheck2,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  FileCode,
  ShieldCheck,
  Crosshair,
  Copy,
  Check,
  Zap,
  Flame,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { GraphNodeData, KnowledgeGraphData } from "@/types/graph";
import {
  EntityType,
  MethodEntity,
  ClassEntity,
  RequirementEntity,
  ModuleEntity,
} from "@/types/entities";
import { computeRelationshipAwareImpact } from "@/lib/impactEngine";

interface NodeInspectorProps {
  node: GraphNodeData | null;
  graph: KnowledgeGraphData;
  onClose: () => void;
  onSelectNode: (nodeId: string) => void;
  onHighlightEdge?: (edgeId: string | null) => void;
  isFocusNeighborhoodActive?: boolean;
  onToggleFocusNeighborhood?: () => void;
}

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

export function NodeInspector({
  node,
  graph,
  onClose,
  onSelectNode,
  onHighlightEdge,
  isFocusNeighborhoodActive,
  onToggleFocusNeighborhood,
}: NodeInspectorProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "relations" | "evidence" | "impact">("overview");
  const [copied, setCopied] = useState(false);

  // Compute blast radius / impact analysis for selected entity
  const impactResult = useMemo(() => {
    if (!node) return null;
    return computeRelationshipAwareImpact(graph, node.id);
  }, [node, graph]);

  if (!node) return null;

  const Icon = entityIcons[node.type] || FileCode2;

  // Filter incoming and outgoing connections
  const incomingEdges = graph.edges.filter((e) => e.target === node.id);
  const outgoingEdges = graph.edges.filter((e) => e.source === node.id);

  const incomingNodes = incomingEdges.map((e) => ({
    edge: e,
    sourceNode: graph.nodes.find((n) => n.id === e.source),
  }));

  const outgoingNodes = outgoingEdges.map((e) => ({
    edge: e,
    targetNode: graph.nodes.find((n) => n.id === e.target),
  }));

  // Group relationships by relationship type
  const incomingByType = new Map<string, typeof incomingNodes>();
  incomingNodes.forEach((item) => {
    const rel = item.edge.relationship;
    if (!incomingByType.has(rel)) incomingByType.set(rel, []);
    incomingByType.get(rel)!.push(item);
  });

  const outgoingByType = new Map<string, typeof outgoingNodes>();
  outgoingNodes.forEach((item) => {
    const rel = item.edge.relationship;
    if (!outgoingByType.has(rel)) outgoingByType.set(rel, []);
    outgoingByType.get(rel)!.push(item);
  });

  // Type-specific entity payload access
  const methodEntity = node.type === "method" ? (node.entity as MethodEntity) : null;
  const classEntity = node.type === "class" ? (node.entity as ClassEntity) : null;
  const reqEntity = node.type === "requirement" ? (node.entity as RequirementEntity) : null;
  const modEntity = node.type === "module" ? (node.entity as ModuleEntity) : null;

  const handleCopyId = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(node.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {
      // Gracefully ignore clipboard access errors
    }
  };

  const hasEvidence = Boolean(
    methodEntity?.signature ||
    classEntity?.name ||
    reqEntity?.acceptanceCriteria?.length ||
    node.filePath ||
    modEntity?.filePath
  );

  return (
    <div
      role="complementary"
      aria-label="Node Details"
      className="absolute top-0 right-0 h-full w-full sm:w-[380px] md:w-[420px] bg-[#141B27]/98 backdrop-blur-xl border-l border-[#2A3547] text-zinc-200 z-30 shadow-2xl flex flex-col transition-transform duration-200 ease-out"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#2A3547] bg-[#10151F]/90 shrink-0">
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <Badge variant={node.type} size="sm" dot>
            {node.type}
          </Badge>
          <span className="text-xs font-mono text-zinc-400 truncate">Node Inspector</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-[#192333] transition-colors cursor-pointer"
          aria-label="Close inspector panel"
          title="Close inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Node Identity Card */}
        <div className="p-3.5 bg-[#10151F] rounded-lg border border-[#2A3547]">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-md bg-[#192333] border border-[#2A3547] flex items-center justify-center text-[#25C4B4] shrink-0 mt-0.5">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-zinc-100 break-words leading-tight">
                  {node.label}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono text-zinc-400 bg-[#141B27] px-1.5 py-0.5 rounded border border-[#2A3547]">
                    {node.id}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="text-[10px] text-zinc-400 hover:text-zinc-200 flex items-center gap-0.5 cursor-pointer"
                    title="Copy Node ID"
                  >
                    {copied ? <Check className="w-3 h-3 text-[#25C4B4]" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick neighborhood focus button */}
            {onToggleFocusNeighborhood && (
              <Button
                size="xs"
                variant={isFocusNeighborhoodActive ? "primary" : "outline"}
                onClick={onToggleFocusNeighborhood}
                icon={<Crosshair className="w-3 h-3" />}
                title="Focus 1-hop connected neighborhood"
              >
                {isFocusNeighborhoodActive ? "Focused" : "Focus"}
              </Button>
            )}
          </div>

          {node.subtitle && (
            <p className="text-xs text-zinc-400 mt-2.5 pt-2 border-t border-[#2A3547]/60 font-mono text-[11px] truncate">
              {node.subtitle}
            </p>
          )}
        </div>

        {/* Cross-Perspective Actions */}
        <div className="grid grid-cols-3 gap-1.5">
          <Link
            href={`/traceability?entity=${encodeURIComponent(node.id)}`}
            className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-md border border-[#2A3547] bg-[#10151F] text-zinc-300 hover:text-zinc-100 hover:border-[#25C4B4]/50 hover:bg-[#192333] transition-all text-[10.5px] font-mono group"
            title="Trace requirement and test verification in Traceability Matrix"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-[#25C4B4] group-hover:scale-110 transition-transform" />
            <span>Trace</span>
          </Link>
          <Link
            href={`/impact?entity=${encodeURIComponent(node.id)}`}
            className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-md border border-[#2A3547] bg-[#10151F] text-zinc-300 hover:text-zinc-100 hover:border-rose-500/50 hover:bg-rose-950/20 transition-all text-[10.5px] font-mono group"
            title="Simulate upstream & downstream blast radius in Change Impact Simulator"
          >
            <Flame className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
            <span>Impact</span>
          </Link>
          <Link
            href={`/rules?entity=${encodeURIComponent(node.id)}`}
            className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-md border border-[#2A3547] bg-[#10151F] text-zinc-300 hover:text-zinc-100 hover:border-cyan-500/50 hover:bg-cyan-950/20 transition-all text-[10.5px] font-mono group"
            title="Evaluate layer constraints and drift in Architecture Rules"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>Rules</span>
          </Link>
        </div>

        {/* 4 Tabs Selector */}
        <div className="flex border-b border-[#2A3547] font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`flex-1 py-2 text-center border-b-2 font-medium transition-colors cursor-pointer ${
              activeTab === "overview"
                ? "border-[#25C4B4] text-[#25C4B4]"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("relations")}
            className={`flex-1 py-2 text-center border-b-2 font-medium transition-colors cursor-pointer ${
              activeTab === "relations"
                ? "border-[#25C4B4] text-[#25C4B4]"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Links ({incomingEdges.length + outgoingEdges.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("evidence")}
            className={`flex-1 py-2 text-center border-b-2 font-medium transition-colors cursor-pointer ${
              activeTab === "evidence"
                ? "border-[#25C4B4] text-[#25C4B4]"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Evidence
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("impact")}
            className={`flex-1 py-2 text-center border-b-2 font-medium transition-colors cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === "impact"
                ? "border-[#25C4B4] text-[#25C4B4]"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Zap className="w-3 h-3" /> Impact
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="space-y-3.5">
            {/* File location */}
            {node.filePath && (
              <div className="p-3 rounded-lg border border-[#2A3547] bg-[#10151F]/70">
                <span className="text-[10px] font-mono uppercase text-zinc-500 font-semibold block mb-1">
                  Source File Path
                </span>
                <div className="flex items-center gap-1.5 text-xs font-mono text-[#25C4B4] break-all">
                  <FileCode className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                  <span>{node.filePath}</span>
                </div>
              </div>
            )}

            {/* Risk Level */}
            {node.risk && (
              <div className="p-3 rounded-lg border border-[#2A3547] bg-[#10151F]/70 flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-zinc-500 font-semibold">
                  Risk Classification
                </span>
                <Badge
                  variant={
                    node.risk === "CRITICAL"
                      ? "danger"
                      : node.risk === "HIGH"
                      ? "warning"
                      : "outline"
                  }
                >
                  {node.risk}
                </Badge>
              </div>
            )}

            {/* Metrics Grid */}
            {node.metrics && Object.keys(node.metrics).length > 0 ? (
              <div>
                <span className="text-[10px] font-mono uppercase text-zinc-500 font-semibold block mb-2">
                  Entity Metrics
                </span>
                <div className="grid grid-cols-2 gap-2 font-mono">
                  {node.metrics.loc !== undefined && (
                    <div className="p-2.5 rounded-lg border border-[#2A3547] bg-[#10151F]/70 text-center">
                      <span className="text-[10px] text-zinc-500 block">Lines of Code</span>
                      <span className="text-sm font-bold text-zinc-100">{node.metrics.loc}</span>
                    </div>
                  )}
                  {node.metrics.methods !== undefined && (
                    <div className="p-2.5 rounded-lg border border-[#2A3547] bg-[#10151F]/70 text-center">
                      <span className="text-[10px] text-zinc-500 block">Methods</span>
                      <span className="text-sm font-bold text-zinc-100">{node.metrics.methods}</span>
                    </div>
                  )}
                  {node.metrics.testsCount !== undefined && (
                    <div className="p-2.5 rounded-lg border border-[#2A3547] bg-[#10151F]/70 text-center">
                      <span className="text-[10px] text-zinc-500 block" title="Discovered test artifacts linked via graph edges (not executed)">Mapped Tests (Static)</span>
                      <span className="text-sm font-bold text-zinc-100">{node.metrics.testsCount}</span>
                    </div>
                  )}
                  {node.metrics.complexity !== undefined && (
                    <div className="p-2.5 rounded-lg border border-[#2A3547] bg-[#10151F]/70 text-center">
                      <span className="text-[10px] text-zinc-500 block">Complexity</span>
                      <span className="text-sm font-bold text-zinc-100">{node.metrics.complexity}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-[#2A3547]/50 bg-[#10151F]/40 text-center text-xs text-zinc-500 italic">
                No code complexity metrics recorded for this entity.
              </div>
            )}

            {/* Acceptance Criteria (for Requirements) */}
            {reqEntity?.acceptanceCriteria && reqEntity.acceptanceCriteria.length > 0 && (
              <div className="p-3.5 rounded-lg border border-amber-900/40 bg-amber-950/20 space-y-2">
                <span className="text-[10.5px] font-mono uppercase text-amber-400 font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Acceptance Criteria
                </span>
                <ul className="space-y-1.5 text-xs text-zinc-300">
                  {reqEntity.acceptanceCriteria.map((crit, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-500 text-[10px] mt-0.5">•</span>
                      <span>{crit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Relationships (Grouped by Relationship Type) */}
        {activeTab === "relations" && (
          <div className="space-y-4">
            {/* Incoming Connections Grouped */}
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 uppercase font-semibold mb-2">
                <ArrowLeft className="w-3 h-3 text-[#25C4B4]" />
                <span>Incoming Links ({incomingEdges.length})</span>
              </div>
              {incomingByType.size > 0 ? (
                <div className="space-y-3">
                  {Array.from(incomingByType.entries()).map(([relType, items]) => (
                    <div key={relType} className="space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold px-1">
                        {relType} ({items.length})
                      </span>
                      {items.map(({ edge, sourceNode }) => (
                        <div
                          key={edge.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => sourceNode && onSelectNode(sourceNode.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              if (sourceNode) onSelectNode(sourceNode.id);
                            }
                          }}
                          onMouseEnter={() => onHighlightEdge?.(edge.id)}
                          onMouseLeave={() => onHighlightEdge?.(null)}
                          className="p-2.5 rounded-lg border border-[#2A3547] bg-[#10151F]/70 hover:border-[#25C4B4]/60 hover:bg-[#192333] focus-visible:ring-2 focus-visible:ring-[#25C4B4] focus:outline-none cursor-pointer transition-all flex items-center justify-between group"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              {sourceNode && (
                                <Badge variant={sourceNode.type} size="sm">
                                  {sourceNode.type}
                                </Badge>
                              )}
                              <span className="text-[9.5px] font-mono text-zinc-500">
                                {edge.confidence !== undefined
                                  ? edge.confidence === 1
                                    ? "Explicit (100%)"
                                    : `Heuristic (${Math.round(edge.confidence * 100)}%)`
                                  : "Heuristic Link"}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-zinc-200 truncate mt-1 group-hover:text-[#25C4B4] transition-colors">
                              {sourceNode?.label || edge.source}
                            </p>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-[#25C4B4] group-hover:translate-x-0.5 transition-all shrink-0" />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic p-2.5 rounded bg-[#10151F]/40 border border-[#2A3547]/40">
                  No incoming links (Root or Entry-point entity)
                </p>
              )}
            </div>

            {/* Outgoing Connections Grouped */}
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 uppercase font-semibold mb-2">
                <ArrowRight className="w-3 h-3 text-purple-400" />
                <span>Outgoing Links ({outgoingEdges.length})</span>
              </div>
              {outgoingByType.size > 0 ? (
                <div className="space-y-3">
                  {Array.from(outgoingByType.entries()).map(([relType, items]) => (
                    <div key={relType} className="space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold px-1">
                        {relType} ({items.length})
                      </span>
                      {items.map(({ edge, targetNode }) => (
                        <div
                          key={edge.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => targetNode && onSelectNode(targetNode.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              if (targetNode) onSelectNode(targetNode.id);
                            }
                          }}
                          onMouseEnter={() => onHighlightEdge?.(edge.id)}
                          onMouseLeave={() => onHighlightEdge?.(null)}
                          className="p-2.5 rounded-lg border border-[#2A3547] bg-[#10151F]/70 hover:border-purple-500/60 hover:bg-[#192333] focus-visible:ring-2 focus-visible:ring-purple-400 focus:outline-none cursor-pointer transition-all flex items-center justify-between group"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              {targetNode && (
                                <Badge variant={targetNode.type} size="sm">
                                  {targetNode.type}
                                </Badge>
                              )}
                              <span className="text-[9.5px] font-mono text-zinc-500">
                                {edge.confidence !== undefined
                                  ? edge.confidence === 1
                                    ? "Explicit (100%)"
                                    : `Heuristic (${Math.round(edge.confidence * 100)}%)`
                                  : "Heuristic Link"}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-zinc-200 truncate mt-1 group-hover:text-purple-300 transition-colors">
                              {targetNode?.label || edge.target}
                            </p>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic p-2.5 rounded bg-[#10151F]/40 border border-[#2A3547]/40">
                  No outgoing links (Leaf node entity)
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Code / Evidence */}
        {activeTab === "evidence" && (
          <div className="space-y-3 font-mono text-xs">
            <div className="p-2 rounded border border-[#2A3547]/60 bg-[#10151F]/60 text-[10.5px] text-zinc-400 font-sans leading-relaxed">
              Source metadata extracted via client-side heuristic pattern analysis. Does not perform compiler AST bytecode verification.
            </div>
            {methodEntity && (
              <div className="space-y-2.5">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Method Signature</span>
                  <pre className="mt-1 p-2.5 rounded bg-[#10151F] border border-[#2A3547] text-emerald-300 overflow-x-auto text-[11px]">
                    {methodEntity.signature}
                  </pre>
                </div>

                {methodEntity.returnType && (
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">Return Type</span>
                    <p className="text-zinc-200 bg-[#10151F] p-2 rounded border border-[#2A3547] mt-1 text-[11px]">
                      {methodEntity.returnType}
                    </p>
                  </div>
                )}

                {methodEntity.parameters && methodEntity.parameters.length > 0 && (
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">Parameters</span>
                    <div className="mt-1 space-y-1">
                      {methodEntity.parameters.map((param, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded bg-[#10151F] border border-[#2A3547] flex justify-between text-[11px]"
                        >
                          <span className="text-zinc-200">{param.name}</span>
                          <span className="text-cyan-400">{param.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {classEntity && (
              <div className="space-y-2">
                <span className="text-[10px] text-zinc-500 uppercase font-semibold">Class Definition</span>
                <pre className="p-2.5 rounded bg-[#10151F] border border-[#2A3547] text-blue-300 text-[11px]">
                  {`class ${classEntity.name} {\n  // Methods: ${classEntity.methodsCount || 0}\n}`}
                </pre>
              </div>
            )}

            {reqEntity?.sourceDocument && (
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-semibold">Specification Source</span>
                <p className="text-amber-300 bg-[#10151F] p-2 rounded border border-[#2A3547] mt-1 text-[11px]">
                  {reqEntity.sourceDocument}
                </p>
              </div>
            )}

            {!hasEvidence && (
              <div className="p-4 rounded-lg border border-[#2A3547]/50 bg-[#10151F]/40 text-center text-zinc-500 text-xs">
                No extracted source excerpt or specification document associated with this entity.
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Impact Analysis */}
        {activeTab === "impact" && impactResult && (
          <div className="space-y-3.5">
            <Link
              href={`/impact?entity=${encodeURIComponent(node.id)}`}
              className="flex items-center justify-between p-2 rounded-lg border border-rose-900/40 bg-rose-950/20 text-rose-300 hover:bg-rose-950/40 hover:border-rose-700/60 transition-all text-[11px] font-mono group"
            >
              <div className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>Open Full Simulator Perspective</span>
              </div>
              <ArrowRight className="w-3 h-3 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            {/* Blast radius summary card */}
            <div className="p-3.5 rounded-lg border border-[#2A3547] bg-[#10151F] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Flame className={`w-4 h-4 ${
                    impactResult.overallRisk === "CRITICAL"
                      ? "text-rose-400"
                      : impactResult.overallRisk === "HIGH"
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`} />
                  <span className="text-xs font-semibold text-zinc-200">Heuristic Blast Radius Assessment</span>
                </div>
                <Badge
                  variant={
                    impactResult.overallRisk === "CRITICAL"
                      ? "danger"
                      : impactResult.overallRisk === "HIGH"
                      ? "warning"
                      : impactResult.overallRisk === "MEDIUM"
                      ? "default"
                      : "success"
                  }
                >
                  {impactResult.overallRisk} RISK
                </Badge>
              </div>
              <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                Heuristic topological estimate (20 pts / direct 1-hop + 10 pts / indirect 2-hop, capped at 100). Indicates structural blast radius, not execution failure probability.
              </p>

              {/* Risk Score Progress Bar */}
              <div>
                <div className="flex justify-between text-[11px] font-mono text-zinc-400 mb-1">
                  <span>Calculated Risk Score</span>
                  <span className="font-bold text-zinc-100">{impactResult.riskScore} / 100</span>
                </div>
                <div className="w-full bg-[#141B27] rounded-full h-2 overflow-hidden border border-[#2A3547]">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      impactResult.riskScore >= 80
                        ? "bg-rose-500"
                        : impactResult.riskScore >= 50
                        ? "bg-amber-500"
                        : impactResult.riskScore >= 20
                        ? "bg-cyan-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.max(5, impactResult.riskScore)}%` }}
                  />
                </div>
              </div>

              {/* Hop metrics */}
              <div className="grid grid-cols-3 gap-2 text-center font-mono text-[10px] pt-1 border-t border-[#2A3547]/60">
                <div className="p-1.5 rounded bg-[#141B27]">
                  <span className="text-zinc-500 block">Direct (1-hop)</span>
                  <span className="text-xs font-bold text-zinc-100">{impactResult.directAffectedCount}</span>
                </div>
                <div className="p-1.5 rounded bg-[#141B27]">
                  <span className="text-zinc-500 block">Indirect (2-hop)</span>
                  <span className="text-xs font-bold text-zinc-100">{impactResult.indirectAffectedCount}</span>
                </div>
                <div className="p-1.5 rounded bg-[#141B27]">
                  <span className="text-zinc-500 block" title="Discovered test files structurally linked in knowledge graph. Not executed.">Tests at Risk (Static)</span>
                  <span className="text-xs font-bold text-rose-400">{impactResult.affectededTestCount}</span>
                </div>
              </div>
            </div>

            {/* Suggested test suites */}
            {impactResult.suggestedTestSuites.length > 0 && (
              <div className="p-3 rounded-lg border border-rose-900/40 bg-rose-950/20 space-y-1.5">
                <span className="text-[10.5px] font-mono uppercase text-rose-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Recommended Verification Suites (Static Mapping)
                </span>
                <p className="text-[10px] text-rose-300/80 font-sans">Discovered test artifacts structurally linked to impacted entities. These tests have not been executed.</p>
                <ul className="space-y-1 text-xs text-zinc-300 font-mono text-[11px]">
                  {impactResult.suggestedTestSuites.map((ts, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                      <span className="truncate">{ts}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Affected Downstream Items */}
            <div>
              <span className="text-[10px] font-mono uppercase text-zinc-500 font-semibold block mb-1.5">
                Downstream Impacted Entities ({impactResult.affectedItems.length})
              </span>
              {impactResult.affectedItems.length > 0 ? (
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                  {impactResult.affectedItems.map((item) => (
                    <div
                      key={item.entityId}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelectNode(item.entityId)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelectNode(item.entityId);
                        }
                      }}
                      className="p-2.5 rounded-lg border border-[#2A3547] bg-[#10151F]/70 hover:border-[#25C4B4]/60 hover:bg-[#192333] focus-visible:ring-2 focus-visible:ring-[#25C4B4] focus:outline-none cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <Badge variant={item.entityType} size="sm">
                            {item.entityType}
                          </Badge>
                          <span className="text-[9.5px] font-mono text-zinc-500">
                            {item.hopDistance === 1 ? "1-hop direct" : "2-hop indirect"}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-zinc-200 truncate mt-1 group-hover:text-[#25C4B4] transition-colors">
                          {item.entityName}
                        </p>
                        <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                          {item.impactReason}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-[#25C4B4] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-[#2A3547]/50 bg-[#10151F]/40 text-center text-xs text-zinc-500 italic">
                  Isolated leaf entity — zero downstream nodes impacted.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
