/**
 * Debate Stream SSE Hook
 * Handles real-time streaming for debate execution
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { DebatePhase } from "@/lib/types";

interface UseDebateStreamState {
  isStreaming: boolean;
  currentPhase: DebatePhase | null;
  content: string;
  scores: Record<string, unknown>;
  verdict: string | null;
  error: string | null;
}

export function useDebateStream() {
  const [state, setState] = useState<UseDebateStreamState>({
    isStreaming: false,
    currentPhase: null,
    content: "",
    scores: {},
    verdict: null,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const startStream = useCallback(async (runId: string) => {
    // Reset state
    setState({
      isStreaming: true,
      currentPhase: null,
      content: "",
      scores: {},
      verdict: null,
      error: null,
    });

    // Create abort controller for cleanup
    abortControllerRef.current = new AbortController();

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

          // Handle different event types
          if (eventType === "phase_start") {
            try {
              const data = JSON.parse(eventData);
              setState((prev) => ({
                ...prev,
                currentPhase: data.phase as DebatePhase,
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
            // Stream complete successfully
            setState((prev) => ({
              ...prev,
              isStreaming: false,
            }));
            break;
          } else if (eventType === "error") {
            try {
              const data = JSON.parse(eventData);
              setState((prev) => ({
                ...prev,
                isStreaming: false,
                error: data.error || "Unknown error",
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

      // Stream finished successfully
      setState((prev) => ({
        ...prev,
        isStreaming: false,
      }));
    } catch (error) {
      if (error instanceof Error) {
        // Ignore abort errors
        if (error.name === "AbortError") {
          setState({
            isStreaming: false,
            currentPhase: null,
            content: "",
            scores: {},
            verdict: null,
            error: null,
          });
        } else {
          setState((prev) => ({
            ...prev,
            isStreaming: false,
            error: error.message,
          }));
        }
      }
    }
  }, []);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      isStreaming: false,
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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
