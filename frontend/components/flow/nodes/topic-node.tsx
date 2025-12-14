"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { TopicNodeData } from "../utils/flow-types";

export const TopicNode = memo(function TopicNode({
  data,
}: {
  data: TopicNodeData;
}) {
  return (
    <div className="rounded-lg border-2 border-slate-300 bg-slate-50 dark:bg-slate-900 shadow-md min-w-[320px] max-w-[400px] p-4">
      <div className="font-semibold text-center mb-2">Debate Topic</div>
      <div className="text-sm text-center leading-relaxed">{data.topic}</div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-gray-400 !w-3 !h-3"
      />
    </div>
  );
});
