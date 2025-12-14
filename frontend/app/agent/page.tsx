export default function AgentListPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Agent Management</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Create and manage your debate agents
          </p>
        </div>
        <a
          href="/agent/new"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + New Agent
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Placeholder for agent cards */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-slate-500">
          No agents yet. Create your first agent!
        </div>
      </div>
    </div>
  )
}
