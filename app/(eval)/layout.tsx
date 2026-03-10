import type { ReactNode } from 'react'

export default function EvalLayout({ children }: { children: ReactNode }) {
  return (
    <div data-theme="evaluation" className="min-h-screen bg-background">
      <header className="px-6 py-5 border-b border-border/40">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <span className="font-display text-base font-light tracking-wide text-navy">
            Evaluación
          </span>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--gold)' }} />
        </div>
      </header>
      <main className="px-6 py-16">
        {children}
      </main>
    </div>
  )
}
