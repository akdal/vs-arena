"use client";

/**
 * ParamsEditor Component
 * Editor for LLM parameters (temperature, max_tokens, top_p)
 */

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

interface ParamsEditorProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  disabled?: boolean;
}

export function ParamsEditor({
  value,
  onChange,
  disabled = false,
}: ParamsEditorProps) {
  const temperature = (value.temperature as number) ?? 0.7;
  const maxTokens = (value.max_tokens as number) ?? 1024;
  const topP = (value.top_p as number) ?? 0.9;

  const updateParam = (key: string, newValue: number) => {
    onChange({
      ...value,
      [key]: newValue,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="temperature-slider">Temperature</Label>
          <span className="text-sm text-muted-foreground font-mono">
            {temperature.toFixed(2)}
          </span>
        </div>
        <Slider
          id="temperature-slider"
          min={0}
          max={2}
          step={0.1}
          value={[temperature]}
          onValueChange={([val]) => updateParam("temperature", val)}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Controls randomness: Lower is more focused, higher is more creative
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="max-tokens-input">Max Tokens</Label>
          <span className="text-sm text-muted-foreground font-mono">
            {maxTokens}
          </span>
        </div>
        <Input
          id="max-tokens-input"
          type="number"
          min={1}
          max={4096}
          step={1}
          value={maxTokens}
          onChange={(e) => updateParam("max_tokens", parseInt(e.target.value, 10))}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Maximum number of tokens to generate in the response
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="top-p-slider">Top P</Label>
          <span className="text-sm text-muted-foreground font-mono">
            {topP.toFixed(2)}
          </span>
        </div>
        <Slider
          id="top-p-slider"
          min={0}
          max={1}
          step={0.05}
          value={[topP]}
          onValueChange={([val]) => updateParam("top_p", val)}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Nucleus sampling: Lower values make output more deterministic
        </p>
      </div>
    </div>
  );
}
