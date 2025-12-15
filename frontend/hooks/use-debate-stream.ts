/**
 * Debate Stream SSE Hook
 * Handles real-time streaming for debate execution with reconnection support
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { DebatePhase } from "@/lib/types";

const MAX_RECONNECT_ATTEMPTS = 3;
const CONNECTION_TIMEOUT_MS = 30000; // 30 seconds without events triggers reconnect

interface UseDebateStreamState {
  isStreaming: boolean;
  currentPhase: DebatePhase | null;
  content: string;
  scores: Record<string, unknown>;
  verdict: string | null;
  error: string | null;
  reconnectAttempts: number;
  isReconnecting: boolean;
}

export function useDebateStream() {
  const [state, setState] = useState<UseDebateStreamState>({
    isStreaming: false,
    currentPhase: null,
    content: "",
    scores: {},
    verdict: null,
    error: null,
    reconnectAttempts: 0,
    isReconnecting: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const currentRunIdRef = useRef<string | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPhaseRef = useRef<DebatePhase | null>(null);

  // Refs to avoid stale closures in timeout/reconnect callbacks
  const isStreamingRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const isReconnectingRef = useRef(false); // Guard against concurrent reconnects

  // Sync refs with state
  useEffect(() => {
    isStreamingRef.current = state.isStreaming;
  }, [state.isStreaming]);

  useEffect(() => {
    reconnectAttemptsRef.current = state.reconnectAttempts;
  }, [state.reconnectAttempts]);

  // Reset connection timeout (called on each received event)
  const resetConnectionTimeout = useCallback(() => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
    }
    connectionTimeoutRef.current = setTimeout(() => {
      // Connection timed out - attempt reconnect (use refs to avoid stale closure)
      if (currentRunIdRef.current && isStreamingRef.current) {
        console.warn("SSE connection timeout, attempting reconnect...");
        attemptReconnect();
      }
    }, CONNECTION_TIMEOUT_MS);
  }, []); // No dependencies - uses refs

  // Attempt reconnection with exponential backoff
  const attemptReconnect = useCallback(async () => {
    // Guard against concurrent reconnection attempts
    if (isReconnectingRef.current) return;

    const runId = currentRunIdRef.current;
    if (!runId) return;

    // Use ref for current attempt count (avoids race condition)
    const currentAttempts = reconnectAttemptsRef.current;
    if (currentAttempts >= MAX_RECONNECT_ATTEMPTS) {
      setState((prev) => ({
        ...prev,
        isStreaming: false,
        isReconnecting: false,
        error: "Connection lost after multiple reconnect attempts",
      }));
      return;
    }

    // Set reconnecting guard
    isReconnectingRef.current = true;

    try {
      // Increment attempts
      const newAttempts = currentAttempts + 1;
      reconnectAttemptsRef.current = newAttempts;
      setState((prev) => ({
        ...prev,
        isReconnecting: true,
        reconnectAttempts: newAttempts,
      }));

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, newAttempts - 1) * 1000;
      console.log(`Reconnecting in ${delay}ms (attempt ${newAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

      await new Promise((resolve) => setTimeout(resolve, delay));

      // Abort current connection if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Resume stream (don't reset content, just continue)
      startStreamInternal(runId, false);
    } finally {
      isReconnectingRef.current = false;
    }
  }, []); // No dependencies - uses refs

  // Internal stream start (with option to preserve content)
  const startStreamInternal = useCallback(async (runId: string, resetContent: boolean = true) => {
    currentRunIdRef.current = runId;

    // Reset or preserve state based on resetContent flag
    if (resetContent) {
      setState({
        isStreaming: true,
        currentPhase: null,
        content: "",
        scores: {},
        verdict: null,
        error: null,
        reconnectAttempts: 0,
        isReconnecting: false,
      });
      lastPhaseRef.current = null;
    } else {
      setState((prev) => ({
        ...prev,
        isStreaming: true,
        isReconnecting: false,
        error: null,
      }));
    }

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

        // Reset connection timeout on any received data
        resetConnectionTimeout();

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

          // Handle heartbeat events (keep-alive, no UI update needed)
          if (eventType === "heartbeat") {
            // Heartbeat received - connection is alive
            // Reset reconnect attempts on successful heartbeat
            setState((prev) => ({
              ...prev,
              reconnectAttempts: 0,
            }));
            continue;
          }

          // Handle different event types
          if (eventType === "phase_start") {
            try {
              const data = JSON.parse(eventData);
              const phase = data.phase as DebatePhase;
              lastPhaseRef.current = phase;
              setState((prev) => ({
                ...prev,
                currentPhase: phase,
                content: prev.content + `\n\n=== ${data.phase} ===\n`,
              }));
            } catch (e) {
              console.error("Failed to parse phase_start data:", e);
            }
          } else if (eventType === "token") {
            try {
              const data = JSON.parse(eventData);
              setState((prev) => ({
                ...prev,
                content: prev.content + (data.content || ""),
              }));
            } catch (e) {
              console.error("Failed to parse token data:", e);
            }
          } else if (eventType === "phase_end") {
            try {
              const data = JSON.parse(eventData);
              setState((prev) => ({
                ...prev,
                content: prev.content + "\n",
              }));
            } catch (e) {
              console.error("Failed to parse phase_end data:", e);
            }
          } else if (eventType === "score") {
            try {
              const data = JSON.parse(eventData);
              setState((prev) => ({
                ...prev,
                scores: { ...prev.scores, ...data },
                content: prev.content + `\n\n[Score: ${JSON.stringify(data)}]\n`,
              }));
            } catch (e) {
              console.error("Failed to parse score data:", e);
            }
          } else if (eventType === "verdict") {
            try {
              const data = JSON.parse(eventData);
              setState((prev) => ({
                ...prev,
                verdict: data.verdict || data.winner || "",
                content:
                  prev.content +
                  `\n\n=== VERDICT ===\n${data.verdict || data.winner}\n`,
              }));
            } catch (e) {
              console.error("Failed to parse verdict data:", e);
            }
          } else if (eventType === "run_complete") {
            // Stream complete successfully - clear timeout and reset
            if (connectionTimeoutRef.current) {
              clearTimeout(connectionTimeoutRef.current);
              connectionTimeoutRef.current = null;
            }
            currentRunIdRef.current = null;
            setState((prev) => ({
              ...prev,
              isStreaming: false,
              reconnectAttempts: 0,
              isReconnecting: false,
            }));
            break;
          } else if (eventType === "error") {
            try {
              const data = JSON.parse(eventData);
              setState((prev) => ({
                ...prev,
                isStreaming: false,
                // Backend sends "message", also support legacy "error" field
                error: data.message || data.error || "Unknown error",
              }));
            } catch (e) {
              setState((prev) => ({
                ...prev,
                isStreaming: false,
                error: "Stream error occurred",
              }));
            }
            break;
          }
        }
      }

      // Stream finished successfully - clear timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      currentRunIdRef.current = null;
      setState((prev) => ({
        ...prev,
        isStreaming: false,
        reconnectAttempts: 0,
        isReconnecting: false,
      }));
    } catch (error) {
      if (error instanceof Error) {
        // Ignore abort errors (user-initiated stop)
        if (error.name === "AbortError") {
          // Clear timeout
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
          setState((prev) => ({
            ...prev,
            isStreaming: false,
            isReconnecting: false,
          }));
        } else {
          // Network error - attempt reconnect
          console.error("Stream error:", error.message);
          attemptReconnect();
        }
      }
    }
  }, [resetConnectionTimeout, attemptReconnect]);

  // Public startStream function
  const startStream = useCallback(async (runId: string) => {
    startStreamInternal(runId, true);
  }, [startStreamInternal]);

  const stopStream = useCallback(() => {
    // Clear connection timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    // Abort current fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // Clear run tracking
    currentRunIdRef.current = null;
    setState((prev) => ({
      ...prev,
      isStreaming: false,
      isReconnecting: false,
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  return {
    ...state,
    startStream,
    stopStream,
  };
}
