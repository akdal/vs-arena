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
    <div className={cn("flex flex-col h-full space-y-4 px-4 md:px-0", className)}>
      {/* Header */}
      {header}

      {/* Turn Indicator */}
      {turnIndicator}

      {/* Main Content + Side Panel */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* Main Content Area */}
        <div className="flex-1 min-w-0 min-h-[400px] lg:min-h-0">{mainContent}</div>

        {/* Side Panel - Full width on mobile, fixed width on desktop */}
        <div className="lg:w-auto">{sidePanel}</div>
      </div>
    </div>
  );
});
