/**
 * Node and Edge Factory Utilities
 */

import type { DebatePhase, RunDetail } from "@/lib/types";
import type { DebateFlowNode, DebateFlowEdge } from "./flow-types";
import { nodeTypeMap } from "./flow-types";

// Phase execution order for edge creation
const phaseOrder: DebatePhase[] = [
  "judge_intro",
  "opening_a",
  "opening_b",
  "score_opening_a",
  "score_opening_b",
  "rebuttal_a",
  "rebuttal_b",
  "score_rebuttal_a",
  "score_rebuttal_b",
  "summary_a",
  "summary_b",
  "score_summary_a",
  "score_summary_b",
  "judge_verdict",
];

/**
 * Create initial topic node
 */
export function createInitialNodes(run: RunDetail): DebateFlowNode[] {
  const nodes: DebateFlowNode[] = [];

  // Topic node
  nodes.push({
    id: "topic",
    type: "topic",
    position: { x: 0, y: 0 },
    data: { topic: run.topic },
  } as DebateFlowNode);

  return nodes;
}

/**
 * Create a node for a specific debate phase
 */
export function createPhaseNode(
  phase: DebatePhase,
  run: RunDetail
): DebateFlowNode {
  const nodeType = nodeTypeMap[phase];
  const isAgentA = phase.includes("_a");
  const isAgentB = phase.includes("_b");
  const isJudge = phase.includes("judge") || phase.includes("score");

  const agent = isAgentA ? "a" : isAgentB ? "b" : "judge";
  const agentData = isAgentA
    ? run.agent_a
    : isAgentB
    ? run.agent_b
    : run.agent_j;

  // For score nodes
  if (nodeType === "score") {
    return {
      id: phase,
      type: nodeType,
      position: { x: 0, y: 0 },
      data: {
        phase,
        agent,
        targetPhase: phase,
        content: "",
        isStreaming: false,
        isComplete: false,
      },
    } as DebateFlowNode;
  }

  // For verdict node
  if (nodeType === "verdict") {
    return {
      id: phase,
      type: nodeType,
      position: { x: 0, y: 0 },
      data: {
        phase,
        agent: "judge",
        content: "",
        isStreaming: false,
        isComplete: false,
      },
    } as DebateFlowNode;
  }

  // For debate nodes (judgeIntro, opening, rebuttal, summary)
  return {
    id: phase,
    type: nodeType,
    position: { x: 0, y: 0 },
    data: {
      phase,
      agent,
      agentName: agentData.name,
      position: isAgentA ? run.position_a : isAgentB ? run.position_b : undefined,
      content: "",
      isStreaming: false,
      isComplete: false,
    },
  } as DebateFlowNode;
}

/**
 * Create sequential edges connecting phases in order
 */
export function createSequenceEdges(phases: DebatePhase[]): DebateFlowEdge[] {
  const edges: DebateFlowEdge[] = [];

  // Topic -> first phase
  if (phases.length > 0) {
    edges.push({
      id: `topic->${phases[0]}`,
      source: "topic",
      target: phases[0],
      type: "sequence",
    } as DebateFlowEdge);
  }

  // Phase to phase
  for (let i = 0; i < phases.length - 1; i++) {
    edges.push({
      id: `${phases[i]}->${phases[i + 1]}`,
      source: phases[i],
      target: phases[i + 1],
      type: "sequence",
    } as DebateFlowEdge);
  }

  return edges;
}

/**
 * Create target edges showing rebuttal connections
 * (optional - shows what argument is being rebutted)
 */
export function createTargetEdges(): DebateFlowEdge[] {
  return [
    {
      id: "rebuttal_a->opening_b",
      source: "rebuttal_a",
      target: "opening_b",
      type: "target",
      data: { targetPhase: "opening_b" },
    },
    {
      id: "rebuttal_b->opening_a",
      source: "rebuttal_b",
      target: "opening_a",
      type: "target",
      data: { targetPhase: "opening_a" },
    },
  ] as DebateFlowEdge[];
}
