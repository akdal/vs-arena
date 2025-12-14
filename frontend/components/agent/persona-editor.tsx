"use client";

/**
 * PersonaEditor Component
 * JSON editor for agent persona configuration
 */

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PersonaEditorProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  disabled?: boolean;
}

export function PersonaEditor({
  value,
  onChange,
  disabled = false,
}: PersonaEditorProps) {
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Initialize from value
  useEffect(() => {
    try {
      setJsonText(JSON.stringify(value, null, 2));
      setError(null);
    } catch {
      setError("Invalid JSON object");
    }
  }, [value]);

  const handleChange = (text: string) => {
    setJsonText(text);

    // Validate and parse JSON
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        setError(null);
        onChange(parsed);
      } else {
        setError("Must be a valid JSON object");
      }
    } catch {
      setError("Invalid JSON syntax");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="persona-editor">
          Persona Configuration
          <span className="ml-2 text-xs text-muted-foreground font-normal">
            (JSON format)
          </span>
        </Label>
        {error && (
          <span className="text-xs text-destructive">{error}</span>
        )}
      </div>

      <Textarea
        id="persona-editor"
        value={jsonText}
        onChange={(e) => handleChange(e.target.value)}
        disabled={disabled}
        className="font-mono text-sm min-h-[150px]"
        placeholder={`{
  "role": "Debater",
  "style": "Analytical",
  "tone": "Professional"
}`}
      />

      <p className="text-xs text-muted-foreground">
        Define the agent's personality, role, speaking style, and other characteristics.
      </p>
    </div>
  );
}
