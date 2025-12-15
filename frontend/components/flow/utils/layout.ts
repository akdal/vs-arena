/**
 * Dagre Layout Utility for Auto-positioning Nodes
 * Includes both full layout and incremental layout for performance
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

/**
 * Get position for a new node incrementally (O(1) instead of O(n²) for dagre)
 * Assumes top-to-bottom layout where new nodes are added below existing ones
 */
export function getIncrementalNodePosition<N extends Node>(
  existingNodes: N[],
  options: Pick<LayoutOptions, "nodeHeight" | "nodeWidth" | "rankSep"> = {}
): { x: number; y: number } {
  const { nodeHeight = 150, nodeWidth = 320, rankSep = 80 } = options;

  if (existingNodes.length === 0) {
    // First node - center it horizontally
    return { x: 0, y: 0 };
  }

  // Find the last node (deepest in the flow)
  const lastNode = existingNodes[existingNodes.length - 1];

  return {
    x: lastNode.position.x, // Same x position (vertical stack)
    y: lastNode.position.y + nodeHeight + rankSep, // Below the last node
  };
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
