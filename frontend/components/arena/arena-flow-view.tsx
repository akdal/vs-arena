"use client";

/**
 * Arena Flow View
 * Integrates React Flow visualization with Turn Indicator and Action Side Panel
 *
 * IMPORTANT: This component must be wrapped in FlowProvider (ReactFlowProvider)
 * to use useReactFlow hooks. The parent component is responsible for providing this context.
 */

import { useState, useEffect, useRef, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toast } from "sonner";

import { isPermanentError } from "@/lib/error-messages";
import { nodeTypes } from "../flow/nodes";
import { edgeTypes } from "../flow/edges";
import { useDebateFlow } from "@/hooks/use-debate-flow";
import { useKeyboardShortcuts, formatShortcut, type ShortcutConfig } from "@/hooks/use-keyboard-shortcuts";
import { usePersistentToggle } from "@/hooks/use-persistent-state";
import type { RunDetail } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { ConnectionStatus } from "@/components/ui/connection-status";
import { TurnIndicator } from "./turn-indicator";
import { ActionSidePanel } from "./action-side-panel";
import { ArenaLayout } from "./arena-layout";
import { NODE_DIMENSIONS } from "./constants";

export interface ArenaFlowViewProps {
  run: RunDetail;
  autoStart?: boolean;
  header: React.ReactNode;
}

const PANEL_STORAGE_KEY = "arena-panel-open";

/**
 * FlowContent component that uses React Flow hooks
 * Must be rendered within FlowProvider context
 */
function FlowContent({
  run,
  autoStart,
  header,
}: ArenaFlowViewProps) {
  const { fitView, setCenter, getNode } = useReactFlow();
  const prevPhaseRef = useRef<string | null>(null);
  const [isPanelOpen, handlePanelToggle] = usePersistentToggle(PANEL_STORAGE_KEY, true);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const {
    nodes,
    edges,
    currentPhase,
    isStreaming,
    error,
    isReconnecting,
    reconnectAttempts,
    maxReconnectAttempts,
    onNodesChange,
    onEdgesChange,
    startStream,
  } = useDebateFlow({
    run,
    onLayoutChange: () => {
      if (nodes.length <= 1) {
        setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50);
      }
    },
  });

  // Keyboard shortcuts
  const shortcuts = useMemo<ShortcutConfig[]>(() => [
    {
      key: "f",
      action: () => fitView({ padding: 0.2, duration: 300 }),
      description: "Fit view to content",
    },
    {
      key: "Escape",
      action: () => {
        if (showShortcuts) {
          setShowShortcuts(false);
        } else if (isPanelOpen) {
          handlePanelToggle();
        }
      },
      description: "Close panel / Close help",
    },
    {
      key: "?",
      action: () => setShowShortcuts((prev) => !prev),
      description: "Toggle shortcuts help",
    },
    {
      key: "p",
      action: handlePanelToggle,
      description: "Toggle side panel",
    },
  ], [fitView, showShortcuts, isPanelOpen, handlePanelToggle]);

  useKeyboardShortcuts(shortcuts);

  // Start streaming on mount if autoStart is true and run is pending
  useEffect(() => {
    // Only auto-start if run is pending (not already running/completed/failed)
    if (autoStart && run.run_id && run.status === "pending") {
      startStream(run.run_id);
    }
  }, [autoStart, run.run_id, run.status, startStream]);

  // Fit view on initial mount
  useEffect(() => {
    setTimeout(() => fitView({ padding: 0.2 }), 100);
  }, [fitView]);

  // Auto-scroll to current phase when it changes
  useEffect(() => {
    if (currentPhase && currentPhase !== prevPhaseRef.current) {
      prevPhaseRef.current = currentPhase;

      setTimeout(() => {
        const node = getNode(currentPhase);
        if (node) {
          const x = node.position.x + NODE_DIMENSIONS.width / 2;
          const y = node.position.y + NODE_DIMENSIONS.height / 2;
          setCenter(x, y, { duration: 500, zoom: 1 });
        }
      }, 100);
    }
  }, [currentPhase, getNode, setCenter]);

  // Show toast notification for errors
  useEffect(() => {
    if (error) {
      toast.error(error.title, {
        id: "arena-flow-error",
        description: error.description,
        duration: 5000,
        action: error.action === "retry" ? {
          label: "Retry",
          onClick: () => startStream(run.run_id),
        } : undefined,
      });
      // Log original error for debugging (use warn for permanent errors since they're expected)
      if (isPermanentError(error.originalError)) {
        console.warn("Arena flow (permanent):", error.originalError);
      } else {
        console.error("Arena flow error:", error.originalError);
      }
    }
  }, [error, startStream, run.run_id]);

  const formatPhase = (phase: string | null) => {
    if (!phase) return "Waiting...";
    return phase
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <ArenaLayout
      header={header}
      turnIndicator={
        <TurnIndicator
          currentPhase={currentPhase}
          isStreaming={isStreaming}
          run={run}
        />
      }
      mainContent={
        <div className="min-h-[350px] md:min-h-[500px] h-[50vh] md:h-[calc(100vh-400px)] max-h-[800px] w-full rounded-lg border bg-slate-50 dark:bg-slate-900">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            minZoom={0.1}
            maxZoom={2}
          >
            <Background />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                if (node.type === "topic") return "#94a3b8";
                if ("agent" in node.data) {
                  if (node.data.agent === "a") return "hsl(217, 91%, 60%)";
                  if (node.data.agent === "b") return "hsl(0, 84%, 60%)";
                  if (node.data.agent === "judge") return "hsl(271, 91%, 65%)";
                }
                return "#94a3b8";
              }}
              style={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
              }}
            />
            <Panel position="top-right" className="bg-background/95 backdrop-blur rounded-lg border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={isStreaming ? "default" : "secondary"}>
                  {isStreaming ? "Live" : "Ready"}
                </Badge>
                {currentPhase && (
                  <span className="text-sm font-medium">
                    {formatPhase(currentPhase)}
                  </span>
                )}
              </div>
              {error && (
                <div className="text-xs text-destructive">{error.title}</div>
              )}
              <button
                onClick={() => setShowShortcuts(true)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
              >
                Press ? for shortcuts
              </button>
            </Panel>

            {/* Keyboard Shortcuts Help Panel */}
            {showShortcuts && (
              <Panel position="top-center" className="bg-background/95 backdrop-blur rounded-lg border p-4 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Keyboard Shortcuts</h3>
                  <button
                    onClick={() => setShowShortcuts(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-2">
                  {shortcuts.map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between gap-8 text-sm">
                      <span className="text-muted-foreground">{shortcut.description}</span>
                      <kbd className="px-2 py-0.5 bg-muted rounded text-xs font-mono">
                        {formatShortcut(shortcut)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {/* Connection Status */}
            <Panel position="bottom-left">
              <ConnectionStatus
                isConnected={isStreaming}
                isReconnecting={isReconnecting}
                reconnectAttempts={reconnectAttempts}
                maxAttempts={maxReconnectAttempts}
              />
            </Panel>
          </ReactFlow>
        </div>
      }
      sidePanel={
        <ActionSidePanel
          run={run}
          nodes={nodes}
          currentPhase={currentPhase}
          isOpen={isPanelOpen}
          onToggle={handlePanelToggle}
        />
      }
    />
  );
}

export function ArenaFlowView(props: ArenaFlowViewProps) {
  return <FlowContent {...props} />;
}
