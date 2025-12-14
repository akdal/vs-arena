/**
 * Agent Preview SSE Streaming Hook
 * Handles real-time streaming for agent preview
 */

import { useState, useCallback, useRef } from "react";
import type { PreviewRequest } from "@/lib/types";

interface UseAgentPreviewState {
  isStreaming: boolean;
  content: string;
  error: string | null;
}

export function useAgentPreview() {
  const [state, setState] = useState<UseAgentPreviewState>({
    isStreaming: false,
    content: "",
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const startPreview = useCallback(async (request: PreviewRequest) => {
    // Reset state
    setState({
      isStreaming: true,
      content: "",
      error: null,
    });

    // Create abort controller for cleanup
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("http://localhost:8000/api/agents/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
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

          // Handle token events
          if (eventType === "token") {
            try {
              const data = JSON.parse(eventData);
              setState((prev) => ({
                ...prev,
                content: prev.content + (data.content || ""),
              }));
            } catch (e) {
              console.error("Failed to parse token data:", e);
            }
          }
          // Handle phase_end or error events
          else if (eventType === "phase_end" || eventType === "error") {
            // Stream complete
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
            content: "",
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

  const stopPreview = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      isStreaming: false,
    }));
  }, []);

  return {
    ...state,
    startPreview,
    stopPreview,
  };
}
