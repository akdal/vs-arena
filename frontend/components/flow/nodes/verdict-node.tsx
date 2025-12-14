"use client";

import { memo } from "react";
import { BaseDebateNode } from "./base-debate-node";
import { StreamingText } from "./streaming-text";
import type { VerdictNodeData } from "../utils/flow-types";
import { Badge } from "@/components/ui/badge";

export const VerdictNode = memo(function VerdictNode({
  data,
}: {
  data: VerdictNodeData;
}) {
  const content = data.content || data.analysis || "";

  return (
    <BaseDebateNode
      agent="judge"
      title="Final Verdict"
      isStreaming={data.isStreaming}
      isComplete={data.isComplete}
      hasSourceHandle={false}
    >
      <div className="space-y-2">
        {data.winner && (
          <Badge
            variant={
              data.winner === "tie" ? "secondary" : "default"
            }
            className="text-xs"
          >
            Winner: {data.winner === "a" ? "Agent A" : data.winner === "b" ? "Agent B" : "Tie"}
          </Badge>
        )}
        <div className="whitespace-pre-wrap leading-relaxed">
          {content ? (
            <StreamingText
              content={content}
              isStreaming={data.isStreaming}
            />
          ) : (
            data.isStreaming ? "..." : "Waiting..."
          )}
        </div>
      </div>
    </BaseDebateNode>
  );
});
