'use client'

import { useActionState } from 'react'
import { createAdminAction } from './actions'
import type { CreateAdminState } from './actions'

const initialState: CreateAdminState = null

export function CreateAdminForm() {
  const [state, action, isPending] = useActionState(createAdminAction, initialState)

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground/70" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="admin@empresa.com"
          className="w-full px-3 py-2 text-sm rounded-lg border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-accent/30 transition-shadow"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground/70" htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número"
          className="w-full px-3 py-2 text-sm rounded-lg border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-accent/30 transition-shadow"
        />
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Mínimo 8 caracteres · al menos 1 mayúscula · al menos 1 número
        </p>
      </div>

      {state && 'error' in state && (
        <p className="text-xs text-destructive bg-destructive/5 px-3 py-2 rounded-lg">
          {state.error}
        </p>
      )}

      {state && 'success' in state && (
        <p
          className="text-xs px-3 py-2 rounded-lg"
          style={{ background: '#2D9E6B1A', color: '#2D9E6B' }}
        >
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2 px-4 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50"
        style={{ background: 'var(--navy)', color: 'var(--cream)' }}
      >
        {isPending ? 'Creando...' : 'Crear admin'}
      </button>
    </form>
  )
}
