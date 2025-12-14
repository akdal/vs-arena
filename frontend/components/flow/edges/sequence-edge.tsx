"use client";

/**
 * Sequence Edge
 * Standard flow edge connecting phases in order
 */

import { memo } from "react";
import { BaseEdge, getSmoothStepPath, type EdgeProps } from "@xyflow/react";
import type { SequenceEdgeData } from "../utils/flow-types";

export const SequenceEdge = memo(function SequenceEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isActive = (data as SequenceEdgeData | undefined)?.isActive ?? false;

  return (
    <>
      {/* Base edge (always visible) */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: "#94a3b8",
          strokeWidth: 2,
        }}
      />
      {/* Animated overlay when active */}
      {isActive && (
        <BaseEdge
          id={`${id}-animated`}
          path={edgePath}
          style={{
            stroke: "#facc15",
            strokeWidth: 3,
            strokeDasharray: "10,5",
            animation: "edge-flow 1s linear infinite",
          }}
        />
      )}
    </>
  );
});
