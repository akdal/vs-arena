/**
 * Ollama Models Hooks
 * TanStack Query hooks for Ollama server operations
 */

import { useQuery } from "@tanstack/react-query";
import { getOllamaModels, getOllamaStatus } from "@/lib/api-client";

/**
 * Fetch available Ollama models
 */
export function useOllamaModels() {
  return useQuery({
    queryKey: ["ollama", "models"],
    queryFn: getOllamaModels,
    // Refetch on mount since models can change
    refetchOnMount: true,
    // Cache for 1 minute
    staleTime: 1000 * 60,
  });
}

/**
 * Fetch Ollama server status
 */
export function useOllamaStatus() {
  return useQuery({
    queryKey: ["ollama", "status"],
    queryFn: getOllamaStatus,
    // Poll status every 30 seconds
    refetchInterval: 30000,
    // Cache for 10 seconds
    staleTime: 1000 * 10,
  });
}
