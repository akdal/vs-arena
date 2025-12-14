/**
 * API Client for VS Arena Backend
 * Base URL: http://localhost:8000/api
 */

import type {
  Agent,
  AgentCreate,
  AgentUpdate,
  OllamaModel,
  OllamaStatus,
  DebateStartRequest,
  DebateStartResponse,
  Run,
  RunDetail,
  Turn,
  APIError,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error: APIError = await response.json().catch(() => ({
        detail: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.detail);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred");
  }
}

// ============================================================================
// Agent API
// ============================================================================

/**
 * Get all agents
 */
export async function getAgents(): Promise<Agent[]> {
  return fetchAPI<Agent[]>("/agents/");
}

/**
 * Get single agent by ID
 */
export async function getAgent(agentId: string): Promise<Agent> {
  return fetchAPI<Agent>(`/agents/${agentId}`);
}

/**
 * Create new agent
 */
export async function createAgent(data: AgentCreate): Promise<Agent> {
  return fetchAPI<Agent>("/agents/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update existing agent
 */
export async function updateAgent(
  agentId: string,
  data: AgentUpdate
): Promise<Agent> {
  return fetchAPI<Agent>(`/agents/${agentId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Delete agent
 */
export async function deleteAgent(agentId: string): Promise<void> {
  return fetchAPI<void>(`/agents/${agentId}`, {
    method: "DELETE",
  });
}

/**
 * Clone agent
 */
export async function cloneAgent(agentId: string): Promise<Agent> {
  return fetchAPI<Agent>(`/agents/${agentId}/clone`, {
    method: "POST",
  });
}

// ============================================================================
// Ollama API
// ============================================================================

/**
 * Get available Ollama models
 */
export async function getOllamaModels(): Promise<OllamaModel[]> {
  return fetchAPI<OllamaModel[]>("/ollama/models");
}

/**
 * Get Ollama server status
 */
export async function getOllamaStatus(): Promise<OllamaStatus> {
  return fetchAPI<OllamaStatus>("/ollama/status");
}

// ============================================================================
// Debate API
// ============================================================================

/**
 * Start a new debate
 */
export async function startDebate(
  data: DebateStartRequest
): Promise<DebateStartResponse> {
  return fetchAPI<DebateStartResponse>("/debate/start", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Get all debate runs
 */
export async function getRuns(): Promise<Run[]> {
  return fetchAPI<Run[]>("/debate/runs");
}

/**
 * Get single debate run by ID
 */
export async function getRun(runId: string): Promise<RunDetail> {
  return fetchAPI<RunDetail>(`/debate/runs/${runId}`);
}

/**
 * Get all turns for a debate run (for replay)
 */
export async function getRunTurns(runId: string): Promise<Turn[]> {
  return fetchAPI<Turn[]>(`/debate/runs/${runId}/turns`);
}

/**
 * Delete a debate run
 */
export async function deleteRun(runId: string): Promise<void> {
  return fetchAPI<void>(`/debate/runs/${runId}`, {
    method: "DELETE",
  });
}
