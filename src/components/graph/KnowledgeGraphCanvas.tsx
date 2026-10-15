"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  ReactFlowProvider,
  useReactFlow,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useSearchParams } from "next/navigation";

import { CustomEntityNode } from "./CustomEntityNode";
import { RelationshipEdge } from "./RelationshipEdge";
import { GraphToolbar } from "./GraphToolbar";
import { NodeInspector } from "./NodeInspector";
import { getLayoutedElements } from "@/lib/layoutEngine";
import { KnowledgeGraphData, GraphNodeData, GraphEdgeData } from "@/types/graph";
import { EntityType } from "@/types/entities";

const nodeTypes = {
  customEntity: CustomEntityNode,
};

const edgeTypes = {
  relationship: RelationshipEdge,
};

const allEntityTypes: EntityType[] = [
  "requirement",
  "architecture",
  "component",
  "module",
  "class",
  "method",
  "test",
  "documentation",
];

const entityColorMap: Record<EntityType, string> = {
  requirement: "#f59e0b",
  architecture: "#a855f7",
  component: "#06b6d4",
  module: "#6366f1",
  class: "#3b82f6",
  method: "#10b981",
  test: "#f43f5e",
  documentation: "#14b8a6",
};

interface KnowledgeGraphCanvasProps {
  initialData: KnowledgeGraphData;
}

function InnerGraphCanvas({ initialData }: KnowledgeGraphCanvasProps) {
  const { fitView } = useReactFlow();

  const [activeFilters, setActiveFilters] = useState<Set<EntityType>>(
    new Set(allEntityTypes)
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [layoutDirection, setLayoutDirection] = useState<"TB" | "LR">("TB");
  const [selectedNodeData, setSelectedNodeData] = useState<GraphNodeData | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Format and layout raw graph data
  const computeGraph = useCallback(
    (direction: "TB" | "LR", filters: Set<EntityType>, search: string) => {
      // 1. Filter nodes
      let rawNodes = initialData.nodes.filter((n) => filters.has(n.type));

      if (search.trim()) {
        const q = search.toLowerCase();
        rawNodes = rawNodes.map((n) => {
          const isMatch =
            n.label.toLowerCase().includes(q) ||
            n.id.toLowerCase().includes(q) ||
            n.subtitle?.toLowerCase().includes(q);
          return {
            ...n,
            highlighted: isMatch,
          };
        });
      }

      const activeIds = new Set(rawNodes.map((n) => n.id));

      // 2. Filter edges to only connect active nodes
      const rawEdges = initialData.edges.filter(
        (e) => activeIds.has(e.source) && activeIds.has(e.target)
      );

      // 3. Map to React Flow Nodes
      const flowNodes: Node[] = rawNodes.map((node) => ({
        id: node.id,
        type: "customEntity",
        position: { x: 0, y: 0 },
        data: node as unknown as Record<string, unknown>,
      }));

      // 4. Map to React Flow Edges
      const flowEdges: Edge[] = rawEdges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: "relationship",
        data: {
          relationship: edge.relationship,
          confidence: edge.confidence,
        },
      }));

      // 5. Compute hierarchical Dagre layout
      const layouted = getLayoutedElements(flowNodes, flowEdges, { direction });

      setNodes(layouted.nodes);
      setEdges(layouted.edges);

      // Smooth camera reset
      setTimeout(() => {
        fitView({ padding: 0.15, duration: 400 });
      }, 50);
    },
    [initialData, setNodes, setEdges, fitView]
  );

  const searchParams = useSearchParams();
  const entityParam = searchParams.get("entity");

  // Initial layout calculation
  useEffect(() => {
    computeGraph(layoutDirection, activeFilters, searchQuery);
  }, [computeGraph, layoutDirection, activeFilters, searchQuery]);

  // Focus requested entity from URL parameter if present
  useEffect(() => {
    if (entityParam && initialData.nodes.length > 0) {
      const matched = initialData.nodes.find(
        (n) => n.id.toLowerCase() === entityParam.toLowerCase()
      );
      if (matched) {
        setSelectedNodeData(matched);
        setNodes((nds) =>
          nds.map((node) => ({
            ...node,
            selected: node.id === matched.id,
            highlighted: node.id === matched.id,
          }))
        );
        setTimeout(() => {
          fitView({ nodes: [{ id: matched.id }], duration: 600, maxZoom: 1.2 });
        }, 200);
      }
    }
  }, [entityParam, initialData.nodes, setNodes, fitView]);

  // Toolbar handlers
  const handleToggleFilter = (type: EntityType) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        if (next.size > 1) next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const handleSelectAll = () => setActiveFilters(new Set(allEntityTypes));
  const handleClear = () => setActiveFilters(new Set(["requirement", "architecture"]));

  const handleToggleDirection = () => {
    setLayoutDirection((prev) => (prev === "TB" ? "LR" : "TB"));
  };

  const handleFitView = () => fitView({ padding: 0.15, duration: 300 });

  const handleRelayout = () => {
    computeGraph(layoutDirection, activeFilters, searchQuery);
  };

  // Node Click handler
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const matchedNodeData = initialData.nodes.find((n) => n.id === node.id);
      if (matchedNodeData) {
        setSelectedNodeData(matchedNodeData);
      }
    },
    [initialData.nodes]
  );

  // Focus node by ID (from inspector links)
  const handleSelectNodeById = (nodeId: string) => {
    const target = initialData.nodes.find((n) => n.id === nodeId);
    if (target) {
      setSelectedNodeData(target);
      // Highlight in canvas
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          selected: node.id === nodeId,
        }))
      );
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-125px)] w-full relative">
      {/* Interactive Toolbar */}
      <GraphToolbar
        activeFilters={activeFilters}
        onToggleFilter={handleToggleFilter}
        onSelectAllFilters={handleSelectAll}
        onClearFilters={handleClear}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        layoutDirection={layoutDirection}
        onToggleDirection={handleToggleDirection}
        onFitView={handleFitView}
        onRelayout={handleRelayout}
        nodeCount={nodes.length}
        edgeCount={edges.length}
      />

      {/* Main React Flow Canvas */}
      <div className="flex-1 w-full h-full relative bg-[#09090b]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          minZoom={0.2}
          maxZoom={1.8}
          proOptions={{ hideAttribution: true }}
          className="bg-[#09090b]"
        >
          {/* Subtle grid background */}
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#27272a"
          />

          {/* Dark theme Controls */}
          <Controls
            showInteractive={false}
            className="!bg-zinc-900 !border !border-zinc-800 !rounded-md !shadow-lg"
          />

          {/* Styled Minimap */}
          <MiniMap
            nodeColor={(n) => {
              const nodeData = n.data as unknown as GraphNodeData;
              return entityColorMap[nodeData?.type] || "#52525b";
            }}
            nodeStrokeWidth={2}
            maskColor="rgba(9, 9, 11, 0.85)"
            className="!bg-zinc-950 !border !border-zinc-800 !rounded-lg !shadow-xl"
            zoomable
            pannable
          />
        </ReactFlow>

        {/* Inspector Drawer */}
        <NodeInspector
          node={selectedNodeData}
          edges={initialData.edges}
          allNodes={initialData.nodes}
          onClose={() => setSelectedNodeData(null)}
          onSelectNode={handleSelectNodeById}
        />
      </div>
    </div>
  );
}

export function KnowledgeGraphCanvas({ initialData }: KnowledgeGraphCanvasProps) {
  return (
    <ReactFlowProvider>
      <InnerGraphCanvas initialData={initialData} />
    </ReactFlowProvider>
  );
}
