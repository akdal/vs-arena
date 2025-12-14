"use client";

import { memo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DebatePhase, RunDetail } from "@/lib/types";
import type { DebateFlowNode } from "@/components/flow/utils/flow-types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreDisplay } from "./score-display";
import { ProgressIndicator } from "./progress-indicator";
import { DebateLog } from "./debate-log";
import { VerdictDisplay } from "./verdict-display";
import { getCompletedPhases } from "../constants";

export interface ActionSidePanelProps {
  run: RunDetail;
  nodes: DebateFlowNode[];
  currentPhase: DebatePhase | null;
  isOpen: boolean;
  onToggle: () => void;
}

export const ActionSidePanel = memo(function ActionSidePanel({
  run,
  nodes,
  currentPhase,
  isOpen,
  onToggle,
}: ActionSidePanelProps) {
  const completedPhases = getCompletedPhases(currentPhase);

  return (
    <div className="relative flex">
      {/* Toggle Button */}
      <div className="flex items-start pt-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8"
          title={isOpen ? "Close panel" : "Open panel"}
        >
          {isOpen ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Panel Content */}
      <div
        className={cn(
          "transition-all duration-300 overflow-hidden border-l bg-card",
          isOpen ? "w-80" : "w-0"
        )}
      >
        {isOpen && (
          <div className="p-4 h-full overflow-y-auto">
            <Tabs defaultValue="scores" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="scores" className="text-xs">
                  Scores
                </TabsTrigger>
                <TabsTrigger value="verdict" className="text-xs">
                  Verdict
                </TabsTrigger>
                <TabsTrigger value="progress" className="text-xs">
                  Progress
                </TabsTrigger>
                <TabsTrigger value="log" className="text-xs">
                  Log
                </TabsTrigger>
              </TabsList>

              <TabsContent value="scores" className="mt-4">
                <ScoreDisplay
                  nodes={nodes}
                  agentA={run.agent_a}
                  agentB={run.agent_b}
                />
              </TabsContent>

              <TabsContent value="verdict" className="mt-4">
                <VerdictDisplay
                  nodes={nodes}
                  agentAName={run.agent_a.name}
                  agentBName={run.agent_b.name}
                />
              </TabsContent>

              <TabsContent value="progress" className="mt-4">
                <ProgressIndicator
                  currentPhase={currentPhase}
                  completedPhases={completedPhases}
                />
              </TabsContent>

              <TabsContent value="log" className="mt-4">
                <DebateLog nodes={nodes} currentPhase={currentPhase} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
});
