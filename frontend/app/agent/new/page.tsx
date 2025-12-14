'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"

export default function NewAgentPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New Agent</h1>
        <p className="text-muted-foreground">
          Configure your AI debate agent
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Configuration</CardTitle>
          <CardDescription>
            Set up your agent's model, persona, and parameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            {/* Agent Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Agent Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Logical Analyst"
              />
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <select
                id="model"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              >
                <option>Select Ollama model...</option>
                <option>llama3</option>
                <option>qwen2.5</option>
              </select>
            </div>

            {/* Persona */}
            <div className="space-y-2">
              <Label htmlFor="persona">Persona (JSON)</Label>
              <Textarea
                id="persona"
                rows={10}
                placeholder='{&#10;  "tone": "formal",&#10;  "values": ["logic", "evidence"],&#10;  "thinking_style": "analytical"&#10;}'
                className="font-mono text-sm"
              />
            </div>

            {/* LLM Parameters */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  defaultValue="0.7"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxTokens">Max Tokens</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  defaultValue="1024"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button type="submit">
                Create Agent
              </Button>
              <Button variant="outline" asChild>
                <Link href="/agent">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
