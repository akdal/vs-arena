/**
 * Agent CRUD Hooks
 * TanStack Query hooks for agent operations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Agent, AgentCreate, AgentUpdate } from "@/lib/types";
import {
  getAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
  cloneAgent,
} from "@/lib/api-client";

// Query Keys
const agentKeys = {
  all: ["agents"] as const,
  lists: () => [...agentKeys.all, "list"] as const,
  list: () => [...agentKeys.lists()] as const,
  details: () => [...agentKeys.all, "detail"] as const,
  detail: (id: string) => [...agentKeys.details(), id] as const,
};

/**
 * Fetch all agents
 */
export function useAgents() {
  return useQuery({
    queryKey: agentKeys.list(),
    queryFn: getAgents,
  });
}

/**
 * Fetch single agent by ID
 */
export function useAgent(agentId: string | null) {
  return useQuery({
    queryKey: agentKeys.detail(agentId ?? ""),
    queryFn: () => getAgent(agentId!),
    enabled: !!agentId,
  });
}

/**
 * Create new agent
 */
export function useCreateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AgentCreate) => createAgent(data),
    onSuccess: () => {
      // Invalidate agents list to refetch
      queryClient.invalidateQueries({ queryKey: agentKeys.list() });
    },
  });
}

/**
 * Update existing agent
 */
export function useUpdateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AgentUpdate }) =>
      updateAgent(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate both list and specific agent detail
      queryClient.invalidateQueries({ queryKey: agentKeys.list() });
      queryClient.invalidateQueries({ queryKey: agentKeys.detail(id) });
    },
  });
}

/**
 * Delete agent
 */
export function useDeleteAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agentId: string) => deleteAgent(agentId),
    onSuccess: () => {
      // Invalidate agents list to refetch
      queryClient.invalidateQueries({ queryKey: agentKeys.list() });
    },
  });
}

/**
 * Clone agent
 */
export function useCloneAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agentId: string) => cloneAgent(agentId),
    onSuccess: () => {
      // Invalidate agents list to refetch
      queryClient.invalidateQueries({ queryKey: agentKeys.list() });
    },
  });
}
