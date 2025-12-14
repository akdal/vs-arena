/**
 * Debate Hooks
 * TanStack Query hooks for debate operations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DebateStartRequest, Run, RunDetail } from "@/lib/types";
import { startDebate, getRuns, getRun } from "@/lib/api-client";

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
