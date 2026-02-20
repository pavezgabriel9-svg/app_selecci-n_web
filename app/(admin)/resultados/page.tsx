import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ResultadosTable } from '@/components/admin/resultados-table'

export const metadata: Metadata = { title: 'Resultados' }

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TestResultSummary {
  tests: { name: string; path: string } | null
}

export interface SessionSummary {
  id: string
  completed_at: string | null
  batteries: { name: string } | null
  candidates: { nombre: string; rut: string } | null
  test_results: TestResultSummary[]
}

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function getResultados(adminId: string): Promise<SessionSummary[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('evaluation_sessions')
    .select(`
      id, completed_at,
      batteries(name),
      candidates(nombre, rut),
      test_results(tests(name, path))
    `)
    .eq('admin_id', adminId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })

  return (data ?? []) as unknown as SessionSummary[]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ResultadosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const sessions = await getResultados(user.id)

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-light text-navy gold-line">Resultados</h1>
        <p className="text-sm text-muted-foreground mt-4">
          {sessions.length === 0
            ? 'No hay evaluaciones completadas todavía.'
            : `${sessions.length} evaluación${sessions.length !== 1 ? 'es' : ''} completada${sessions.length !== 1 ? 's' : ''}.`}
        </p>
      </div>

      <ResultadosTable sessions={sessions} />
    </div>
  )
}
