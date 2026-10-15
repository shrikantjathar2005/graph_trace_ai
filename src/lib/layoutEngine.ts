import dagre from "@dagrejs/dagre";
import { Node, Edge, Position } from "@xyflow/react";

const NODE_WIDTH = 260;
const NODE_HEIGHT = 100;

export interface LayoutOptions {
  direction?: "TB" | "LR";
  nodeWidth?: number;
  nodeHeight?: number;
}

export function getLayoutedElements<T extends Record<string, unknown>>(
  nodes: Node<T>[],
  edges: Edge[],
  options: LayoutOptions = {}
): { nodes: Node<T>[]; edges: Edge[] } {
  const { direction = "TB", nodeWidth = NODE_WIDTH, nodeHeight = NODE_HEIGHT } = options;
  const isHorizontal = direction === "LR";

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: isHorizontal ? 40 : 50,
    ranksep: isHorizontal ? 80 : 70,
    marginx: 30,
    marginy: 30,
  });

  // Assign dimensions to dagre nodes
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  // Assign edges
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Compute graph layout
  dagre.layout(dagreGraph);

  // Position nodes and assign handle positions
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);

    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      // Pass coordinates (centered in dagre)
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
