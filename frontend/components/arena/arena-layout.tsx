"use client";

import { memo, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ArenaLayoutProps {
  header: ReactNode;
  turnIndicator: ReactNode;
  mainContent: ReactNode;
  sidePanel: ReactNode;
  className?: string;
}

export const ArenaLayout = memo(function ArenaLayout({
  header,
  turnIndicator,
  mainContent,
  sidePanel,
  className,
}: ArenaLayoutProps) {
  return (
    <div className={cn("flex flex-col h-full space-y-4", className)}>
      {/* Header */}
      {header}

      {/* Turn Indicator */}
      {turnIndicator}

      {/* Main Content + Side Panel */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Main Content Area */}
        <div className="flex-1 min-w-0">{mainContent}</div>

        {/* Side Panel */}
        {sidePanel}
      </div>
    </div>
  );
});
