import dagre from "@dagrejs/dagre";
import { Node, Edge, Position } from "@xyflow/react";
import type { GraphNodeData } from "@/types/graph";
import type { EntityType } from "@/types/entities";

export const NODE_WIDTH = 270;
export const NODE_HEIGHT = 115;

export type LayoutMode = "TB" | "LR" | "TIERED";

export interface LayoutOptions {
  direction?: LayoutMode;
  nodeWidth?: number;
  nodeHeight?: number;
}

const TIER_ORDER: Record<EntityType, number> = {
  requirement: 0,
  architecture: 1,
  component: 2,
  module: 3,
  class: 4,
  method: 5,
  test: 6,
  documentation: 7,
};

export function getLayoutedElements<T extends Record<string, unknown>>(
  nodes: Node<T>[],
  edges: Edge[],
  options: LayoutOptions = {}
): { nodes: Node<T>[]; edges: Edge[] } {
  const { direction = "TB", nodeWidth = NODE_WIDTH, nodeHeight = NODE_HEIGHT } = options;

  if (nodes.length === 0) {
    return { nodes: [], edges };
  }

  // -------------------------------------------------------------
  // Mode 1: 8-Tier Architecture Layout (Balanced Hierarchical Bands)
  // -------------------------------------------------------------
  if (direction === "TIERED") {
    // Group nodes by their tier
    const tiers: Map<number, Node<T>[]> = new Map();
    nodes.forEach((node) => {
      const nodeData = node.data as unknown as GraphNodeData | undefined;
      const tierRank = nodeData?.type ? (TIER_ORDER[nodeData.type] ?? 3) : 3;
      if (!tiers.has(tierRank)) tiers.set(tierRank, []);
      tiers.get(tierRank)!.push(node);
    });

    const sortedTierRanks = Array.from(tiers.keys()).sort((a, b) => a - b);
    const colSpacing = 36;
    const rowSpacing = 32;
    const tierSpacing = 80;
    const maxCols = 3; // Max 3 cards per row in each tier to maintain readable 16:9 bounds

    let currentY = 40;
    const layoutedNodes: Node<T>[] = [];

    // Calculate maximum width across all tiers to center tiers
    let maxTierWidth = 0;
    sortedTierRanks.forEach((rank) => {
      const tierNodes = tiers.get(rank)!;
      const cols = Math.min(tierNodes.length, maxCols);
      const width = cols * nodeWidth + (cols - 1) * colSpacing;
      if (width > maxTierWidth) maxTierWidth = width;
    });

    sortedTierRanks.forEach((rank) => {
      const tierNodes = tiers.get(rank)!;
      const count = tierNodes.length;
      const rows = Math.ceil(count / maxCols);

      for (let r = 0; r < rows; r++) {
        const rowNodes = tierNodes.slice(r * maxCols, (r + 1) * maxCols);
        const colsInThisRow = rowNodes.length;
        const rowWidth = colsInThisRow * nodeWidth + (colsInThisRow - 1) * colSpacing;
        const startX = (maxTierWidth - rowWidth) / 2 + 40;

        rowNodes.forEach((node, colIndex) => {
          layoutedNodes.push({
            ...node,
            targetPosition: Position.Top,
            sourcePosition: Position.Bottom,
            position: {
              x: startX + colIndex * (nodeWidth + colSpacing),
              y: currentY + r * (nodeHeight + rowSpacing),
            },
          });
        });
      }

      currentY += rows * (nodeHeight + rowSpacing) + tierSpacing;
    });

    return { nodes: layoutedNodes, edges };
  }

  // -------------------------------------------------------------
  // Mode 2 & 3: Dagre Layout (TB or LR)
  // -------------------------------------------------------------
  const isHorizontal = direction === "LR";
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: isHorizontal ? "LR" : "TB",
    nodesep: isHorizontal ? 48 : 52,
    ranksep: isHorizontal ? 96 : 84,
    marginx: 48,
    marginy: 48,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);

    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
