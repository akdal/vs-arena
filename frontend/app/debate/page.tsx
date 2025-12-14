'use client'

export default function DebateSetupPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Setup Debate</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Configure and start a new debate session
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8">
        <form className="space-y-8">
          {/* Topic */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Debate Topic
            </label>
            <input
              type="text"
              placeholder="e.g., AI development should be paused"
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
            />
          </div>

          {/* Agent Selection */}
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-blue-600">
                Agent A (Debater)
              </label>
              <select className="w-full px-4 py-2 rounded-lg border border-blue-300 bg-white dark:bg-slate-950">
                <option>Select agent...</option>
              </select>
              <input
                type="text"
                placeholder="Position A"
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 mt-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-red-600">
                Agent B (Debater)
              </label>
              <select className="w-full px-4 py-2 rounded-lg border border-red-300 bg-white dark:bg-slate-950">
                <option>Select agent...</option>
              </select>
              <input
                type="text"
                placeholder="Position B"
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 mt-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-purple-600">
                Judge
              </label>
              <select className="w-full px-4 py-2 rounded-lg border border-purple-300 bg-white dark:bg-slate-950">
                <option>Select judge...</option>
              </select>
            </div>
          </div>

          {/* Configuration */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Debate Configuration</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Rounds
                </label>
                <input
                  type="number"
                  defaultValue="3"
                  min="1"
                  max="5"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Max Tokens per Turn
                </label>
                <input
                  type="number"
                  defaultValue="1024"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>
            </div>
          </div>

          {/* Rubric Weights */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Judging Criteria Weights (%)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Argumentation</label>
                <input type="number" defaultValue="35" className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Rebuttal</label>
                <input type="number" defaultValue="30" className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Delivery</label>
                <input type="number" defaultValue="20" className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Strategy</label>
                <input type="number" defaultValue="15" className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
            </div>
          </div>

          {/* Start Button */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium text-lg shadow-lg"
            >
              Start Debate ⚔️
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
