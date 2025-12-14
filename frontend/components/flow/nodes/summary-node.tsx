"use client";

import { memo } from "react";
import { BaseDebateNode } from "./base-debate-node";
import type { DebateNodeData } from "../utils/flow-types";

export const SummaryNode = memo(function SummaryNode({
  data,
}: {
  data: DebateNodeData;
}) {
  return (
    <BaseDebateNode
      agent={data.agent}
      title={`Summary - ${data.agentName}`}
      isStreaming={data.isStreaming}
      isComplete={data.isComplete}
    >
      <div className="whitespace-pre-wrap leading-relaxed">
        {data.content || (data.isStreaming ? "..." : "Waiting...")}
      </div>
    </BaseDebateNode>
  );
});
