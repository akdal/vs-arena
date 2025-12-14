/**
 * Dagre Layout Utility for Auto-positioning Nodes
 */

import dagre from "@dagrejs/dagre";
import type { Node, Edge } from "@xyflow/react";

interface LayoutOptions {
  direction?: "TB" | "LR"; // Top-to-Bottom or Left-to-Right
  nodeWidth?: number;
  nodeHeight?: number;
  rankSep?: number;
  nodeSep?: number;
}

export function getLayoutedElements<N extends Node, E extends Edge>(
  nodes: N[],
  edges: E[],
  options: LayoutOptions = {}
): { nodes: N[]; edges: E[] } {
  const {
    direction = "TB",
    nodeWidth = 320,
    nodeHeight = 150,
    rankSep = 80,
    nodeSep = 50,
  } = options;

  const isHorizontal = direction === "LR";

  // Create a new graph instance for each layout calculation
  const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: rankSep,
    nodesep: nodeSep,
  });

  // Add nodes
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  // Add edges
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Apply positions
  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? ("left" as const) : ("top" as const),
      sourcePosition: isHorizontal ? ("right" as const) : ("bottom" as const),
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    } as N;
  });

  return { nodes: newNodes, edges };
}
