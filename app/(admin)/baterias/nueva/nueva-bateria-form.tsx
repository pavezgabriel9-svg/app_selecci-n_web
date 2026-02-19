'use client'

import { useActionState } from 'react'
import { createBatteryAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, Circle, Loader2, BadgeCheck } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

interface Test {
  id: string
  name: string
  has_practice: boolean
  position: number
}

interface Props {
  tests: Test[]
}

export function NuevaBateriaForm({ tests }: Props) {
  const [state, formAction, isPending] = useActionState(createBatteryAction, null)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <form action={formAction} className="space-y-8">
      {/* Battery name */}
      <div className="bg-white border border-border/50 rounded-xl p-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm font-medium text-navy">
            Nombre de la batería
          </Label>
          <Input
            id="name"
            name="name"
            placeholder="Ej: Evaluación operativa Marzo 2026"
            required
            className="h-11 text-base"
            style={{ borderColor: 'oklch(0.20 0.06 268 / 0.20)' }}
          />
          <p className="text-xs text-muted-foreground">
            Este nombre identifica la batería en el panel y en los reportes.
          </p>
        </div>
      </div>

      {/* Test selection */}
      <div className="bg-white border border-border/50 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border/30">
          <h2 className="text-sm font-semibold text-navy">Pruebas incluidas</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Selecciona las pruebas en el orden que quieres aplicarlas.
          </p>
        </div>

        <div className="divide-y divide-border/30">
          {tests.map((test) => {
            const isSelected = selected.has(test.id)
            return (
              <div
                key={test.id}
                onClick={() => toggle(test.id)}
                className="flex items-center gap-4 px-6 py-4 cursor-pointer transition-colors duration-150"
                style={{
                  background: isSelected ? 'oklch(0.20 0.06 268 / 0.03)' : 'transparent',
                }}
              >
                {/* Hidden input for form submission — only when selected */}
                {isSelected && (
                  <input type="hidden" name="testIds" value={test.id} />
                )}

                {/* Visual toggle icon */}
                <span
                  className="flex-shrink-0 w-5 h-5"
                  aria-hidden="true"
                >
                  {isSelected ? (
                    <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--navy)' }} />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground/40" />
                  )}
                </span>

                {/* Test info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium leading-tight"
                    style={{ color: isSelected ? 'var(--navy)' : 'oklch(0.30 0.03 268)' }}
                  >
                    {test.name}
                  </p>
                  {test.has_practice && (
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" />
                      Incluye fase de práctica
                    </p>
                  )}
                </div>

                {/* Selected indicator */}
                {isSelected && (
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      background: 'oklch(0.20 0.06 268 / 0.08)',
                      color: 'var(--navy)',
                    }}
                  >
                    Incluida
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {selected.size > 0 && (
          <div
            className="px-6 py-3 border-t border-border/30 text-xs text-muted-foreground"
            style={{ background: 'oklch(0.98 0.003 85)' }}
          >
            {selected.size} prueba{selected.size !== 1 ? 's' : ''} seleccionada{selected.size !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Error */}
      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {state.error}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={isPending || selected.size === 0}
          style={{ background: 'var(--navy)', color: 'var(--cream)' }}
          className="min-w-[140px]"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creando…
            </>
          ) : (
            'Crear batería'
          )}
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/baterias">Cancelar</Link>
        </Button>
      </div>
    </form>
  )
}
