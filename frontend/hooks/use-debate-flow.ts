"use client";

/**
 * Debate Flow Hook
 * Manages React Flow state for debate visualization
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useNodesState, useEdgesState } from "@xyflow/react";
import type { DebatePhase, RunDetail } from "@/lib/types";
import type {
  DebateFlowNode,
  DebateFlowEdge,
} from "@/components/flow/utils/flow-types";
import {
  createInitialNodes,
  createPhaseNode,
  createSequenceEdges,
} from "@/components/flow/utils/node-factory";
import { getLayoutedElements } from "@/components/flow/utils/layout";

interface UseDebateFlowOptions {
  run: RunDetail;
  onLayoutChange?: () => void;
}

export function useDebateFlow({ run, onLayoutChange }: UseDebateFlowOptions) {
  const [nodes, setNodes, onNodesChange] = useNodesState<DebateFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<DebateFlowEdge>([]);
  const [currentPhase, setCurrentPhase] = useState<DebatePhase | null>(null);
  const phasesRef = useRef<DebatePhase[]>([]);

  // Initialize with topic node
  useEffect(() => {
    const initialNodes = createInitialNodes(run);
    setNodes(initialNodes);
  }, [run, setNodes]);

  // Handle phase start - add new node
  const handlePhaseStart = useCallback(
    (phase: DebatePhase) => {
      const newNode = createPhaseNode(phase, run);
      newNode.data.isStreaming = true;

      phasesRef.current.push(phase);

      setNodes((nds) => {
        const updatedNodes = [...nds, newNode];
        const newEdges = createSequenceEdges(phasesRef.current);

        // Apply layout
        const { nodes: layoutedNodes, edges: layoutedEdges } =
          getLayoutedElements(updatedNodes, newEdges);

        setEdges(layoutedEdges);
        onLayoutChange?.();

        return layoutedNodes;
      });

      setCurrentPhase(phase);
    },
    [run, setNodes, setEdges, onLayoutChange]
  );

  // Handle token - update node content
  const handleToken = useCallback(
    (content: string) => {
      if (!currentPhase) return;

      setNodes((nds) =>
        nds.map((node) =>
          node.id === currentPhase
            ? {
                ...node,
                data: { ...node.data, content: node.data.content + content },
              }
            : node
        ) as DebateFlowNode[]
      );
    },
    [currentPhase, setNodes]
  );

  // Handle phase end - mark node complete
  const handlePhaseEnd = useCallback(
    (phase: DebatePhase) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === phase
            ? {
                ...node,
                data: { ...node.data, isStreaming: false, isComplete: true },
              }
            : node
        ) as DebateFlowNode[]
      );
      setCurrentPhase(null);
    },
    [setNodes]
  );

  // Handle score event
  const handleScore = useCallback(
    (scoreData: Record<string, unknown>) => {
      const phase = scoreData.phase as DebatePhase;
      if (phase) {
        setNodes((nds) =>
          nds.map((node) =>
            node.id === phase
              ? { ...node, data: { ...node.data, scores: scoreData } }
              : node
          ) as DebateFlowNode[]
        );
      }
    },
    [setNodes]
  );

  // Handle verdict event
  const handleVerdict = useCallback(
    (verdictData: Record<string, unknown>) => {
      const phase = "judge_verdict" as DebatePhase;
      const winner = verdictData.winner as "a" | "b" | "tie" | undefined;
      const analysis = verdictData.analysis as string | undefined;

      setNodes((nds) =>
        nds.map((node) =>
          node.id === phase
            ? { ...node, data: { ...node.data, winner, analysis } }
            : node
        ) as DebateFlowNode[]
      );
    },
    [setNodes]
  );

  return {
    nodes,
    edges,
    currentPhase,
    onNodesChange,
    onEdgesChange,
    handlePhaseStart,
    handleToken,
    handlePhaseEnd,
    handleScore,
    handleVerdict,
  };
}
