import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VS Arena - AI Debate Platform',
  description: 'AI Agent debate platform with structured argumentation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
          <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-950/80">
            <nav className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  VS Arena
                </h1>
                <div className="flex gap-6">
                  <a href="/agent" className="text-sm font-medium hover:text-blue-600 transition-colors">
                    Agents
                  </a>
                  <a href="/debate" className="text-sm font-medium hover:text-blue-600 transition-colors">
                    Debate
                  </a>
                </div>
              </div>
            </nav>
          </header>
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
