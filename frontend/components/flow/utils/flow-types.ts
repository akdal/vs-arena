/**
 * React Flow Type Definitions for Debate Visualization
 */

import type { Node, Edge } from "@xyflow/react";
import type { DebatePhase } from "@/lib/types";

// Node data types
export interface BaseNodeData extends Record<string, unknown> {
  phase: DebatePhase;
  content: string;
  isStreaming: boolean;
  isComplete: boolean;
}

export interface TopicNodeData extends Record<string, unknown> {
  topic: string;
}

export interface DebateNodeData extends BaseNodeData {
  agent: "a" | "b" | "judge";
  agentName: string;
  position?: "FOR" | "AGAINST";
}

export interface ScoreNodeData extends BaseNodeData {
  agent: "a" | "b" | "judge";
  targetPhase: DebatePhase;
  scores?: {
    argumentation?: number;
    rebuttal?: number;
    delivery?: number;
    strategy?: number;
    total?: number;
  };
}

export interface VerdictNodeData extends BaseNodeData {
  agent: "judge";
  winner?: "a" | "b" | "tie";
  analysis?: string;
}

// Custom node types
export type DebateFlowNode =
  | Node<TopicNodeData, "topic">
  | Node<DebateNodeData, "judgeIntro">
  | Node<DebateNodeData, "opening">
  | Node<DebateNodeData, "rebuttal">
  | Node<DebateNodeData, "summary">
  | Node<ScoreNodeData, "score">
  | Node<VerdictNodeData, "verdict">;

// Custom edge types
export type DebateFlowEdge =
  | Edge<Record<string, never>, "sequence">
  | Edge<{ targetPhase: DebatePhase }, "target">;

// Node type mapping from DebatePhase to React Flow node type
export const nodeTypeMap: Record<DebatePhase, string> = {
  judge_intro: "judgeIntro",
  opening_a: "opening",
  opening_b: "opening",
  rebuttal_a: "rebuttal",
  rebuttal_b: "rebuttal",
  summary_a: "summary",
  summary_b: "summary",
  score_opening_a: "score",
  score_opening_b: "score",
  score_rebuttal_a: "score",
  score_rebuttal_b: "score",
  score_summary_a: "score",
  score_summary_b: "score",
  judge_verdict: "verdict",
};
