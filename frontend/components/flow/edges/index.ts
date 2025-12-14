/**
 * Edge Type Registry
 * Maps edge type strings to React components for React Flow
 */

import { SequenceEdge } from "./sequence-edge";
import { TargetEdge } from "./target-edge";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const edgeTypes: any = {
  sequence: SequenceEdge,
  target: TargetEdge,
};

export * from "./sequence-edge";
export * from "./target-edge";
