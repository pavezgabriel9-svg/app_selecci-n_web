import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Plus, FlaskConical, ArrowRight, Users } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SessionStatus } from '@/types/database'
import { isAdminOrAbove } from '@/lib/auth/roles'

export const metadata: Metadata = { title: 'Baterías' }

interface BatteryWithStats {
  id: string
  name: string
  admin_id: string
  created_at: string
  battery_tests: { test_id: string }[]
  evaluation_sessions: { id: string; status: SessionStatus }[]
}

async function getBatteriesWithStats(adminId: string, superAdmin: boolean): Promise<BatteryWithStats[]> {
  const supabase = await createClient()
  let query = supabase
    .from('batteries')
    .select(`
      id, name, admin_id, created_at,
      battery_tests(test_id),
      evaluation_sessions(id, status)
    `)
    .order('created_at', { ascending: false })

  // Super admin ve todas las baterías; admin normal solo las suyas.
  if (!superAdmin) {
    query = query.eq('admin_id', adminId)
  }

  const { data } = await query
  return (data ?? []) as unknown as BatteryWithStats[]
}

function StatusDot({ status }: { status: SessionStatus }) {
  const colors: Record<SessionStatus, string> = {
    pending: 'oklch(0.70 0 0)',
    in_progress: 'var(--gold)',
    completed: '#2D9E6B',
  }
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full"
      style={{ background: colors[status] }}
    />
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: 'oklch(0.20 0.06 268 / 0.06)' }}
      >
        <FlaskConical className="w-7 h-7 text-navy opacity-40" />
      </div>
      <h3
        className="text-xl font-light mb-2"
        style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--navy)' }}
      >
        Sin baterías aún
      </h3>
      <p className="text-sm text-muted-foreground mb-8 max-w-xs">
        Las baterías agrupan los tests que aplicarás a tus candidatos. Crea la primera para comenzar.
      </p>
      <Button asChild style={{ background: 'var(--navy)', color: 'var(--cream)' }}>
        <Link href="/baterias/nueva">
          <Plus className="w-4 h-4 mr-2" />
          Crear primera batería
        </Link>
      </Button>
    </div>
  )
}

export default async function BateriasPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const superAdmin = isAdminOrAbove(user)
  const batteries = await getBatteriesWithStats(user.id, superAdmin)

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-light text-navy gold-line">Baterías</h1>
          <p className="text-sm text-muted-foreground mt-4">
            {batteries.length === 0
              ? 'No hay baterías creadas todavía.'
              : `${batteries.length} bater${batteries.length === 1 ? 'ía' : 'ías'}${superAdmin ? ' · visión completa' : ' · gestiona tus conjuntos de evaluación'}.`}
          </p>
        </div>
        <Button asChild style={{ background: 'var(--navy)', color: 'var(--cream)' }}>
          <Link href="/baterias/nueva">
            <Plus className="w-4 h-4 mr-2" />
            Nueva batería
          </Link>
        </Button>
      </div>

      {/* Content */}
      {batteries.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {batteries.map((battery) => {
            const testCount = battery.battery_tests.length
            const sessions = battery.evaluation_sessions
            const pending = sessions.filter((s) => s.status === 'pending').length
            const inProgress = sessions.filter((s) => s.status === 'in_progress').length
            const completed = sessions.filter((s) => s.status === 'completed').length

            return (
              <Link
                key={battery.id}
                href={`/baterias/${battery.id}`}
                className="group bg-white border border-border/50 rounded-xl p-6 hover:border-accent/40 hover:shadow-md transition-all duration-200 flex flex-col gap-4"
              >
                {/* Title row */}
                <div className="flex items-start justify-between">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'oklch(0.20 0.06 268 / 0.07)' }}
                  >
                    <FlaskConical className="w-4 h-4 text-navy" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all duration-200" />
                </div>

                <div className="flex-1">
                  <h2
                    className="text-lg font-light leading-tight mb-1"
                    style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--navy)' }}
                  >
                    {battery.name}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {testCount} prueba{testCount !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Stats row */}
                <div className="pt-3 border-t border-border/30">
                  {sessions.length === 0 ? (
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-muted-foreground/50" />
                      <span className="text-xs text-muted-foreground/60">Sin evaluaciones</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 flex-wrap">
                      {pending > 0 && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <StatusDot status="pending" />
                          {pending} pendiente{pending !== 1 ? 's' : ''}
                        </span>
                      )}
                      {inProgress > 0 && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <StatusDot status="in_progress" />
                          {inProgress} en curso
                        </span>
                      )}
                      {completed > 0 && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <StatusDot status="completed" />
                          {completed} completada{completed !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
