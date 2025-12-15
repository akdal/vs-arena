"use client";

/**
 * Debate Flow Hook
 * Manages React Flow state for debate visualization with SSE streaming
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useNodesState, useEdgesState } from "@xyflow/react";
import type { DebatePhase, RunDetail } from "@/lib/types";
import {
  getUserFriendlyError,
  getMaxReconnectsError,
  type FriendlyError,
} from "@/lib/error-messages";
import type {
  DebateFlowNode,
  DebateFlowEdge,
} from "@/components/flow/utils/flow-types";
import {
  createInitialNodes,
  createPhaseNode,
  createSequenceEdges,
} from "@/components/flow/utils/node-factory";
import {
  getLayoutedElements,
  getIncrementalNodePosition,
} from "@/components/flow/utils/layout";

// Reconnection constants
const MAX_RECONNECT_ATTEMPTS = 3;
const CONNECTION_TIMEOUT_MS = 30000; // 30 seconds without events triggers reconnect

interface UseDebateFlowOptions {
  run: RunDetail;
  onLayoutChange?: () => void;
}

export function useDebateFlow({ run, onLayoutChange }: UseDebateFlowOptions) {
  const [nodes, setNodes, onNodesChange] = useNodesState<DebateFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<DebateFlowEdge>([]);
  const [currentPhase, setCurrentPhase] = useState<DebatePhase | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<FriendlyError | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const phasesRef = useRef<DebatePhase[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentRunIdRef = useRef<string | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Token batching refs for performance (reduces renders from 100+/sec to ~60/sec)
  const tokenBufferRef = useRef<string>("");
  const rafIdRef = useRef<number | null>(null);
  const currentPhaseRef = useRef<DebatePhase | null>(null);

  // Refs to avoid stale closures in timeout/reconnect callbacks
  const isStreamingRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const isReconnectingRef = useRef(false);

  // Sync refs with state
  useEffect(() => {
    isStreamingRef.current = isStreaming;
  }, [isStreaming]);

  useEffect(() => {
    reconnectAttemptsRef.current = reconnectAttempts;
  }, [reconnectAttempts]);

  useEffect(() => {
    isReconnectingRef.current = isReconnecting;
  }, [isReconnecting]);

  // Reset connection timeout - called when events are received
  const resetConnectionTimeout = useCallback(() => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
    }

    connectionTimeoutRef.current = setTimeout(() => {
      // Only trigger reconnect if we're still streaming
      if (isStreamingRef.current && !isReconnectingRef.current) {
        console.warn("Connection timeout - no events received for 30s");
        // Abort current connection and trigger reconnect
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }
    }, CONNECTION_TIMEOUT_MS);
  }, []);

  // Attempt reconnection with exponential backoff
  const attemptReconnect = useCallback(
    async (runId: string) => {
      const currentAttempts = reconnectAttemptsRef.current;

      if (currentAttempts >= MAX_RECONNECT_ATTEMPTS) {
        setError(getMaxReconnectsError());
        setIsStreaming(false);
        setIsReconnecting(false);
        return;
      }

      setIsReconnecting(true);
      const delay = Math.pow(2, currentAttempts) * 1000; // 1s, 2s, 4s
      console.log(`Reconnecting in ${delay}ms (attempt ${currentAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);

      await new Promise((resolve) => setTimeout(resolve, delay));

      // Check if we were aborted during the delay
      if (!isStreamingRef.current) {
        setIsReconnecting(false);
        return;
      }

      setReconnectAttempts((prev) => prev + 1);
      setIsReconnecting(false);

      // Restart the stream
      startStreamInternal(runId, true);
    },
    []
  );

  // Initialize with topic node
  useEffect(() => {
    const initialNodes = createInitialNodes(run);
    setNodes(initialNodes);
    phasesRef.current = []; // Reset phases when run changes
    setCurrentPhase(null);
    setError(null);
  }, [run, setNodes]);

  // Handle phase start - add new node with incremental layout (O(1) vs O(n²))
  const handlePhaseStart = useCallback(
    (phase: DebatePhase) => {
      const newNode = createPhaseNode(phase, run);
      newNode.data.isStreaming = true;

      phasesRef.current.push(phase);

      setNodes((nds) => {
        // Use incremental layout for performance - just position new node below last
        const newPosition = getIncrementalNodePosition(nds);
        const positionedNewNode = {
          ...newNode,
          position: newPosition,
          targetPosition: "top" as const,
          sourcePosition: "bottom" as const,
        };

        const updatedNodes = [...nds, positionedNewNode];

        // Create edges incrementally - only add the new edge
        const newEdges = createSequenceEdges(phasesRef.current);

        // Mark the edge leading to this node as active
        const activeEdges = newEdges.map((edge) => ({
          ...edge,
          data: {
            ...edge.data,
            isActive: edge.target === phase,
          },
        })) as DebateFlowEdge[];

        setEdges(activeEdges);
        onLayoutChange?.();

        return updatedNodes as DebateFlowNode[];
      });

      setCurrentPhase(phase);
      currentPhaseRef.current = phase;
    },
    [run, setNodes, setEdges, onLayoutChange]
  );

  // Handle token - update node content with RAF batching for performance
  const handleToken = useCallback(
    (content: string) => {
      // Buffer the token content
      tokenBufferRef.current += content;

      // Schedule batched update if not already scheduled
      if (!rafIdRef.current) {
        rafIdRef.current = requestAnimationFrame(() => {
          const bufferedContent = tokenBufferRef.current;
          const targetPhase = currentPhaseRef.current;

          // Clear buffer and RAF ref
          tokenBufferRef.current = "";
          rafIdRef.current = null;

          // Skip if no content or no target phase
          if (!bufferedContent || !targetPhase) return;

          setNodes((nds) =>
            nds.map((node) =>
              node.id === targetPhase
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      content: node.data.content + bufferedContent,
                    },
                  }
                : node
            ) as DebateFlowNode[]
          );
        });
      }
    },
    [setNodes]
  );

  // Handle phase end - mark node complete
  const handlePhaseEnd = useCallback(
    (phase: DebatePhase) => {
      // Flush any pending buffered tokens before marking complete
      if (tokenBufferRef.current && currentPhaseRef.current === phase) {
        const bufferedContent = tokenBufferRef.current;
        tokenBufferRef.current = "";

        // Cancel any pending RAF
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }

        // Apply final content
        setNodes((nds) =>
          nds.map((node) =>
            node.id === phase
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    content: node.data.content + bufferedContent,
                    isStreaming: false,
                    isComplete: true,
                  },
                }
              : node
          ) as DebateFlowNode[]
        );
      } else {
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
      }

      // Clear active state from all edges
      setEdges((eds) =>
        eds.map((edge) => ({
          ...edge,
          data: {
            ...edge.data,
            isActive: false,
          },
        })) as DebateFlowEdge[]
      );

      setCurrentPhase(null);
      currentPhaseRef.current = null;
    },
    [setNodes, setEdges]
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

  // Internal stream function with reconnection support
  const startStreamInternal = useCallback(
    async (runId: string, isReconnect: boolean = false) => {
      if (!isReconnect) {
        setReconnectAttempts(0);
        currentRunIdRef.current = runId;
      }

      setIsStreaming(true);
      setError(null);

      // Create abort controller for cleanup
      abortControllerRef.current = new AbortController();

      // Start connection timeout
      resetConnectionTimeout();

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

      try {
        const response = await fetch(`${apiUrl}/debate/stream/${runId}`, {
          method: "GET",
          headers: {
            Accept: "text/event-stream",
          },
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({
            detail: `HTTP ${response.status}: ${response.statusText}`,
          }));
          throw new Error(error.detail);
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          // Decode chunk and add to buffer
          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE messages (separated by double newlines)
          const messages = buffer.split("\n\n");
          buffer = messages.pop() || ""; // Keep incomplete message in buffer

          for (const message of messages) {
            if (!message.trim()) continue;

            // Parse SSE format: "event: <type>\ndata: <json>"
            const lines = message.split("\n");
            let eventType = "";
            let eventData = "";

            for (const line of lines) {
              if (line.startsWith("event: ")) {
                eventType = line.substring(7).trim();
              } else if (line.startsWith("data: ")) {
                eventData = line.substring(6).trim();
              }
            }

            // Reset timeout on any valid event
            resetConnectionTimeout();

            // Handle different event types
            if (eventType === "phase_start") {
              try {
                const data = JSON.parse(eventData);
                handlePhaseStart(data.phase as DebatePhase);
              } catch (e) {
                console.error("Failed to parse phase_start data:", e);
              }
            } else if (eventType === "token") {
              try {
                const data = JSON.parse(eventData);
                handleToken(data.content || "");
              } catch (e) {
                console.error("Failed to parse token data:", e);
              }
            } else if (eventType === "phase_end") {
              try {
                const data = JSON.parse(eventData);
                handlePhaseEnd(data.phase as DebatePhase);
              } catch (e) {
                console.error("Failed to parse phase_end data:", e);
              }
            } else if (eventType === "score") {
              try {
                const data = JSON.parse(eventData);
                handleScore(data);
              } catch (e) {
                console.error("Failed to parse score data:", e);
              }
            } else if (eventType === "verdict") {
              try {
                const data = JSON.parse(eventData);
                handleVerdict(data);
              } catch (e) {
                console.error("Failed to parse verdict data:", e);
              }
            } else if (eventType === "run_complete") {
              // Clear connection timeout
              if (connectionTimeoutRef.current) {
                clearTimeout(connectionTimeoutRef.current);
                connectionTimeoutRef.current = null;
              }
              setIsStreaming(false);
              setReconnectAttempts(0);
              break;
            } else if (eventType === "error") {
              // Clear connection timeout
              if (connectionTimeoutRef.current) {
                clearTimeout(connectionTimeoutRef.current);
                connectionTimeoutRef.current = null;
              }
              try {
                const data = JSON.parse(eventData);
                // Backend sends "message", also support legacy "error" field
                const errorMessage = data.message || data.error || "Unknown error";
                console.error("Stream error:", errorMessage);
                setError(getUserFriendlyError(errorMessage));
              } catch (e) {
                console.error("Failed to parse error event:", e);
                setError(getUserFriendlyError("Stream error occurred"));
              }
              setIsStreaming(false);
              setReconnectAttempts(0);
              break;
            } else if (eventType === "heartbeat") {
              // Heartbeat received - connection is alive, no UI update needed
              continue;
            }
          }
        }

        // Stream finished successfully
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        setIsStreaming(false);
        setReconnectAttempts(0);
      } catch (error) {
        // Clear connection timeout
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        // Clear buffered tokens on error
        tokenBufferRef.current = "";
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
        if (error instanceof Error) {
          // Handle abort - attempt reconnection if this was a timeout
          if (error.name === "AbortError") {
            // Check if we should attempt reconnection (timeout-triggered abort)
            if (isStreamingRef.current && currentRunIdRef.current) {
              attemptReconnect(currentRunIdRef.current);
              return;
            }
          } else {
            console.error("Stream error:", error.message);
            setError(getUserFriendlyError(error));
          }
          setIsStreaming(false);
        }
      }
    },
    [handlePhaseStart, handleToken, handlePhaseEnd, handleScore, handleVerdict, resetConnectionTimeout, attemptReconnect]
  );

  // Public start stream function
  const startStream = useCallback(
    (runId: string) => {
      startStreamInternal(runId, false);
    },
    [startStreamInternal]
  );

  // Stop streaming
  const stopStream = useCallback(() => {
    // Clear state to prevent reconnection
    isStreamingRef.current = false;
    currentRunIdRef.current = null;

    // Clear connection timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setIsStreaming(false);
    setIsReconnecting(false);
    setReconnectAttempts(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear state to prevent reconnection
      isStreamingRef.current = false;
      currentRunIdRef.current = null;

      // Clear token buffer to prevent stale content on remount
      tokenBufferRef.current = "";

      // Cancel any pending RAF
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      // Clear connection timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }

      // Abort any ongoing fetch
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  return {
    nodes,
    edges,
    currentPhase,
    isStreaming,
    error,
    isReconnecting,
    reconnectAttempts,
    maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
    onNodesChange,
    onEdgesChange,
    startStream,
    stopStream,
  };
}
