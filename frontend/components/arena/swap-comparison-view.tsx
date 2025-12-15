"use client";

/**
 * SwapComparisonView Component
 * Displays comparison between original and swapped runs with bias analysis
 */

import { useSwapComparison } from "@/hooks/use-debate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, HelpCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SwapComparisonViewProps {
  originalRunId: string;
  swapRunId: string;
}

export function SwapComparisonView({
  originalRunId,
  swapRunId,
}: SwapComparisonViewProps) {
  const { data, isLoading, error } = useSwapComparison(
    originalRunId,
    swapRunId
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) return null;

  const biasType = data.analysis.bias_type;
  const hasBias = biasType === "position";
  const isInconclusive = biasType === "inconclusive";

  const getBorderColor = () => {
    if (hasBias) return "border-yellow-500";
    if (isInconclusive) return "border-gray-400";
    return "border-green-500";
  };

  const getIcon = () => {
    if (hasBias) return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    if (isInconclusive) return <HelpCircle className="h-5 w-5 text-gray-400" />;
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  const getBgColor = () => {
    if (hasBias) return "bg-yellow-50 dark:bg-yellow-950/20";
    if (isInconclusive) return "bg-gray-50 dark:bg-gray-800/20";
    return "bg-green-50 dark:bg-green-950/20";
  };

  return (
    <Card className={`${getBorderColor()} border-2`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {getIcon()}
          Swap Test Result
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comparison Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {/* Original Run */}
          <div className="space-y-2">
            <div className="font-semibold text-muted-foreground">Original</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-blue-600 font-medium">A:</span>
                <span>{data.original.agent_a.name}</span>
                <Badge variant="outline" className="text-xs">
                  {data.original.position_a}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-600 font-medium">B:</span>
                <span>{data.original.agent_b.name}</span>
                <Badge variant="outline" className="text-xs">
                  {data.original.position_b}
                </Badge>
              </div>
            </div>
            <Badge
              className={
                data.original.winner === "A"
                  ? "bg-blue-600"
                  : data.original.winner === "B"
                    ? "bg-red-600"
                    : "bg-gray-500"
              }
            >
              Winner: {data.original.winner || "N/A"}
            </Badge>
          </div>

          {/* Swapped Run */}
          <div className="space-y-2">
            <div className="font-semibold text-muted-foreground">Swapped</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-blue-600 font-medium">A:</span>
                <span>{data.swapped.agent_a.name}</span>
                <Badge variant="outline" className="text-xs">
                  {data.swapped.position_a}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-600 font-medium">B:</span>
                <span>{data.swapped.agent_b.name}</span>
                <Badge variant="outline" className="text-xs">
                  {data.swapped.position_b}
                </Badge>
              </div>
            </div>
            <Badge
              className={
                data.swapped.winner === "A"
                  ? "bg-blue-600"
                  : data.swapped.winner === "B"
                    ? "bg-red-600"
                    : "bg-gray-500"
              }
            >
              Winner: {data.swapped.winner || "N/A"}
            </Badge>
          </div>
        </div>

        {/* Analysis */}
        <div className={`p-3 rounded-lg ${getBgColor()}`}>
          <div className="font-semibold">
            {hasBias
              ? `Position Bias Detected: ${data.analysis.biased_toward}`
              : isInconclusive
                ? "Inconclusive"
                : "No Position Bias"}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {data.analysis.description}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
