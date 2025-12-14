"use client";

/**
 * Target Edge
 * Dashed edge showing rebuttal target connections
 */

import { memo } from "react";
import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";

export const TargetEdge = memo(function TargetEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
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
      style={{
        stroke: "#f97316",
        strokeWidth: 2,
        strokeDasharray: "5,5",
      }}
    />
  );
});
