"use client";

/**
 * ModelSelector Component
 * Dropdown for selecting Ollama models with status indicator
 */

import { useOllamaModels, useOllamaStatus } from "@/hooks/use-ollama-models";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ModelSelector({
  value,
  onChange,
  disabled = false,
}: ModelSelectorProps) {
  const { data: models, isLoading, error } = useOllamaModels();
  const { data: status } = useOllamaStatus();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="model-select">Ollama Model</Label>
        {status && (
          <Badge
            variant={status.status === "running" ? "default" : "destructive"}
          >
            {status.status === "running" ? "Connected" : "Disconnected"}
          </Badge>
        )}
      </div>

      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="model-select">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          {isLoading && (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              Loading models...
            </div>
          )}

          {error && (
            <div className="px-2 py-1.5 text-sm text-destructive">
              Failed to load models: {error.message}
            </div>
          )}

          {models && models.length === 0 && (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              No models available
            </div>
          )}

          {models?.map((model) => (
            <SelectItem key={model.name} value={model.name}>
              <div className="flex flex-col">
                <span className="font-medium">{model.name}</span>
                <span className="text-xs text-muted-foreground">
                  {model.size} · {model.quantization}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
