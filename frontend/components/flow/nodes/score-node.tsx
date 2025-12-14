"use client";

import { memo } from "react";
import { BaseDebateNode } from "./base-debate-node";
import type { ScoreNodeData } from "../utils/flow-types";

export const ScoreNode = memo(function ScoreNode({
  data,
}: {
  data: ScoreNodeData;
}) {
  return (
    <BaseDebateNode
      agent="judge"
      title="Score"
      subtitle={data.targetPhase}
      isStreaming={data.isStreaming}
      isComplete={data.isComplete}
    >
      {data.scores ? (
        <div className="space-y-1 text-xs">
          {data.scores.argumentation && (
            <div>Argumentation: {data.scores.argumentation}</div>
          )}
          {data.scores.rebuttal && <div>Rebuttal: {data.scores.rebuttal}</div>}
          {data.scores.delivery && <div>Delivery: {data.scores.delivery}</div>}
          {data.scores.strategy && <div>Strategy: {data.scores.strategy}</div>}
          {data.scores.total && (
            <div className="font-semibold pt-1 border-t">
              Total: {data.scores.total}
            </div>
          )}
        </div>
      ) : (
        <div className="text-muted-foreground">
          {data.isStreaming ? "Scoring..." : "Waiting..."}
        </div>
      )}
    </BaseDebateNode>
  );
});
