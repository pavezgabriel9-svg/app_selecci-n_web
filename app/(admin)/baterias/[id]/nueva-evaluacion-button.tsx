'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createEvaluationAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, Copy, Check, ExternalLink, X } from 'lucide-react'

interface Props {
  batteryId: string
}

export function NuevaEvaluacionButton({ batteryId }: Props) {
  const router = useRouter()
  const [origin, setOrigin] = useState('')
  const [copiedInline, setCopiedInline] = useState(false)

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const boundAction = createEvaluationAction.bind(null, batteryId)
  const [state, formAction, isPending] = useActionState(boundAction, null)

  // Refresh server component list after successful creation
  useEffect(() => {
    if (state && 'token' in state) {
      router.refresh()
    }
  }, [state, router])

  const token = state && 'token' in state ? state.token : null
  const error = state && 'error' in state ? state.error : null
  const evalUrl = token ? `${origin}/eval/${token}` : null

  const copyUrl = async () => {
    if (!evalUrl) return
    await navigator.clipboard.writeText(evalUrl)
    setCopiedInline(true)
    setTimeout(() => setCopiedInline(false), 2500)
  }

  return (
    <div className="space-y-4">
      <form action={formAction}>
        <Button
          type="submit"
          disabled={isPending}
          style={{ background: 'var(--navy)', color: 'var(--cream)' }}
          className="w-full sm:w-auto gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generando enlace…
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Nueva evaluación
            </>
          )}
        </Button>
      </form>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {/* Link card */}
      {evalUrl && (
        <div
          className="rounded-xl border p-5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300"
          style={{
            borderColor: 'oklch(0.72 0.12 68 / 0.35)',
            background: 'oklch(0.72 0.12 68 / 0.04)',
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold" style={{ color: 'oklch(0.55 0.10 68)' }}>
                Enlace generado
              </p>
              <p className="text-xs text-muted-foreground">
                Comparte este enlace con el candidato. Está listo para usarse.
              </p>
            </div>
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
              style={{ background: 'oklch(0.72 0.12 68 / 0.15)', color: 'oklch(0.55 0.10 68)' }}
            >
              Pendiente
            </span>
          </div>

          <div
            className="flex items-center gap-2 rounded-lg border px-3 py-2.5"
            style={{
              borderColor: 'oklch(0.72 0.12 68 / 0.25)',
              background: 'white',
            }}
          >
            <code className="flex-1 text-xs text-navy truncate font-mono">
              {evalUrl}
            </code>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={copyUrl}
                title="Copiar enlace"
              >
                {copiedInline ? (
                  <Check className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </Button>
              <a
                href={evalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-accent/50 transition-colors"
                title="Abrir en nueva pestaña"
              >
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
