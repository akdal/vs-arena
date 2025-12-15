/**
 * Debate Hooks
 * TanStack Query hooks for debate operations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DebateStartRequest, Run, RunDetail, Turn } from "@/lib/types";
import {
  startDebate,
  getRuns,
  getRun,
  getRunTurns,
  deleteRun,
  createSwapTest,
  getSwapComparison,
} from "@/lib/api-client";

// Query Keys
const debateKeys = {
  all: ["debates"] as const,
  runs: () => [...debateKeys.all, "runs"] as const,
  runsList: () => [...debateKeys.runs()] as const,
  runDetails: () => [...debateKeys.runs(), "detail"] as const,
  runDetail: (id: string) => [...debateKeys.runDetails(), id] as const,
};

/**
 * Fetch all debate runs
 */
export function useRuns() {
  return useQuery({
    queryKey: debateKeys.runsList(),
    queryFn: getRuns,
  });
}

/**
 * Fetch single debate run by ID
 */
export function useRun(runId: string | null) {
  return useQuery({
    queryKey: debateKeys.runDetail(runId ?? ""),
    queryFn: () => getRun(runId!),
    enabled: !!runId,
  });
}

/**
 * Start a new debate
 */
export function useStartDebate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DebateStartRequest) => startDebate(data),
    onSuccess: () => {
      // Invalidate runs list to refetch
      queryClient.invalidateQueries({ queryKey: debateKeys.runsList() });
    },
  });
}

/**
 * Fetch turns for a debate run (for replay or live watching)
 * @param runId - The run ID to fetch turns for
 * @param pollInterval - Polling interval in ms (0 to disable, default 0)
 */
export function useRunTurns(runId: string | null, pollInterval: number = 0) {
  return useQuery({
    queryKey: [...debateKeys.runDetail(runId ?? ""), "turns"] as const,
    queryFn: () => getRunTurns(runId!),
    enabled: !!runId,
    refetchInterval: pollInterval > 0 ? pollInterval : false,
  });
}

/**
 * Delete a debate run
 */
export function useDeleteRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (runId: string) => deleteRun(runId),
    onSuccess: () => {
      // Invalidate runs list to refetch
      queryClient.invalidateQueries({ queryKey: debateKeys.runsList() });
    },
  });
}

/**
 * Create a swap test from a completed run
 * Swaps agent positions to detect position bias
 */
export function useCreateSwapTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (runId: string) => createSwapTest(runId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: debateKeys.runsList() });
    },
  });
}

/**
 * Fetch swap test comparison between two runs
 */
export function useSwapComparison(
  originalRunId: string | null,
  swapRunId: string | null
) {
  return useQuery({
    queryKey: ["swap-comparison", originalRunId, swapRunId] as const,
    queryFn: () => getSwapComparison(originalRunId!, swapRunId!),
    enabled: !!originalRunId && !!swapRunId,
  });
}
