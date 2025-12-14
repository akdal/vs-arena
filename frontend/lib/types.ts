/**
 * TypeScript type definitions for VS Arena
 * Matches backend Pydantic schemas from backend/app/models/schemas.py
 */

// Agent Types
export interface Agent {
  agent_id: string;
  name: string;
  model: string;
  persona_json: Record<string, unknown>;
  params_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AgentCreate {
  name: string;
  model: string;
  persona_json: Record<string, unknown>;
  params_json: Record<string, unknown>;
}

export interface AgentUpdate {
  name?: string;
  model?: string;
  persona_json?: Record<string, unknown>;
  params_json?: Record<string, unknown>;
}

// Ollama Types
export interface OllamaModel {
  name: string;
  size: string;
  quantization: string;
}

export interface OllamaStatus {
  status: string;
  models_count: number;
}

// Preview Types
export interface PreviewRequest {
  agent_config: AgentCreate;
  topic: string;
  position: "FOR" | "AGAINST";
}

export interface PreviewResponse {
  argument: string;
  topic: string;
  position: string;
}

// SSE Event Types
export type SSEEventType =
  | "phase_start"
  | "token"
  | "phase_end"
  | "score"
  | "verdict"
  | "run_complete"
  | "error";

export interface SSEEvent {
  event: SSEEventType;
  data: unknown;
}

// API Error Type
export interface APIError {
  detail: string;
}
