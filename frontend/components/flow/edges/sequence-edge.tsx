"use client";

/**
 * Sequence Edge
 * Standard flow edge connecting phases in order
 */

import { memo } from "react";
import { BaseEdge, getSmoothStepPath } from "@xyflow/react";

export const SequenceEdge = memo(function SequenceEdge(props: any) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerEnd,
  } = props;
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{ stroke: "#94a3b8", strokeWidth: 2 }}
    />
  );
});
