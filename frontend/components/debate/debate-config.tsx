"use client";

/**
 * DebateConfig Component
 * Configuration for debate rounds and token limits
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { DebateConfig as DebateConfigType } from "@/lib/types";

interface DebateConfigProps {
  value: DebateConfigType;
  onChange: (config: DebateConfigType) => void;
  disabled?: boolean;
}

export function DebateConfig({
  value,
  onChange,
  disabled = false,
}: DebateConfigProps) {
  const handleRoundsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rounds = parseInt(e.target.value) || undefined;
    onChange({ ...value, rounds });
  };

  const handleMaxTokensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const max_tokens_per_turn = parseInt(e.target.value) || undefined;
    onChange({ ...value, max_tokens_per_turn });
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="config">
        <AccordionTrigger className="text-sm font-medium">
          Advanced Configuration
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="rounds">Rounds</Label>
              <Input
                id="rounds"
                type="number"
                min="1"
                max="10"
                placeholder="3 (default)"
                value={value.rounds ?? ""}
                onChange={handleRoundsChange}
                disabled={disabled}
              />
              <p className="text-xs text-muted-foreground">
                Number of debate rounds (default: 3)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-tokens">Max Tokens per Turn</Label>
              <Input
                id="max-tokens"
                type="number"
                min="128"
                max="4096"
                placeholder="1024 (default)"
                value={value.max_tokens_per_turn ?? ""}
                onChange={handleMaxTokensChange}
                disabled={disabled}
              />
              <p className="text-xs text-muted-foreground">
                Maximum tokens per agent turn (default: 1024)
              </p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
