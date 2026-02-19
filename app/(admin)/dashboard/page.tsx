import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Plus, ArrowRight, FlaskConical, Users, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Dashboard' }

async function getStats(adminId: string) {
  const supabase = await createClient()

  const [batteriesResult, sessionsResult] = await Promise.all([
    supabase
      .from('batteries')
      .select('id', { count: 'exact', head: true })
      .eq('admin_id', adminId),
    supabase
      .from('evaluation_sessions')
      .select('status')
      .eq('admin_id', adminId),
  ])

  const totalBatteries = batteriesResult.count ?? 0
  const sessions = sessionsResult.data ?? []
  const totalSessions = sessions.length
  const completedSessions = sessions.filter(
    (s: { status: string }) => s.status === 'completed'
  ).length

  return { totalBatteries, totalSessions, completedSessions }
}

interface RecentSession {
  id: string
  token: string
  status: string
  created_at: string
  completed_at: string | null
  batteries: { name: string } | null
  candidates: { nombre: string; rut: string } | null
}

async function getRecentSessions(adminId: string): Promise<RecentSession[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('evaluation_sessions')
    .select(`
      id, token, status, created_at, completed_at,
      batteries(name),
      candidates(nombre, rut)
    `)
    .eq('admin_id', adminId)
    .order('created_at', { ascending: false })
    .limit(5)

  return (data ?? []) as unknown as RecentSession[]
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [stats, recentSessions] = await Promise.all([
    getStats(user.id),
    getRecentSessions(user.id),
  ])

  const statCards = [
    {
      label: 'Baterías creadas',
      value: stats.totalBatteries,
      icon: FlaskConical,
      href: '/baterias',
    },
    {
      label: 'Evaluaciones totales',
      value: stats.totalSessions,
      icon: Users,
      href: '/resultados',
    },
    {
      label: 'Evaluaciones completadas',
      value: stats.completedSessions,
      icon: CheckCircle,
      href: '/resultados',
    },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Encabezado */}
      <div>
        <h1 className="text-4xl font-light text-navy gold-line">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-4">
          Resumen general de tu plataforma de evaluación.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="group bg-white border border-border/50 rounded-lg p-6 hover:border-accent/40 hover:shadow-sm transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-9 h-9 rounded-md flex items-center justify-center"
                style={{ background: 'oklch(0.20 0.06 268 / 0.08)' }}
              >
                <Icon className="w-4 h-4 text-navy" />
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p
              className="text-3xl font-light mb-1"
              style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--navy)' }}
            >
              {value}
            </p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </Link>
        ))}
      </div>

      {/* Acciones rápidas */}
      <div className="flex gap-3">
        <Button asChild style={{ background: 'var(--navy)', color: 'var(--cream)' }}>
          <Link href="/baterias/nueva">
            <Plus className="w-4 h-4 mr-2" />
            Nueva batería
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/resultados">Ver resultados</Link>
        </Button>
      </div>

      {/* Sesiones recientes */}
      {recentSessions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-navy">Actividad reciente</h2>
            <Link href="/resultados" className="text-xs text-accent hover:underline">
              Ver todas →
            </Link>
          </div>
          <div className="bg-white border border-border/50 rounded-lg overflow-hidden">
            {recentSessions.map((session, i) => {
              const candidate = Array.isArray(session.candidates)
                ? session.candidates[0]
                : session.candidates
              const battery = Array.isArray(session.batteries)
                ? session.batteries[0]
                : session.batteries

              return (
                <div
                  key={session.id}
                  className={`flex items-center justify-between px-5 py-3.5 ${
                    i < recentSessions.length - 1 ? 'border-b border-border/40' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background:
                          session.status === 'completed'
                            ? '#2D9E6B'
                            : session.status === 'in_progress'
                              ? 'var(--gold)'
                              : 'oklch(0.70 0 0)',
                      }}
                    />
                    <div>
                      <p className="text-sm font-medium">
                        {candidate?.nombre ?? 'Sin candidato'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {battery?.name ?? 'Batería eliminada'} ·{' '}
                        {candidate?.rut ?? '—'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={
                        session.status === 'completed'
                          ? { background: '#2D9E6B1A', color: '#2D9E6B' }
                          : session.status === 'in_progress'
                            ? { background: 'oklch(0.72 0.12 68 / 0.12)', color: 'var(--gold)' }
                            : { background: 'oklch(0.92 0 0)', color: 'oklch(0.50 0 0)' }
                      }
                    >
                      {session.status === 'completed'
                        ? 'Completada'
                        : session.status === 'in_progress'
                          ? 'En curso'
                          : 'Pendiente'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
