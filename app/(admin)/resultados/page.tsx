import { Metadata } from 'next'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ResultadosTable } from '@/components/admin/resultados-table'
import { isSuperAdmin } from '@/lib/auth/roles'

export const metadata: Metadata = { title: 'Resultados' }

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TestResultSummary {
  tests: { name: string; path: string } | null
}

export interface SessionSummary {
  id: string
  admin_id: string
  completed_at: string | null
  batteries: { name: string } | null
  candidates: { nombre: string; rut: string } | null
  test_results: TestResultSummary[]
}

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function getResultados(adminId: string, superAdmin: boolean): Promise<SessionSummary[]> {
  const supabase = await createClient()
  let query = supabase
    .from('evaluation_sessions')
    .select(`
      id, admin_id, completed_at,
      batteries(name),
      candidates(nombre, rut),
      test_results(tests(name, path))
    `)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })

  // Super admin ve todas las evaluaciones; admin normal solo las suyas.
  // RLS también lo aplica a nivel de BD como segunda línea de defensa.
  if (!superAdmin) {
    query = query.eq('admin_id', adminId)
  }

  const { data } = await query
  return (data ?? []) as unknown as SessionSummary[]
}

async function getAdminEmailMap(adminIds: string[]): Promise<Record<string, string>> {
  if (adminIds.length === 0) return {}
  const service = createServiceClient()
  const { data } = await service.auth.admin.listUsers({ perPage: 200 })
  const map: Record<string, string> = {}
  const idSet = new Set(adminIds)
  data.users.forEach((u) => {
    if (idSet.has(u.id)) map[u.id] = u.email ?? u.id
  })
  return map
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ResultadosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const superAdmin = isSuperAdmin(user)
  const sessions = await getResultados(user.id, superAdmin)

  // Mapa de atribución: solo para super_admin (requiere service role)
  let adminEmails: Record<string, string> = {}
  if (superAdmin && sessions.length > 0) {
    const uniqueAdminIds = [...new Set(sessions.map((s) => s.admin_id))]
    adminEmails = await getAdminEmailMap(uniqueAdminIds)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-light text-navy gold-line">Resultados</h1>
        <p className="text-sm text-muted-foreground mt-4">
          {sessions.length === 0
            ? 'No hay evaluaciones completadas todavía.'
            : `${sessions.length} evaluación${sessions.length !== 1 ? 'es' : ''} completada${sessions.length !== 1 ? 's' : ''}${superAdmin ? ' · visión completa' : ''}.`}
        </p>
      </div>

      <ResultadosTable
        sessions={sessions}
        adminEmails={superAdmin ? adminEmails : undefined}
      />
    </div>
  )
}
