import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { TestSnapshot } from '@/types/database'
import { IntakeForm } from './intake-form'

interface Props {
  params: Promise<{ token: string }>
}

export default async function EvalIntakePage({ params }: Props) {
  const { token } = await params
  const supabase = createServiceClient()

  const { data: session } = await supabase
    .from('evaluation_sessions')
    .select('id, status, tests_snapshot')
    .eq('token', token)
    .single()

  if (!session) {
    return (
      <EvalMessage
        icon="✕"
        title="Evaluación no encontrada"
        message="Este enlace no existe o ha expirado. Contacta a quien te lo envió."
      />
    )
  }

  if (session.status === 'completed' || session.status === 'in_progress') {
    redirect(`/eval/${token}/hub`)
  }

  const snapshot = session.tests_snapshot as TestSnapshot[]

  return <IntakeForm token={token} totalTests={snapshot.length} />
}

// ─── Local helpers ─────────────────────────────────────────────────────────────

function EvalMessage({
  icon,
  title,
  message,
  variant = 'error',
}: {
  icon: string
  title: string
  message: string
  variant?: 'error' | 'success'
}) {
  const isSuccess = variant === 'success'
  return (
    <div className="text-center space-y-5 py-16">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mx-auto text-lg"
        style={{
          background: isSuccess
            ? 'oklch(0.20 0.06 268 / 0.07)'
            : 'oklch(0.58 0.22 27 / 0.08)',
          color: isSuccess ? 'var(--navy)' : 'oklch(0.58 0.22 27)',
        }}
      >
        {icon}
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-light text-navy">{title}</h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
          {message}
        </p>
      </div>
    </div>
  )
}
