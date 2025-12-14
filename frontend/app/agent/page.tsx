import Link from "next/link";
import { AgentList } from "@/components/agent/agent-list";
import { Button } from "@/components/ui/button";

export default function AgentListPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Agent Management</h1>
          <p className="text-muted-foreground">
            Create and manage your debate agents
          </p>
        </div>
        <Button asChild>
          <Link href="/agent/new">+ New Agent</Link>
        </Button>
      </div>

      <AgentList />
    </div>
  );
}
