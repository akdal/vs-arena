"use client";

/**
 * Character Showcase Page
 * Gallery view of all agents with search and filters
 */

import { useState } from "react";
import { useAgents } from "@/hooks/use-agents";
import { AgentCard } from "@/components/agent/agent-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function ShowcasePage() {
  const { data: agents, isLoading, error } = useAgents();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "model" | "date">("date");

  // Filter and sort agents
  const filteredAgents = agents
    ?.filter((agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "model":
          return a.model.localeCompare(b.model);
        case "date":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Character Showcase</h1>
        <p className="text-muted-foreground">
          Browse and explore all debate agents
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
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
          <Select value={sortBy} onValueChange={(val) => setSortBy(val as typeof sortBy)}>
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

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[280px] w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load agents: {error.message}</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredAgents?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery ? "No agents match your search" : "No agents available"}
          </p>
        </div>
      )}

      {/* Agent Gallery */}
      {!isLoading && !error && filteredAgents && filteredAgents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <AgentCard key={agent.agent_id} agent={agent} />
          ))}
        </div>
      )}

      {/* Results Count */}
      {!isLoading && filteredAgents && filteredAgents.length > 0 && (
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Showing {filteredAgents.length} {filteredAgents.length === 1 ? "agent" : "agents"}
        </div>
      )}
    </div>
  );
}
