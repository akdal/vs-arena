"use client";

/**
 * PositionSelector Component
 * FOR/AGAINST position selector with visual distinction
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface PositionSelectorProps {
  value: "FOR" | "AGAINST" | "";
  onChange: (value: "FOR" | "AGAINST") => void;
  label: string;
  disabled?: boolean;
}

export function PositionSelector({
  value,
  onChange,
  label,
  disabled = false,
}: PositionSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`position-select-${label}`}>{label}</Label>

      <Select
        value={value}
        onValueChange={(val) => onChange(val as "FOR" | "AGAINST")}
        disabled={disabled}
      >
        <SelectTrigger id={`position-select-${label}`}>
          <SelectValue placeholder="Select position" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="FOR">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="font-medium text-blue-600">FOR</span>
            </div>
          </SelectItem>
          <SelectItem value="AGAINST">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="font-medium text-red-600">AGAINST</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
