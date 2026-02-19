'use client'

import { use } from 'react'
import { useFormStatus } from 'react-dom'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { loginAction } from './actions'
import { AlertCircle, Loader2 } from 'lucide-react'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full h-11 text-sm font-medium tracking-wide"
      style={{ background: 'var(--navy)', color: 'var(--cream)' }}
    >
      {pending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        'Ingresar al panel'
      )}
    </Button>
  )
}

export default function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirect?: string }>
}) {
  const params = use(searchParams)
  const error = params?.error

  return (
    <form action={loginAction} className="space-y-5">
      {error && (
        <div className="flex items-center gap-2.5 text-sm px-4 py-3 rounded-md bg-destructive/8 text-destructive border border-destructive/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
          Correo electrónico
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="admin@empresa.cl"
          className="h-11 bg-white border-border/60 focus:border-accent focus-visible:ring-accent/30"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
          Contraseña
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="h-11 bg-white border-border/60 focus:border-accent focus-visible:ring-accent/30"
        />
      </div>

      <SubmitButton />

      <p className="text-center text-xs text-muted-foreground pt-2">
        Acceso exclusivo para administradores
      </p>
    </form>
  )
}
