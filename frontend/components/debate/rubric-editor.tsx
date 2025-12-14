"use client";

/**
 * RubricEditor Component
 * Weight sliders for debate scoring rubric
 */

import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import type { RubricConfig } from "@/lib/types";

interface RubricEditorProps {
  value: RubricConfig;
  onChange: (rubric: RubricConfig) => void;
  disabled?: boolean;
}

const DEFAULT_WEIGHTS = {
  argumentation_weight: 35,
  rebuttal_weight: 30,
  delivery_weight: 20,
  strategy_weight: 15,
};

export function RubricEditor({
  value,
  onChange,
  disabled = false,
}: RubricEditorProps) {
  const currentWeights = {
    argumentation_weight:
      value.argumentation_weight ?? DEFAULT_WEIGHTS.argumentation_weight,
    rebuttal_weight: value.rebuttal_weight ?? DEFAULT_WEIGHTS.rebuttal_weight,
    delivery_weight: value.delivery_weight ?? DEFAULT_WEIGHTS.delivery_weight,
    strategy_weight: value.strategy_weight ?? DEFAULT_WEIGHTS.strategy_weight,
  };

  const totalWeight = Object.values(currentWeights).reduce(
    (sum, weight) => sum + weight,
    0
  );
  const isValidTotal = totalWeight === 100;

  const handleWeightChange = (
    key: keyof RubricConfig,
    newValue: number[]
  ) => {
    onChange({
      ...value,
      [key]: newValue[0],
    });
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="rubric">
        <AccordionTrigger className="text-sm font-medium">
          <div className="flex items-center gap-2">
            <span>Scoring Rubric</span>
            <Badge
              variant={isValidTotal ? "default" : "destructive"}
              className="text-xs"
            >
              Total: {totalWeight}%
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-6 pt-2">
            {!isValidTotal && (
              <p className="text-sm text-amber-600">
                Note: Weights should sum to 100% for best results
              </p>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="argumentation">Argumentation</Label>
                <span className="text-sm font-medium text-muted-foreground">
                  {currentWeights.argumentation_weight}%
                </span>
              </div>
              <Slider
                id="argumentation"
                min={0}
                max={100}
                step={5}
                value={[currentWeights.argumentation_weight]}
                onValueChange={(val) =>
                  handleWeightChange("argumentation_weight", val)
                }
                disabled={disabled}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="rebuttal">Rebuttal</Label>
                <span className="text-sm font-medium text-muted-foreground">
                  {currentWeights.rebuttal_weight}%
                </span>
              </div>
              <Slider
                id="rebuttal"
                min={0}
                max={100}
                step={5}
                value={[currentWeights.rebuttal_weight]}
                onValueChange={(val) =>
                  handleWeightChange("rebuttal_weight", val)
                }
                disabled={disabled}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="delivery">Delivery</Label>
                <span className="text-sm font-medium text-muted-foreground">
                  {currentWeights.delivery_weight}%
                </span>
              </div>
              <Slider
                id="delivery"
                min={0}
                max={100}
                step={5}
                value={[currentWeights.delivery_weight]}
                onValueChange={(val) =>
                  handleWeightChange("delivery_weight", val)
                }
                disabled={disabled}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="strategy">Strategy</Label>
                <span className="text-sm font-medium text-muted-foreground">
                  {currentWeights.strategy_weight}%
                </span>
              </div>
              <Slider
                id="strategy"
                min={0}
                max={100}
                step={5}
                value={[currentWeights.strategy_weight]}
                onValueChange={(val) =>
                  handleWeightChange("strategy_weight", val)
                }
                disabled={disabled}
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
