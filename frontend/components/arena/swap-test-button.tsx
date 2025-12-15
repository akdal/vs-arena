"use client";

/**
 * SwapTestButton Component
 * Creates a swap test from a completed run to detect position bias
 */

import { Button } from "@/components/ui/button";
import { ArrowLeftRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCreateSwapTest } from "@/hooks/use-debate";
import { toast } from "sonner";

interface SwapTestButtonProps {
  runId: string;
  isCompleted: boolean;
}

export function SwapTestButton({ runId, isCompleted }: SwapTestButtonProps) {
  const router = useRouter();
  const swapMutation = useCreateSwapTest();

  const handleSwapTest = () => {
    swapMutation.mutate(runId, {
      onSuccess: (response) => {
        toast.success("Swap test created! Starting debate...");
        router.push(`/debate/arena/${response.run_id}?original=${runId}`);
      },
      onError: (error) => {
        toast.error(`Failed to create swap test: ${error.message}`);
      },
    });
  };

  if (!isCompleted) return null;

  return (
    <Button
      onClick={handleSwapTest}
      disabled={swapMutation.isPending}
      variant="outline"
      size="sm"
    >
      <ArrowLeftRight className="mr-2 h-4 w-4" />
      {swapMutation.isPending ? "Creating..." : "Swap Test"}
    </Button>
  );
}
