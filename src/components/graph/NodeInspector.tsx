"use client";

import React, { useState } from "react";
import {
  FileCode2,
  GitCommit,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Code2,
  ShieldCheck,
  Layers,
} from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { GraphNodeData, GraphEdgeData } from "@/types/graph";
import { MethodEntity, ClassEntity, RequirementEntity, TestEntity } from "@/types/entities";

interface NodeInspectorProps {
  node: GraphNodeData | null;
  edges: GraphEdgeData[];
  allNodes: GraphNodeData[];
  onClose: () => void;
  onSelectNode: (nodeId: string) => void;
}

export function NodeInspector({
  node,
  edges,
  allNodes,
  onClose,
  onSelectNode,
}: NodeInspectorProps) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!node) return null;

  // Find incoming and outgoing edges
  const incomingEdges = edges.filter((e) => e.target === node.id);
  const outgoingEdges = edges.filter((e) => e.source === node.id);

  const incomingNodes = incomingEdges.map((edge) => ({
    edge,
    sourceNode: allNodes.find((n) => n.id === edge.source),
  }));

  const outgoingNodes = outgoingEdges.map((edge) => ({
    edge,
    targetNode: allNodes.find((n) => n.id === edge.target),
  }));

  const tabs = [
    { id: "overview", label: "Overview" },
    {
      id: "relations",
      label: "Relations",
      count: incomingEdges.length + outgoingEdges.length,
    },
    { id: "ast", label: "AST / Code" },
    { id: "json", label: "Raw JSON" },
  ];

  const methodEntity = node.type === "method" ? (node.entity as MethodEntity) : null;
  const classEntity = node.type === "class" ? (node.entity as ClassEntity) : null;
  const reqEntity = node.type === "requirement" ? (node.entity as RequirementEntity) : null;

  return (
    <Drawer
      isOpen={!!node}
      onClose={onClose}
      title={node.label}
      subtitle={`${node.type.toUpperCase()} • ${node.id}`}
      widthClass="w-96 md:w-[520px]"
    >
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" && (
        <div className="space-y-4 pt-2">
          {/* Entity Identification Card */}
          <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <Badge variant={node.type} size="sm" dot>
                {node.type}
              </Badge>
              {node.risk && (
                <Badge variant={node.risk === "CRITICAL" ? "danger" : "warning"} size="sm">
                  RISK: {node.risk}
                </Badge>
              )}
            </div>

            <p className="text-xs text-zinc-300 font-sans leading-relaxed">
              {node.entity.description || node.subtitle || "No description provided."}
            </p>

            {node.filePath && (
              <div className="pt-2 border-t border-zinc-800/80">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">File Location</span>
                <p className="text-xs font-mono text-cyan-300 truncate mt-0.5">
                  {node.filePath}
                </p>
              </div>
            )}
          </div>

          {/* Quick Metrics */}
          {node.metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {node.metrics.loc && (
                <div className="p-2.5 rounded border border-zinc-800 bg-zinc-900/40 text-center font-mono">
                  <span className="text-[10px] text-zinc-500 block">Lines of Code</span>
                  <span className="text-sm font-bold text-zinc-100">{node.metrics.loc}</span>
                </div>
              )}
              {node.metrics.methods && (
                <div className="p-2.5 rounded border border-zinc-800 bg-zinc-900/40 text-center font-mono">
                  <span className="text-[10px] text-zinc-500 block">Methods</span>
                  <span className="text-sm font-bold text-zinc-100">{node.metrics.methods}</span>
                </div>
              )}
              {node.metrics.complexity && (
                <div className="p-2.5 rounded border border-zinc-800 bg-zinc-900/40 text-center font-mono">
                  <span className="text-[10px] text-zinc-500 block">Complexity</span>
                  <span className="text-sm font-bold text-zinc-100">{node.metrics.complexity}</span>
                </div>
              )}
            </div>
          )}

          {/* Acceptance Criteria (for Requirements) */}
          {reqEntity?.acceptanceCriteria && (
            <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/40 space-y-2">
              <span className="text-[10px] font-mono uppercase text-amber-400 font-semibold flex items-center gap-1.5">
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

      {activeTab === "relations" && (
        <div className="space-y-4 pt-2">
          {/* Incoming Connections */}
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 uppercase font-semibold mb-2">
              <ArrowLeft className="w-3 h-3 text-cyan-400" />
              <span>Incoming Links ({incomingNodes.length})</span>
            </div>
            {incomingNodes.length > 0 ? (
              <div className="space-y-1.5">
                {incomingNodes.map(({ edge, sourceNode }) => (
                  <div
                    key={edge.id}
                    onClick={() => sourceNode && onSelectNode(sourceNode.id)}
                    className="p-2.5 rounded border border-zinc-800/80 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900 cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono px-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {edge.relationship}
                        </span>
                        {sourceNode && (
                          <Badge variant={sourceNode.type} size="sm">
                            {sourceNode.type}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs font-medium text-zinc-200 truncate mt-1">
                        {sourceNode?.label || edge.source}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic">No incoming links (Root or Entry point)</p>
            )}
          </div>

          {/* Outgoing Connections */}
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 uppercase font-semibold mb-2">
              <ArrowRight className="w-3 h-3 text-purple-400" />
              <span>Outgoing Links ({outgoingNodes.length})</span>
            </div>
            {outgoingNodes.length > 0 ? (
              <div className="space-y-1.5">
                {outgoingNodes.map(({ edge, targetNode }) => (
                  <div
                    key={edge.id}
                    onClick={() => targetNode && onSelectNode(targetNode.id)}
                    className="p-2.5 rounded border border-zinc-800/80 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900 cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono px-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {edge.relationship}
                        </span>
                        {targetNode && (
                          <Badge variant={targetNode.type} size="sm">
                            {targetNode.type}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs font-medium text-zinc-200 truncate mt-1">
                        {targetNode?.label || edge.target}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic">No outgoing links (Leaf node)</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "ast" && (
        <div className="space-y-3 pt-2 font-mono text-xs">
          {methodEntity && (
            <div className="space-y-2">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase">Method Signature</span>
                <pre className="mt-1 p-2.5 rounded bg-zinc-900 border border-zinc-800 text-emerald-300 overflow-x-auto">
                  {methodEntity.signature}
                </pre>
              </div>

              <div>
                <span className="text-[10px] text-zinc-500 uppercase">Return Type</span>
                <p className="text-zinc-200 bg-zinc-900 p-2 rounded border border-zinc-800 mt-1">
                  {methodEntity.returnType}
                </p>
              </div>

              {methodEntity.parameters && methodEntity.parameters.length > 0 && (
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase">Parameters</span>
                  <div className="mt-1 space-y-1">
                    {methodEntity.parameters.map((param, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded bg-zinc-900 border border-zinc-800 flex justify-between"
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
              <div>
                <span className="text-[10px] text-zinc-500 uppercase">Class Declaration</span>
                <pre className="mt-1 p-2.5 rounded bg-zinc-900 border border-zinc-800 text-blue-300">
                  {`class ${classEntity.name} {\n  // ${classEntity.methodsCount} parsed methods\n  // Lines ${classEntity.startLine} to ${classEntity.endLine}\n}`}
                </pre>
              </div>
            </div>
          )}

          {!methodEntity && !classEntity && (
            <div className="p-4 rounded border border-zinc-800 bg-zinc-900/40 text-center text-zinc-500">
              No AST syntax tree available for this non-code entity.
            </div>
          )}
        </div>
      )}

      {activeTab === "json" && (
        <div className="pt-2">
          <pre className="p-3 bg-zinc-900/80 border border-zinc-800 rounded font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-[500px]">
            {JSON.stringify(node, null, 2)}
          </pre>
        </div>
      )}
    </Drawer>
  );
}
