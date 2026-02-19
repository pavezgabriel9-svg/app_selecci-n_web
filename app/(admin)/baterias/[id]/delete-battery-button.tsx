'use client'

import { useActionState, useTransition } from 'react'
import { deleteBatteryAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Loader2, Trash2 } from 'lucide-react'

interface Props {
  batteryId: string
  batteryName: string
}

export function DeleteBatteryButton({ batteryId, batteryName }: Props) {
  const [isPending, startTransition] = useTransition()
  const boundAction = deleteBatteryAction.bind(null, batteryId)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const confirmed = window.confirm(
      `¿Eliminar la batería "${batteryName}"?\n\nEsta acción eliminará también todas sus evaluaciones pendientes. Los resultados ya guardados en sesiones completadas no se ven afectados.`
    )
    if (!confirmed) return
    startTransition(() => {
      const formData = new FormData(e.currentTarget)
      boundAction(formData)
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        disabled={isPending}
        className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
      >
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Trash2 className="w-3.5 h-3.5" />
        )}
        {isPending ? 'Eliminando…' : 'Eliminar batería'}
      </Button>
    </form>
  )
}
