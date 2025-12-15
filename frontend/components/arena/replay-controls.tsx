"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
} from "lucide-react";
import type { ReplaySpeed } from "@/lib/types";

export interface ReplayControlsProps {
  isPlaying: boolean;
  speed: ReplaySpeed;
  currentPhaseIndex: number;
  totalPhases: number;
  progress: number;
  isComplete: boolean;
  currentPhaseLabel: string;
  onPlayPause: () => void;
  onSpeedChange: (speed: ReplaySpeed) => void;
  onPreviousPhase: () => void;
  onNextPhase: () => void;
  onReset: () => void;
  className?: string;
}

const SPEED_OPTIONS: ReplaySpeed[] = [0.5, 1, 2];

export const ReplayControls = memo(function ReplayControls({
  isPlaying,
  speed,
  currentPhaseIndex,
  totalPhases,
  progress,
  isComplete,
  currentPhaseLabel,
  onPlayPause,
  onSpeedChange,
  onPreviousPhase,
  onNextPhase,
  onReset,
  className,
}: ReplayControlsProps) {
  const phaseNumber = currentPhaseIndex + 1;
  const displayPhase = phaseNumber > 0 ? phaseNumber : 0;

  return (
    <div
      className={cn(
        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        "border rounded-lg shadow-lg p-3 space-y-2",
        className
      )}
    >
      {/* Controls Row */}
      <div className="flex items-center justify-between gap-2">
        {/* Playback Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onPreviousPhase}
            disabled={currentPhaseIndex <= 0 && !isComplete}
            title="Previous phase"
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            variant="default"
            size="icon"
            className="h-9 w-9"
            onClick={onPlayPause}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onNextPhase}
            disabled={currentPhaseIndex >= totalPhases - 1 || isComplete}
            title="Next phase"
          >
            <SkipForward className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onReset}
            title="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-1 border-l pl-2">
          {SPEED_OPTIONS.map((s) => (
            <Button
              key={s}
              variant={speed === s ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "h-7 px-2 text-xs font-medium",
                speed === s && "bg-primary text-primary-foreground"
              )}
              onClick={() => onSpeedChange(s)}
            >
              {s}x
            </Button>
          ))}
        </div>
      </div>

      {/* Progress Row */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium truncate max-w-[180px]">
            {isComplete ? "Complete" : currentPhaseLabel}
          </span>
          <span>
            {displayPhase} / {totalPhases}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
});
