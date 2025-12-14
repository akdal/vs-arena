"use client";

/**
 * Base Debate Node Component
 * Shared structure for all debate nodes with agent-specific styling
 */

import { memo, type ReactNode } from "react";
import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";

interface BaseDebateNodeProps {
  agent: "a" | "b" | "judge";
  title: string;
  subtitle?: string;
  children: ReactNode;
  isStreaming?: boolean;
  isComplete?: boolean;
  hasSourceHandle?: boolean;
  hasTargetHandle?: boolean;
  className?: string;
}

const agentStyles = {
  a: {
    border: "border-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    header: "bg-blue-500 text-white",
    accent: "text-blue-500",
  },
  b: {
    border: "border-red-500",
    bg: "bg-red-50 dark:bg-red-950/30",
    header: "bg-red-500 text-white",
    accent: "text-red-500",
  },
  judge: {
    border: "border-purple-500",
    bg: "bg-purple-50 dark:bg-purple-950/30",
    header: "bg-purple-500 text-white",
    accent: "text-purple-500",
  },
};

const streamingStyles = {
  a: "animate-node-glow-blue ring-blue-400",
  b: "animate-node-glow-red ring-red-400",
  judge: "animate-node-glow-purple ring-purple-400",
};

export const BaseDebateNode = memo(function BaseDebateNode({
  agent,
  title,
  subtitle,
  children,
  isStreaming = false,
  isComplete = false,
  hasSourceHandle = true,
  hasTargetHandle = true,
  className,
}: BaseDebateNodeProps) {
  const styles = agentStyles[agent];

  return (
    <div
      className={cn(
        "rounded-lg border-2 shadow-md min-w-[280px] max-w-[400px] bg-background",
        styles.border,
        styles.bg,
        isStreaming && `ring-2 ring-offset-2 ${streamingStyles[agent]}`,
        isComplete && "opacity-90",
        className
      )}
    >
      {/* Header */}
      <div className={cn("px-3 py-2 rounded-t-md", styles.header)}>
        <div className="font-semibold text-sm">{title}</div>
        {subtitle && <div className="text-xs opacity-80">{subtitle}</div>}
      </div>

      {/* Content */}
      <div className="p-3 text-sm max-h-[200px] overflow-y-auto">{children}</div>

      {/* Handles */}
      {hasTargetHandle && (
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-gray-400 !w-3 !h-3"
        />
      )}
      {hasSourceHandle && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-gray-400 !w-3 !h-3"
        />
      )}
    </div>
  );
});
