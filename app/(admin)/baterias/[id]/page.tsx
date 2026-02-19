import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, BadgeCheck, Calendar, User } from 'lucide-react'
import { NuevaEvaluacionButton } from './nueva-evaluacion-button'
import { DeleteBatteryButton } from './delete-battery-button'
import { CopyLinkButton } from './copy-link-button'
import { SessionStatus } from '@/types/database'

export const metadata: Metadata = { title: 'Detalle de batería' }

// ─── Types ────────────────────────────────────────────────────────────────────

interface TestInBattery {
  position: number
  tests: {
    id: string
    name: string
    has_practice: boolean
  }
}

interface EvaluationSession {
  id: string
  token: string
  status: SessionStatus
  created_at: string
  started_at: string | null
  completed_at: string | null
  candidates: { nombre: string; rut: string } | null
}

interface BatteryDetail {
  id: string
  name: string
  created_at: string
  battery_tests: TestInBattery[]
}

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function getBatteryDetail(batteryId: string, adminId: string): Promise<BatteryDetail | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('batteries')
    .select(`
      id, name, created_at,
      battery_tests(position, tests(id, name, has_practice))
    `)
    .eq('id', batteryId)
    .eq('admin_id', adminId)
    .single()

  if (!data) return null

  const result = data as unknown as BatteryDetail
  result.battery_tests = [...result.battery_tests].sort((a, b) => a.position - b.position)

  return result
}

async function getEvaluations(batteryId: string, adminId: string): Promise<EvaluationSession[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('evaluation_sessions')
    .select(`
      id, token, status, created_at, started_at, completed_at,
      candidates(nombre, rut)
    `)
    .eq('battery_id', batteryId)
    .eq('admin_id', adminId)
    .order('created_at', { ascending: false })

  return (data ?? []) as unknown as EvaluationSession[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  SessionStatus,
  { label: string; dot: string; bg: string; color: string }
> = {
  pending: {
    label: 'Pendiente',
    dot: 'oklch(0.70 0 0)',
    bg: 'oklch(0.92 0 0)',
    color: 'oklch(0.50 0 0)',
  },
  in_progress: {
    label: 'En curso',
    dot: 'var(--gold)',
    bg: 'oklch(0.72 0.12 68 / 0.12)',
    color: 'var(--gold)',
  },
  completed: {
    label: 'Completada',
    dot: '#2D9E6B',
    bg: '#2D9E6B1A',
    color: '#2D9E6B',
  },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ id: string }>
}

export default async function BateriaDetailPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const [battery, evaluations] = await Promise.all([
    getBatteryDetail(id, user.id),
    getEvaluations(id, user.id),
  ])

  if (!battery) notFound()

  const pendingCount = evaluations.filter((e) => e.status === 'pending').length
  const inProgressCount = evaluations.filter((e) => e.status === 'in_progress').length
  const completedCount = evaluations.filter((e) => e.status === 'completed').length

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/baterias" className="hover:text-navy transition-colors">
          Baterías
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground/70 truncate max-w-[200px]">{battery.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-light text-navy gold-line">{battery.name}</h1>
          <p className="text-xs text-muted-foreground mt-4">
            Creada el {formatDate(battery.created_at)} ·{' '}
            {battery.battery_tests.length} prueba{battery.battery_tests.length !== 1 ? 's' : ''} ·{' '}
            {evaluations.length} evaluación{evaluations.length !== 1 ? 'es' : ''}
          </p>
        </div>
        <DeleteBatteryButton batteryId={battery.id} batteryName={battery.name} />
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Tests column */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-border/50 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border/30">
              <h2 className="text-sm font-semibold text-navy">Pruebas incluidas</h2>
            </div>
            <ol className="divide-y divide-border/30">
              {battery.battery_tests.map((bt, i) => (
                <li key={bt.tests.id} className="flex items-center gap-3 px-5 py-3.5">
                  <span
                    className="text-[11px] font-medium w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'oklch(0.20 0.06 268 / 0.07)',
                      color: 'var(--navy)',
                    }}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {bt.tests.name}
                    </p>
                    {bt.tests.has_practice && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <BadgeCheck className="w-3 h-3" />
                        Con práctica
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Evaluaciones column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Nueva evaluación */}
          <div className="bg-white border border-border/50 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border/30">
              <h2 className="text-sm font-semibold text-navy">Generar evaluación</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cada evaluación genera un enlace único para un candidato.
              </p>
            </div>
            <div className="p-5">
              <NuevaEvaluacionButton batteryId={battery.id} />
            </div>
          </div>

          {/* Evaluations list */}
          <div className="bg-white border border-border/50 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-navy">Historial de evaluaciones</h2>
              {evaluations.length > 0 && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {pendingCount > 0 && <span>{pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}</span>}
                  {inProgressCount > 0 && <span>{inProgressCount} en curso</span>}
                  {completedCount > 0 && <span>{completedCount} completada{completedCount !== 1 ? 's' : ''}</span>}
                </div>
              )}
            </div>

            {evaluations.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  Aún no hay evaluaciones creadas para esta batería.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {evaluations.map((session) => {
                  const cfg = STATUS_CONFIG[session.status]
                  const candidate = Array.isArray(session.candidates)
                    ? session.candidates[0]
                    : session.candidates

                  return (
                    <div key={session.id} className="px-5 py-4 flex items-center gap-4">
                      {/* Status dot */}
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5"
                        style={{ background: cfg.dot }}
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        {candidate ? (
                          <>
                            <p className="text-sm font-medium truncate">{candidate.nombre}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                              <span>{candidate.rut}</span>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {session.completed_at
                                  ? formatDate(session.completed_at)
                                  : session.started_at
                                    ? `Inició ${formatDate(session.started_at)}`
                                    : `Creada ${formatDate(session.created_at)}`}
                              </span>
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-muted-foreground italic">Sin candidato aún</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3" />
                              Creada {formatDate(session.created_at)}
                            </p>
                          </>
                        )}
                      </div>

                      {/* Status badge */}
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {cfg.label}
                      </span>

                      {/* Copy link — only for non-completed */}
                      {session.status !== 'completed' && (
                        <CopyLinkButton token={session.token} />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
