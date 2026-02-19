import { createServiceClient } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ token: string }>
}

interface SessionWithCandidate {
  id: string
  candidates: { nombre: string } | { nombre: string }[] | null
}

export default async function GraciasPage({ params }: Props) {
  const { token } = await params
  const supabase = createServiceClient()

  const { data: session } = await supabase
    .from('evaluation_sessions')
    .select('id, candidates(nombre)')
    .eq('token', token)
    .single()

  const raw = session as unknown as SessionWithCandidate | null
  const candidate = raw
    ? Array.isArray(raw.candidates)
      ? raw.candidates[0]
      : raw.candidates
    : null

  const firstName = candidate?.nombre?.split(' ')[0]

  return (
    <div className="text-center space-y-10 py-12">
      {/* Icon */}
      <div
        className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
        style={{ background: 'oklch(0.20 0.06 268 / 0.07)' }}
      >
        <svg
          className="w-7 h-7"
          style={{ color: 'var(--gold)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.75l6 6 9-13.5"
          />
        </svg>
      </div>

      {/* Message */}
      <div className="space-y-3">
        <h1 className="text-3xl font-light" style={{ color: 'var(--navy)' }}>
          {firstName ? `Gracias, ${firstName}` : 'Evaluación completada'}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
          Has completado satisfactoriamente la evaluación. Tus resultados han
          sido registrados y serán revisados por el equipo evaluador.
        </p>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 max-w-[200px] mx-auto">
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: 'var(--gold)' }}
        />
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>

      <p className="text-[11px] text-muted-foreground/50">
        Puede cerrar esta ventana.
      </p>
    </div>
  )
}
