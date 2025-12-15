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
  | "error"
  | "heartbeat";

export interface SSEEvent {
  event: SSEEventType;
  data: unknown;
}

// Debate Types
export interface DebateStartRequest {
  topic: string;
  position_a: "FOR" | "AGAINST";
  position_b: "FOR" | "AGAINST";
  agent_a_id: string;
  agent_b_id: string;
  agent_j_id: string;
  config?: DebateConfig;
  rubric?: RubricConfig;
}

export interface DebateConfig {
  rounds?: number;
  max_tokens_per_turn?: number;
}

export interface RubricConfig {
  argumentation_weight?: number;
  rebuttal_weight?: number;
  delivery_weight?: number;
  strategy_weight?: number;
}

export interface DebateStartResponse {
  run_id: string;
  status: string;
  stream_url: string;
}

export interface Run {
  run_id: string;
  topic: string;
  position_a: string;
  position_b: string;
  agent_a_id: string;
  agent_b_id: string;
  agent_j_id: string | null;
  config_json: Record<string, unknown>;
  rubric_json: Record<string, unknown>;
  result_json: Record<string, unknown> | null;
  status: string;
  created_at: string;
  finished_at: string | null;
}

export interface RunDetail extends Omit<Run, "agent_a_id" | "agent_b_id" | "agent_j_id"> {
  agent_a: Agent;
  agent_b: Agent;
  agent_j: Agent;
}

export type DebatePhase =
  | "judge_intro"
  | "opening_a"
  | "opening_b"
  | "rebuttal_a"
  | "rebuttal_b"
  | "summary_a"
  | "summary_b"
  | "score_opening_a"
  | "score_opening_b"
  | "score_rebuttal_a"
  | "score_rebuttal_b"
  | "score_summary_a"
  | "score_summary_b"
  | "judge_verdict";

export type DebateEventType = SSEEventType;

// Turn Type (for replay)
export interface Turn {
  turn_id: string;
  run_id: string;
  agent_id: string;
  phase: string;
  role: string;
  content: string;
  targets: string[];
  metadata_json: Record<string, unknown>;
  created_at: string;
}

// API Error Type
export interface APIError {
  detail: string;
}

// Replay Types
export type ReplaySpeed = 0.5 | 1 | 2;
