"use client";

/**
 * Character Showcase Page
 * Gallery view of all agents with search, filters, and detail drawer
 */

import { useState } from "react";
import { useAgents } from "@/hooks/use-agents";
import { AgentGalleryCard } from "@/components/agent/agent-gallery-card";
import { AgentDetailDrawer } from "@/components/agent/agent-detail-drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { Agent } from "@/lib/types";

export default function ShowcasePage() {
  const { data: agents, isLoading, error } = useAgents();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "model" | "date">("date");
  const [modelFilter, setModelFilter] = useState<string | null>(null);

  // Drawer state
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Get unique models for filter badges
  const models = [...new Set(agents?.map((a) => a.model) || [])].sort();

  // Filter and sort agents
  const filteredAgents = agents
    ?.filter((agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((agent) => (modelFilter ? agent.model === modelFilter : true))
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "model":
          return a.model.localeCompare(b.model);
        case "date":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        default:
          return 0;
      }
    });

  // Handle card click
  const handleCardClick = (agent: Agent) => {
    setSelectedAgent(agent);
    setDrawerOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Character Showcase</h1>
        <p className="text-muted-foreground">
          Browse and explore all debate agents
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 mb-8">
        {/* Search and Sort Row */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="search" className="sr-only">
              Search agents
            </Label>
            <Input
              id="search"
              type="search"
              placeholder="Search agents by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <Label htmlFor="sort" className="sr-only">
              Sort by
            </Label>
            <Select
              value={sortBy}
              onValueChange={(val) => setSortBy(val as typeof sortBy)}
            >
              <SelectTrigger id="sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Most Recent</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="model">Model</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Model Filter Badges */}
        {models.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant={modelFilter === null ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/90"
              onClick={() => setModelFilter(null)}
            >
              All
            </Badge>
            {models.map((model) => (
              <Badge
                key={model}
                variant={modelFilter === model ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/90"
                onClick={() => setModelFilter(model)}
              >
                {model}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[160px] w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-destructive">
            Failed to load agents: {error.message}
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredAgents?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery || modelFilter
              ? "No agents match your filters"
              : "No agents available"}
          </p>
        </div>
      )}

      {/* Agent Gallery */}
      {!isLoading && !error && filteredAgents && filteredAgents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <AgentGalleryCard
              key={agent.agent_id}
              agent={agent}
              onClick={() => handleCardClick(agent)}
            />
          ))}
        </div>
      )}

      {/* Results Count */}
      {!isLoading && filteredAgents && filteredAgents.length > 0 && (
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Showing {filteredAgents.length}{" "}
          {filteredAgents.length === 1 ? "agent" : "agents"}
          {modelFilter && ` using ${modelFilter}`}
        </div>
      )}

      {/* Agent Detail Drawer */}
      <AgentDetailDrawer
        agent={selectedAgent}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
