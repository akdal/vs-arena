"use client";

/**
 * Connection Status Indicator
 * Shows real-time connection state with reconnection progress
 */

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectionStatusProps {
  /** Whether the stream is currently connected and receiving data */
  isConnected: boolean;
  /** Whether a reconnection attempt is in progress */
  isReconnecting: boolean;
  /** Current reconnection attempt number */
  reconnectAttempts: number;
  /** Maximum number of reconnection attempts */
  maxAttempts: number;
  /** Optional additional CSS classes */
  className?: string;
}

export function ConnectionStatus({
  isConnected,
  isReconnecting,
  reconnectAttempts,
  maxAttempts,
  className,
}: ConnectionStatusProps) {
  // Only show when actively reconnecting
  // Don't show "Disconnected" when stream hasn't started or completed normally
  if (!isReconnecting) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full px-3 py-1.5",
        "bg-background/90 backdrop-blur-sm border shadow-sm",
        "text-sm font-medium",
        "animate-in fade-in slide-in-from-top-2 duration-200",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
      <span className="text-yellow-600 dark:text-yellow-400">
        Reconnecting ({reconnectAttempts}/{maxAttempts})...
      </span>
    </div>
  );
}

/**
 * Streaming indicator for active data flow
 *
 * Shows a pulsing indicator when streaming is active, with optional phase name.
 * Exported for use in views that need to show streaming state separately from
 * connection status (e.g., text view, replay controls).
 *
 * @example
 * ```tsx
 * <StreamingIndicator
 *   isStreaming={isStreaming}
 *   currentPhase={currentPhase}
 *   className="fixed bottom-4 right-4"
 * />
 * ```
 */
interface StreamingIndicatorProps {
  /** Whether streaming is active */
  isStreaming: boolean;
  /** Current phase name (optional) */
  currentPhase?: string | null;
  /** Optional additional CSS classes */
  className?: string;
}

export function StreamingIndicator({
  isStreaming,
  currentPhase,
  className,
}: StreamingIndicatorProps) {
  if (!isStreaming) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full px-3 py-1.5",
        "bg-background/90 backdrop-blur-sm border shadow-sm",
        "text-sm font-medium",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </span>
      <span className="text-muted-foreground">
        {currentPhase ? `Streaming: ${formatPhaseName(currentPhase)}` : "Streaming..."}
      </span>
    </div>
  );
}

/**
 * Format phase name for display (e.g., "opening_a" -> "Opening A")
 */
function formatPhaseName(phase: string): string {
  return phase
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
