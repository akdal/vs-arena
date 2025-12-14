/**
 * Node Type Registry
 * Maps node type strings to React components for React Flow
 */

import { TopicNode } from "./topic-node";
import { JudgeIntroNode } from "./judge-intro-node";
import { OpeningNode } from "./opening-node";
import { RebuttalNode } from "./rebuttal-node";
import { SummaryNode } from "./summary-node";
import { ScoreNode } from "./score-node";
import { VerdictNode } from "./verdict-node";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const nodeTypes: any = {
  topic: TopicNode,
  judgeIntro: JudgeIntroNode,
  opening: OpeningNode,
  rebuttal: RebuttalNode,
  summary: SummaryNode,
  score: ScoreNode,
  verdict: VerdictNode,
};

export * from "./topic-node";
export * from "./judge-intro-node";
export * from "./opening-node";
export * from "./rebuttal-node";
export * from "./summary-node";
export * from "./score-node";
export * from "./verdict-node";
