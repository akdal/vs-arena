"use client";

/**
 * Arena Replay View
 * Replays completed debates with playback controls
 *
 * IMPORTANT: This component must be wrapped in FlowProvider (ReactFlowProvider)
 * to use useReactFlow hooks. The parent component is responsible for providing this context.
 */

import { useState, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { nodeTypes } from "../flow/nodes";
import { edgeTypes } from "../flow/edges";
import { useDebateReplay } from "@/hooks/use-debate-replay";
import { usePersistentToggle } from "@/hooks/use-persistent-state";
import type { RunDetail, Turn } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { TurnIndicator } from "./turn-indicator";
import { ActionSidePanel } from "./action-side-panel";
import { ArenaLayout } from "./arena-layout";
import { ReplayControls } from "./replay-controls";
import { ReplayTimeline } from "./replay-timeline";
import { NODE_DIMENSIONS, PHASE_ORDER } from "./constants";
import type { DebatePhase } from "@/lib/types";

export interface ArenaReplayViewProps {
  run: RunDetail;
  turns: Turn[];
  header: React.ReactNode;
  isLive?: boolean;  // When true, auto-follows latest turn without playback controls
}

const PANEL_STORAGE_KEY = "arena-panel-open";

/**
 * ReplayContent component that uses React Flow hooks
 * Must be rendered within FlowProvider context
 */
function ReplayContent({ run, turns, header, isLive = false }: ArenaReplayViewProps) {
  const { fitView, setCenter, getNode } = useReactFlow();
  const prevPhaseRef = useRef<string | null>(null);
  const [isPanelOpen, handlePanelToggle] = usePersistentToggle(PANEL_STORAGE_KEY, true);

  const {
    nodes,
    edges,
    currentPhase,
    currentPhaseIndex,
    totalPhases,
    isPlaying,
    speed,
    progress,
    isComplete,
    currentPhaseLabel,
    onNodesChange,
    onEdgesChange,
    togglePlayPause,
    setSpeed,
    nextPhase,
    previousPhase,
    reset,
    goToPhase,
  } = useDebateReplay({
    run,
    turns,
    onLayoutChange: () => {
      if (nodes.length <= 1) {
        setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50);
      }
    },
  });

  // Get available phases from turns
  const availablePhases = PHASE_ORDER.filter((phase) =>
    turns.some((t) => t.phase === phase)
  ) as DebatePhase[];

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

  // Auto-jump to latest phase when in live mode and turns change
  useEffect(() => {
    if (isLive && turns.length > 0) {
      const lastPhaseIndex = availablePhases.length - 1;
      if (lastPhaseIndex >= 0 && currentPhaseIndex !== lastPhaseIndex) {
        goToPhase(lastPhaseIndex);
      }
    }
  }, [isLive, turns.length, availablePhases.length, currentPhaseIndex, goToPhase]);

  return (
    <ArenaLayout
      header={header}
      turnIndicator={
        <TurnIndicator
          currentPhase={currentPhase}
          isStreaming={isPlaying}
          run={run}
          mode="replay"
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
            <Panel position="top-right">
              <ReplayControls
                isPlaying={isPlaying}
                speed={speed}
                currentPhaseIndex={currentPhaseIndex}
                totalPhases={totalPhases}
                progress={progress}
                isComplete={isComplete}
                currentPhaseLabel={currentPhaseLabel}
                onPlayPause={togglePlayPause}
                onSpeedChange={setSpeed}
                onPreviousPhase={previousPhase}
                onNextPhase={nextPhase}
                onReset={reset}
              />
            </Panel>
            <Panel position="top-left" className="bg-background/95 backdrop-blur rounded-lg border px-3 py-1.5">
              {isLive ? (
                <Badge variant="default" className="bg-green-600 animate-pulse">
                  Live
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-600 border-amber-500">
                  Replay Mode
                </Badge>
              )}
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
          replayTimeline={
            <ReplayTimeline
              phases={availablePhases}
              currentPhaseIndex={currentPhaseIndex}
              isPlaying={isPlaying}
              onPhaseClick={goToPhase}
            />
          }
        />
      }
    />
  );
}

export function ArenaReplayView(props: ArenaReplayViewProps) {
  return <ReplayContent {...props} />;
}
