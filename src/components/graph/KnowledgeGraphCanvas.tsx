"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  Node,
  Edge,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useSearchParams } from "next/navigation";
import { CustomEntityNode } from "./CustomEntityNode";
import { RelationshipEdge } from "./RelationshipEdge";
import { GraphToolbar } from "./GraphToolbar";
import { NodeInspector } from "./NodeInspector";
import { getLayoutedElements, LayoutMode } from "@/lib/layoutEngine";
import { countDependencyEdges } from "@/lib/dependencyEngine";
import { KnowledgeGraphData, GraphNodeData } from "@/types/graph";
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
  requirement: "#F59E0B",
  architecture: "#A855F7",
  component: "#06B6D4",
  module: "#6366F1",
  class: "#3B82F6",
  method: "#10B981",
  test: "#F43F5E",
  documentation: "#25C4B4",
};

interface KnowledgeGraphCanvasProps {
  initialData: KnowledgeGraphData;
  projectId?: string;
}

function InnerGraphCanvas({ initialData }: KnowledgeGraphCanvasProps) {
  const { fitView, setCenter } = useReactFlow();

  const searchParams = useSearchParams();
  const entityParam = searchParams.get("entity");
  const viewParam = searchParams.get("view");
  const isDependenciesView = viewParam === "dependencies";
  const dependencyTiers: EntityType[] = ["architecture", "component", "module", "class", "method", "test"];

  const [activeFilters, setActiveFilters] = useState<Set<EntityType>>(() =>
    isDependenciesView ? new Set(dependencyTiers) : new Set(allEntityTypes)
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("TIERED");

  const initialSelected = useMemo(() => {
    if (!entityParam || initialData.nodes.length === 0) return null;
    return (
      initialData.nodes.find(
        (n) => n.id.toLowerCase() === entityParam.toLowerCase()
      ) || null
    );
  }, [entityParam, initialData.nodes]);

  const [selectedNodeData, setSelectedNodeData] = useState<GraphNodeData | null>(initialSelected);
  const [isFocusNeighborhoodActive, setIsFocusNeighborhoodActive] = useState(false);
  const [highlightedEdgeId, setHighlightedEdgeId] = useState<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Computed Category Counts
  const filterCounts = useMemo(() => {
    const counts: Record<EntityType, number> = {
      requirement: 0,
      architecture: 0,
      component: 0,
      module: 0,
      class: 0,
      method: 0,
      test: 0,
      documentation: 0,
    };
    initialData.nodes.forEach((n) => {
      if (counts[n.type] !== undefined) counts[n.type]++;
    });
    return counts;
  }, [initialData.nodes]);

  const requirementCount = filterCounts.requirement;
  const testCount = filterCounts.test;
  const dependencyEdgesCount = useMemo(() => {
    return countDependencyEdges(initialData.edges);
  }, [initialData.edges]);

  // Search match computation
  const matchingNodeIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const q = searchQuery.toLowerCase();
    const ids = new Set<string>();
    initialData.nodes.forEach((n) => {
      if (
        n.label.toLowerCase().includes(q) ||
        n.id.toLowerCase().includes(q) ||
        n.subtitle?.toLowerCase().includes(q) ||
        n.filePath?.toLowerCase().includes(q)
      ) {
        ids.add(n.id);
      }
    });
    return ids;
  }, [initialData.nodes, searchQuery]);

  // Compute 1-hop neighborhood for selected node
  const neighborhoodNodeIds = useMemo(() => {
    if (!selectedNodeData || !isFocusNeighborhoodActive) return null;
    const ids = new Set<string>([selectedNodeData.id]);
    initialData.edges.forEach((e) => {
      if (e.source === selectedNodeData.id) ids.add(e.target);
      if (e.target === selectedNodeData.id) ids.add(e.source);
    });
    return ids;
  }, [selectedNodeData, isFocusNeighborhoodActive, initialData.edges]);

  // -----------------------------------------------------------------
  // 1. Separate Layout Computation (Only runs on filter / layoutMode / data change)
  // -----------------------------------------------------------------
  const isFirstLayout = useRef(true);
  const layoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (layoutTimerRef.current) clearTimeout(layoutTimerRef.current);
    };
  }, []);

  const recomputeLayout = useCallback(
    (mode: LayoutMode, filters: Set<EntityType>) => {
      const filteredNodes = initialData.nodes.filter((n) => filters.has(n.type));
      const activeIds = new Set(filteredNodes.map((n) => n.id));

      const filteredEdges = initialData.edges.filter(
        (e) => activeIds.has(e.source) && activeIds.has(e.target)
      );

      const flowNodes: Node[] = filteredNodes.map((node) => ({
        id: node.id,
        type: "customEntity",
        position: { x: 0, y: 0 },
        data: {
          ...node,
          isDimmed: false,
          isNeighborhood: false,
          highlighted: false,
        } as unknown as Record<string, unknown>,
        selected: false,
      }));

      const flowEdges: Edge[] = filteredEdges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: "relationship",
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#4A5568",
          width: 14,
          height: 14,
        },
        data: {
          relationship: edge.relationship,
          confidence: edge.confidence,
          isDimmed: false,
          isHighlighted: false,
          onEdgeClick: (edgeId: string) => {
            setHighlightedEdgeId(edgeId);
            const targetEdge = initialData.edges.find((e) => e.id === edgeId);
            if (targetEdge) {
              const targetNode = initialData.nodes.find((n) => n.id === targetEdge.target);
              if (targetNode) setSelectedNodeData(targetNode);
            }
          },
        },
      }));

      const layouted = getLayoutedElements(flowNodes, flowEdges, { direction: mode });
      setNodes(layouted.nodes);
      setEdges(layouted.edges);

      // Fit view with smooth transition (cleaned up if invoked rapidly)
      if (layoutTimerRef.current) clearTimeout(layoutTimerRef.current);
      layoutTimerRef.current = setTimeout(() => {
        fitView({ padding: 0.2, minZoom: 0.5, maxZoom: 1.15, duration: isFirstLayout.current ? 400 : 300 });
        isFirstLayout.current = false;
      }, 60);
    },
    [initialData, fitView, setNodes, setEdges]
  );

  // Trigger layout computation only when layoutMode, filters, or initialData change
  useEffect(() => {
    recomputeLayout(layoutMode, activeFilters);
  }, [recomputeLayout, layoutMode, activeFilters]);

  // -----------------------------------------------------------------
  // 2. Selection, Focus Neighborhood, Search Styling (NO CAMERA RESET)
  // -----------------------------------------------------------------
  useEffect(() => {
    // Update node states in-place without touching position or camera
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        const isSelected = selectedNodeData?.id === node.id;
        const isSearchMatch = matchingNodeIds.has(node.id);
        const isDimmed = neighborhoodNodeIds ? !neighborhoodNodeIds.has(node.id) : false;
        const isNeighborhood = neighborhoodNodeIds ? neighborhoodNodeIds.has(node.id) : false;

        return {
          ...node,
          selected: isSelected,
          data: {
            ...(node.data as object),
            highlighted: isSearchMatch,
            isDimmed,
            isNeighborhood,
          },
        };
      })
    );

    // Update edge states in-place without touching position or camera
    setEdges((currentEdges) =>
      currentEdges.map((edge) => {
        const isConnectedToSelected = selectedNodeData
          ? edge.source === selectedNodeData.id || edge.target === selectedNodeData.id
          : false;

        const isDimmed = neighborhoodNodeIds ? !isConnectedToSelected : false;
        const isHighlighted = isConnectedToSelected || highlightedEdgeId === edge.id;

        return {
          ...edge,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isHighlighted ? "#25C4B4" : "#4A5568",
            width: 14,
            height: 14,
          },
          data: {
            ...(edge.data as object),
            isDimmed,
            isHighlighted,
          },
        };
      })
    );
  }, [selectedNodeData, neighborhoodNodeIds, matchingNodeIds, highlightedEdgeId, setNodes, setEdges]);

  // Sync viewParam and entityParam when searchParams change externally
  const prevViewRef = useRef(viewParam);
  useEffect(() => {
    if (viewParam !== prevViewRef.current) {
      prevViewRef.current = viewParam;
      const targetFilters = viewParam === "dependencies"
        ? new Set<EntityType>(["architecture", "component", "module", "class", "method", "test"])
        : new Set<EntityType>(allEntityTypes);
      queueMicrotask(() => setActiveFilters(targetFilters));
    }
  }, [viewParam]);

  const prevParamRef = useRef(entityParam);
  useEffect(() => {
    if (entityParam && entityParam !== prevParamRef.current) {
      prevParamRef.current = entityParam;
      const matched = initialData.nodes.find(
        (n) => n.id.toLowerCase() === entityParam.toLowerCase()
      );
      if (matched) {
        queueMicrotask(() => setSelectedNodeData(matched));
      }
    }
  }, [entityParam, initialData.nodes]);

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
  const handleClear = () => setActiveFilters(new Set(["requirement", "module"]));

  // Explicit Fit View (user-triggered)
  const handleFitView = () => {
    fitView({ padding: 0.2, minZoom: 0.5, maxZoom: 1.15, duration: 300 });
  };

  // Explicit Reset Layout (user-triggered)
  const handleRelayout = () => {
    recomputeLayout(layoutMode, activeFilters);
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

  // Navigate to node by ID (from inspector links or search result)
  const handleSelectNodeById = (nodeId: string) => {
    const target = initialData.nodes.find((n) => n.id === nodeId);
    if (target) {
      setSelectedNodeData(target);
      // Smoothly pan to target node position without resetting zoom
      const foundNode = nodes.find((n) => n.id === nodeId);
      if (foundNode) {
        setCenter(foundNode.position.x + 135, foundNode.position.y + 55, {
          duration: 400,
        });
      }
    }
  };

  const handleClearSelection = () => {
    setSelectedNodeData(null);
    setIsFocusNeighborhoodActive(false);
    setHighlightedEdgeId(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-172px)] w-full relative bg-[#10151F]">
      {/* Interactive Toolbar */}
      <GraphToolbar
        activeFilters={activeFilters}
        onToggleFilter={handleToggleFilter}
        onSelectAllFilters={handleSelectAll}
        onClearFilters={handleClear}
        filterCounts={filterCounts}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchMatchCount={matchingNodeIds.size}
        layoutMode={layoutMode}
        onChangeLayoutMode={setLayoutMode}
        isFocusNeighborhoodActive={isFocusNeighborhoodActive}
        onToggleFocusNeighborhood={() => setIsFocusNeighborhoodActive((prev) => !prev)}
        hasSelectedNode={Boolean(selectedNodeData)}
        selectedNodeLabel={selectedNodeData?.label}
        onClearSelection={handleClearSelection}
        onFitView={handleFitView}
        onRelayout={handleRelayout}
        nodeCount={nodes.length}
        totalNodes={initialData.nodes.length}
        edgeCount={edges.length}
        requirementCount={requirementCount}
        testCount={testCount}
        isDependenciesView={isDependenciesView}
        dependencyEdgesCount={dependencyEdgesCount}
      />

      {/* Main React Flow Canvas */}
      <div className="flex-1 w-full h-full relative bg-[#10151F] overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={handleClearSelection}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.2, minZoom: 0.5, maxZoom: 1.15 }}
          minZoom={0.3}
          maxZoom={1.8}
          proOptions={{ hideAttribution: true }}
          className="bg-[#10151F]"
        >
          {/* Dot Grid Background */}
          <Background
            variant={BackgroundVariant.Dots}
            gap={22}
            size={1.2}
            color="#2A3547"
          />

          {/* Controls */}
          <Controls
            showInteractive={false}
            className="!bg-[#141B27] !border !border-[#2A3547] !rounded-lg !shadow-xl !text-zinc-200"
          />

          {/* Minimap */}
          <MiniMap
            nodeColor={(n) => {
              const nodeData = n.data as unknown as GraphNodeData;
              return entityColorMap[nodeData?.type] || "#475569";
            }}
            nodeStrokeWidth={2}
            maskColor="rgba(16, 21, 31, 0.85)"
            className="!bg-[#141B27] !border !border-[#2A3547] !rounded-lg !shadow-2xl"
            zoomable
            pannable
          />
        </ReactFlow>

        {/* Selected-Node Details Drawer with 4 Tabs */}
        <NodeInspector
          node={selectedNodeData}
          graph={initialData}
          onClose={() => setSelectedNodeData(null)}
          onSelectNode={handleSelectNodeById}
          onHighlightEdge={setHighlightedEdgeId}
          isFocusNeighborhoodActive={isFocusNeighborhoodActive}
          onToggleFocusNeighborhood={() => setIsFocusNeighborhoodActive((prev) => !prev)}
        />
      </div>
    </div>
  );
}

export function KnowledgeGraphCanvas({ initialData, projectId }: KnowledgeGraphCanvasProps) {
  const stableKey = projectId ? `project-${projectId}` : `${initialData.nodes.length}-${initialData.edges.length}-${initialData.nodes[0]?.id || "empty"}`;

  return (
    <ReactFlowProvider>
      <InnerGraphCanvas key={stableKey} initialData={initialData} projectId={projectId} />
    </ReactFlowProvider>
  );
}
