'use client'

import { useTransition } from 'react'
import { toggleBanAction } from './actions'

interface Props {
  userId: string
  isBanned: boolean
}

export function ToggleBanButton({ userId, isBanned }: Props) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => toggleBanAction(userId, !isBanned))}
      className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 flex-shrink-0"
      style={
        isBanned
          ? {
              borderColor: '#2D9E6B40',
              color: '#2D9E6B',
              background: '#2D9E6B0A',
            }
          : {
              borderColor: 'oklch(0.58 0.22 27 / 0.3)',
              color: 'oklch(0.58 0.22 27)',
              background: 'oklch(0.58 0.22 27 / 0.05)',
            }
      }
    >
      {isPending ? '...' : isBanned ? 'Activar' : 'Desactivar'}
    </button>
  )
}
