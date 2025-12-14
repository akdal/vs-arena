"use client";

import { memo } from "react";
import { BaseDebateNode } from "./base-debate-node";
import { StreamingText } from "./streaming-text";
import type { DebateNodeData } from "../utils/flow-types";
import { Badge } from "@/components/ui/badge";

export const OpeningNode = memo(function OpeningNode({
  data,
}: {
  data: DebateNodeData;
}) {
  return (
    <BaseDebateNode
      agent={data.agent}
      title={`Opening - ${data.agentName}`}
      subtitle={data.position}
      isStreaming={data.isStreaming}
      isComplete={data.isComplete}
    >
      <div className="space-y-2">
        {data.position && (
          <Badge variant="outline" className="text-xs">
            {data.position}
          </Badge>
        )}
        <div className="whitespace-pre-wrap leading-relaxed">
          {data.content ? (
            <StreamingText
              content={data.content}
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
