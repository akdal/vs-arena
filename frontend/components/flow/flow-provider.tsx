"use client";

/**
 * Flow Provider Wrapper
 * Wraps components with ReactFlowProvider
 */

import { ReactFlowProvider } from "@xyflow/react";
import type { ReactNode } from "react";

interface FlowProviderProps {
  children: ReactNode;
}

export function FlowProvider({ children }: FlowProviderProps) {
  return <ReactFlowProvider>{children}</ReactFlowProvider>;
}
