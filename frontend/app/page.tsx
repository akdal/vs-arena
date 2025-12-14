export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center space-y-6 py-20">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Welcome to VS Arena
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          AI-powered debate platform with structured argumentation
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <a 
            href="/agent" 
            className="group p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-slate-200 dark:border-slate-800"
          >
            <div className="text-4xl mb-4">🤖</div>
            <h2 className="text-2xl font-bold mb-2 group-hover:text-blue-600 transition-colors">
              Manage Agents
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Create and configure AI debate agents with custom personas
            </p>
          </a>
          
          <a 
            href="/debate" 
            className="group p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-slate-200 dark:border-slate-800"
          >
            <div className="text-4xl mb-4">⚔️</div>
            <h2 className="text-2xl font-bold mb-2 group-hover:text-purple-600 transition-colors">
              Start Debate
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Launch structured debates with real-time visualization
            </p>
          </a>
        </div>
        
        <div className="mt-16 p-6 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Powered by BP Lite Rules
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            British Parliamentary debate format with Opening → Rebuttal → Summary phases
          </p>
        </div>
      </div>
    </div>
  )
}
