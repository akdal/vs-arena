"use client";

/**
 * Debate Replay Hook
 * Manages React Flow state for replaying completed debates from stored Turn data
 */

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useNodesState, useEdgesState } from "@xyflow/react";
import type { DebatePhase, RunDetail, Turn, ReplaySpeed } from "@/lib/types";
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
import { PHASE_ORDER, PHASE_LABELS } from "@/components/arena/constants";

// Base delay per character at 1x speed (in ms)
const BASE_CHAR_DELAY = 15;

interface PhaseData {
  phase: DebatePhase;
  content: string;
  metadata: Record<string, unknown>;
}

interface UseDebateReplayOptions {
  run: RunDetail;
  turns: Turn[];
  onLayoutChange?: () => void;
}

export interface UseDebateReplayReturn {
  // React Flow state
  nodes: DebateFlowNode[];
  edges: DebateFlowEdge[];
  onNodesChange: ReturnType<typeof useNodesState<DebateFlowNode>>[2];
  onEdgesChange: ReturnType<typeof useEdgesState<DebateFlowEdge>>[2];

  // Playback state
  isPlaying: boolean;
  speed: ReplaySpeed;
  currentPhase: DebatePhase | null;
  currentPhaseIndex: number;
  totalPhases: number;
  progress: number;
  isComplete: boolean;
  currentPhaseLabel: string;

  // Controls
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  setSpeed: (speed: ReplaySpeed) => void;
  goToPhase: (index: number) => void;
  nextPhase: () => void;
  previousPhase: () => void;
  reset: () => void;
}

export function useDebateReplay({
  run,
  turns,
  onLayoutChange,
}: UseDebateReplayOptions): UseDebateReplayReturn {
  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState<DebateFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<DebateFlowEdge>([]);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeedState] = useState<ReplaySpeed>(1);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(-1);
  const [charIndex, setCharIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Refs for animation
  const animationRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const phasesRef = useRef<DebatePhase[]>([]);

  // Parse turns into phase data
  const phaseData = useMemo((): PhaseData[] => {
    // Sort turns by PHASE_ORDER to ensure correct sequence
    const turnMap = new Map<string, Turn>();
    turns.forEach((turn) => {
      turnMap.set(turn.phase, turn);
    });

    return PHASE_ORDER.filter((phase) => turnMap.has(phase)).map((phase) => {
      const turn = turnMap.get(phase)!;
      return {
        phase,
        content: turn.content,
        metadata: turn.metadata_json,
      };
    });
  }, [turns]);

  const totalPhases = phaseData.length;

  // Current phase info
  const currentPhase =
    currentPhaseIndex >= 0 && currentPhaseIndex < totalPhases
      ? phaseData[currentPhaseIndex].phase
      : null;

  const currentPhaseLabel = currentPhase
    ? PHASE_LABELS[currentPhase]
    : "Ready";

  // Progress calculation (0-100)
  const progress = useMemo(() => {
    if (totalPhases === 0) return 0;
    if (isComplete) return 100;
    if (currentPhaseIndex < 0) return 0;

    const phaseProgress = (currentPhaseIndex / totalPhases) * 100;
    const currentContent = phaseData[currentPhaseIndex]?.content || "";
    const charProgress =
      currentContent.length > 0
        ? (charIndex / currentContent.length) * (100 / totalPhases)
        : 0;

    return Math.min(phaseProgress + charProgress, 100);
  }, [currentPhaseIndex, charIndex, totalPhases, phaseData, isComplete]);

  // Initialize with topic node
  useEffect(() => {
    const initialNodes = createInitialNodes(run);
    setNodes(initialNodes);
    phasesRef.current = [];
    setCurrentPhaseIndex(-1);
    setCharIndex(0);
    setIsComplete(false);
    setIsPlaying(false);
  }, [run, setNodes]);

  // Create node for phase
  const createNodeForPhase = useCallback(
    (phaseIndex: number, fullContent: boolean = false) => {
      if (phaseIndex < 0 || phaseIndex >= phaseData.length) return;

      const { phase, content, metadata } = phaseData[phaseIndex];
      const newNode = createPhaseNode(phase, run);

      // Set initial content (empty if streaming, full if skipping)
      newNode.data.content = fullContent ? content : "";
      newNode.data.isStreaming = !fullContent;
      newNode.data.isComplete = fullContent;

      // Add score data if available
      if (phase.startsWith("score_") && metadata.scores) {
        (newNode.data as Record<string, unknown>).scores = metadata.scores;
      }

      // Add verdict data if available
      if (phase === "judge_verdict") {
        if (metadata.winner) {
          (newNode.data as Record<string, unknown>).winner = metadata.winner;
        }
        if (metadata.analysis) {
          (newNode.data as Record<string, unknown>).analysis = metadata.analysis;
        }
      }

      phasesRef.current.push(phase);

      setNodes((nds) => {
        const updatedNodes = [...nds, newNode];
        const newEdges = createSequenceEdges(phasesRef.current);

        const { nodes: layoutedNodes, edges: layoutedEdges } =
          getLayoutedElements(updatedNodes, newEdges);

        const activeEdges = layoutedEdges.map((edge) => ({
          ...edge,
          data: {
            ...edge.data,
            isActive: !fullContent && edge.target === phase,
          },
        })) as DebateFlowEdge[];

        setEdges(activeEdges);
        onLayoutChange?.();

        return layoutedNodes;
      });
    },
    [phaseData, run, setNodes, setEdges, onLayoutChange]
  );

  // Update node content during streaming
  const updateNodeContent = useCallback(
    (phase: DebatePhase, content: string) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === phase
            ? { ...node, data: { ...node.data, content } }
            : node
        ) as DebateFlowNode[]
      );
    },
    [setNodes]
  );

  // Mark node as complete
  const markNodeComplete = useCallback(
    (phase: DebatePhase) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === phase
            ? { ...node, data: { ...node.data, isStreaming: false, isComplete: true } }
            : node
        ) as DebateFlowNode[]
      );

      setEdges((eds) =>
        eds.map((edge) => ({
          ...edge,
          data: { ...edge.data, isActive: false },
        })) as DebateFlowEdge[]
      );
    },
    [setNodes, setEdges]
  );

  // Animation tick
  const tick = useCallback(
    (timestamp: number) => {
      if (!isPlaying || currentPhaseIndex < 0 || currentPhaseIndex >= totalPhases) {
        return;
      }

      const charDelay = BASE_CHAR_DELAY / speed;
      const elapsed = timestamp - lastTickRef.current;

      if (elapsed >= charDelay) {
        lastTickRef.current = timestamp;

        const currentData = phaseData[currentPhaseIndex];
        const content = currentData.content;

        if (charIndex < content.length) {
          // Stream next character
          const newContent = content.slice(0, charIndex + 1);
          updateNodeContent(currentData.phase, newContent);
          setCharIndex((prev) => prev + 1);
        } else {
          // Phase complete, move to next
          markNodeComplete(currentData.phase);

          if (currentPhaseIndex < totalPhases - 1) {
            // Start next phase
            const nextIndex = currentPhaseIndex + 1;
            setCurrentPhaseIndex(nextIndex);
            setCharIndex(0);
            createNodeForPhase(nextIndex, false);
          } else {
            // All phases complete
            setIsComplete(true);
            setIsPlaying(false);
            return;
          }
        }
      }

      animationRef.current = requestAnimationFrame(tick);
    },
    [
      isPlaying,
      currentPhaseIndex,
      totalPhases,
      speed,
      charIndex,
      phaseData,
      updateNodeContent,
      markNodeComplete,
      createNodeForPhase,
    ]
  );

  // Start/stop animation loop
  useEffect(() => {
    if (isPlaying && !isComplete) {
      lastTickRef.current = performance.now();
      animationRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying, isComplete, tick]);

  // Pause when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isPlaying) {
        setIsPlaying(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isPlaying]);

  // Helper to reset state (used by play and reset)
  const resetState = useCallback(() => {
    setIsPlaying(false);
    setCurrentPhaseIndex(-1);
    setCharIndex(0);
    setIsComplete(false);

    const initialNodes = createInitialNodes(run);
    setNodes(initialNodes);
    setEdges([]);
    phasesRef.current = [];

    onLayoutChange?.();
  }, [run, setNodes, setEdges, onLayoutChange]);

  // Control functions
  const play = useCallback(() => {
    if (isComplete) {
      // If complete, restart from beginning
      resetState();
      setTimeout(() => setIsPlaying(true), 50);
      return;
    }

    if (currentPhaseIndex < 0 && phaseData.length > 0) {
      // Start from first phase
      setCurrentPhaseIndex(0);
      setCharIndex(0);
      createNodeForPhase(0, false);
    }

    setIsPlaying(true);
  }, [isComplete, currentPhaseIndex, phaseData.length, createNodeForPhase, resetState]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const setSpeed = useCallback((newSpeed: ReplaySpeed) => {
    setSpeedState(newSpeed);
  }, []);

  const goToPhase = useCallback(
    (index: number) => {
      if (index < 0 || index >= totalPhases) return;

      // Pause playback
      setIsPlaying(false);

      // Reset nodes
      const initialNodes = createInitialNodes(run);
      phasesRef.current = [];

      // Build phases array up to target phase
      for (let i = 0; i <= index; i++) {
        phasesRef.current.push(phaseData[i].phase);
      }

      // Create nodes for all phases
      const phaseNodes = phasesRef.current.map((phase, i) => {
        const data = phaseData[i];
        const isTarget = i === index;
        const node = createPhaseNode(phase, run);
        node.data.content = isTarget ? "" : data.content;
        node.data.isStreaming = isTarget;
        node.data.isComplete = !isTarget;

        if (phase.startsWith("score_") && data.metadata.scores) {
          (node.data as Record<string, unknown>).scores = data.metadata.scores;
        }
        if (phase === "judge_verdict") {
          if (data.metadata.winner) {
            (node.data as Record<string, unknown>).winner = data.metadata.winner;
          }
          if (data.metadata.analysis) {
            (node.data as Record<string, unknown>).analysis = data.metadata.analysis;
          }
        }

        return node;
      });

      // Apply layout
      const allNodes = [...initialNodes, ...phaseNodes];
      const newEdges = createSequenceEdges(phasesRef.current);
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        allNodes,
        newEdges
      );

      setNodes(layoutedNodes);
      setEdges(layoutedEdges as DebateFlowEdge[]);

      setCurrentPhaseIndex(index);
      setCharIndex(0);
      setIsComplete(false);

      onLayoutChange?.();
    },
    [totalPhases, run, phaseData, setNodes, setEdges, onLayoutChange]
  );

  const nextPhase = useCallback(() => {
    if (currentPhaseIndex < totalPhases - 1) {
      // Complete current phase instantly
      if (currentPhaseIndex >= 0 && currentPhase) {
        const currentData = phaseData[currentPhaseIndex];
        updateNodeContent(currentPhase, currentData.content);
        markNodeComplete(currentPhase);
      }

      // Move to next phase
      const nextIndex = currentPhaseIndex + 1;
      setCurrentPhaseIndex(nextIndex);
      setCharIndex(0);
      createNodeForPhase(nextIndex, false);
    }
  }, [
    currentPhaseIndex,
    totalPhases,
    currentPhase,
    phaseData,
    updateNodeContent,
    markNodeComplete,
    createNodeForPhase,
  ]);

  const reset = useCallback(() => {
    resetState();
  }, [resetState]);

  const previousPhase = useCallback(() => {
    if (currentPhaseIndex > 0) {
      goToPhase(currentPhaseIndex - 1);
    } else if (currentPhaseIndex === 0) {
      // Go back to start
      reset();
    }
  }, [currentPhaseIndex, goToPhase, reset]);

  return {
    // React Flow state
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,

    // Playback state
    isPlaying,
    speed,
    currentPhase,
    currentPhaseIndex,
    totalPhases,
    progress,
    isComplete,
    currentPhaseLabel,

    // Controls
    play,
    pause,
    togglePlayPause,
    setSpeed,
    goToPhase,
    nextPhase,
    previousPhase,
    reset,
  };
}
