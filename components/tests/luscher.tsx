'use client'

import { useState, useRef } from 'react'
import type { TestComponentProps, LuscherResult } from '@/types/database'

// ─── Constantes hoistadas ─────────────────────────────────────────────────────

const GRISES = [
  { id: 3, color: 'rgb(219,216,195)', border: false },
  { id: 4, color: 'rgb(255,255,255)', border: true  },
  { id: 0, color: 'rgb(197,188,171)', border: false },
  { id: 2, color: 'rgb(34,34,35)',    border: false },
  { id: 1, color: 'rgb(156,148,137)', border: false },
] as const

const COLORES = [
  { id: 5, color: 'rgb(153,0,102)'  },
  { id: 1, color: 'rgb(0,51,102)'   },
  { id: 0, color: 'rgb(128,128,128)'},
  { id: 3, color: 'rgb(204,51,51)'  },
  { id: 4, color: 'rgb(255,204,0)'  },
  { id: 7, color: 'rgb(0,0,0)'      },
  { id: 6, color: 'rgb(102,51,0)'   },
  { id: 2, color: 'rgb(0,102,102)'  },
] as const

// Display order matches original: 4,5,3,0,6,2,1
const FORMAS = [
  { id: 4 }, { id: 5 }, { id: 3 },
  { id: 0 }, { id: 6 }, { id: 2 }, { id: 1 },
] as const

const STEP_LABELS  = ['Grises', 'Colores I', 'Formas', 'Colores II'] as const
const STEP_COUNTS  = [GRISES.length, COLORES.length, FORMAS.length, COLORES.length]

// ─── SVG por ID de forma ──────────────────────────────────────────────────────

function FormaShape({ id }: { id: number }) {
  const svgProps = { fill: 'var(--navy)' as string, width: 52, height: 52 }
  switch (id) {
    case 0: return <svg {...svgProps} viewBox="0 0 56 56"><rect x="22" y="4" width="12" height="48" rx="2" /><rect x="4" y="22" width="48" height="12" rx="2" /></svg>
    case 1: return <svg {...svgProps} viewBox="0 0 56 56"><polygon points="28,4 52,52 4,52" /></svg>
    case 2: return <svg {...svgProps} viewBox="0 0 56 56"><circle cx="28" cy="28" r="24" /></svg>
    case 3: return <svg {...svgProps} viewBox="0 0 56 56"><rect x="6" y="6" width="44" height="44" rx="3" /></svg>
    case 4: return <svg {...svgProps} viewBox="0 0 56 56"><path d="M28 4 C42 4 52 14 52 28 C52 40 44 52 30 52 C18 52 4 44 4 30 C4 16 14 4 28 4Z" /></svg>
    case 5: return <svg {...svgProps} viewBox="0 0 56 56"><polygon points="28,4 52,28 28,52 4,28" /></svg>
    case 6: return <svg {...svgProps} viewBox="0 0 56 56"><path d="M4 36 A24 24 0 0 1 52 36 Z" /><rect x="4" y="36" width="48" height="6" rx="2" /></svg>
    default: return <svg {...svgProps} viewBox="0 0 56 56"><circle cx="28" cy="28" r="20" /></svg>
  }
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function LuscherTest({ onComplete, isPending }: TestComponentProps) {
  const [step, setStep]             = useState(0)
  const [clickedIds, setClickedIds] = useState<number[]>([])
  const [showNext, setShowNext]     = useState(false)

  // Resultados acumulados en ref (rerender-use-ref-transient-values)
  const resultsRef = useRef({ grises: [] as number[], colores1: [] as number[], formas: [] as number[], colores2: [] as number[] })

  function handleItemClick(id: number) {
    if (clickedIds.includes(id)) return
    const newClicked = [...clickedIds, id]
    setClickedIds(newClicked)

    const keys = ['grises', 'colores1', 'formas', 'colores2'] as const
    resultsRef.current[keys[step]] = newClicked

    if (newClicked.length === STEP_COUNTS[step]) setShowNext(true)
  }

  function handleNext() {
    if (step < 3) {
      setStep(s => s + 1)
      setClickedIds([])
      setShowNext(false)
    } else {
      onComplete(resultsRef.current as LuscherResult)
    }
  }

  const remaining = STEP_COUNTS[step] - clickedIds.length
  const isLast    = step === 3

  // ── Helpers de render por tipo de ítem ──────────────────────────────────────

  function colorBox(id: number, color: string, size: number, hasBorder: boolean) {
    const clicked = clickedIds.includes(id)
    return (
      <button key={id} onClick={() => handleItemClick(id)} disabled={clicked}
        className="rounded-lg transition-all duration-200"
        style={{
          width: `${size}px`, height: `${size * 0.67}px`,
          background: color,
          border: hasBorder ? '1px solid oklch(0.80 0.01 80)' : '1px solid transparent',
          opacity: clicked ? 0.12 : 1,
          transform: clicked ? 'scale(0.85)' : 'scale(1)',
          cursor: clicked ? 'default' : 'pointer',
        }} />
    )
  }

  function formaBox(id: number) {
    const clicked = clickedIds.includes(id)
    const order   = clicked ? clickedIds.indexOf(id) + 1 : null
    return (
      <button key={id} onClick={() => handleItemClick(id)} disabled={clicked}
        className="flex items-center justify-center rounded-xl transition-all duration-200"
        style={{
          width: '80px', height: '80px',
          background: clicked ? 'oklch(0.96 0.005 80)' : 'white',
          border: `2px solid ${clicked ? 'oklch(0.88 0.01 80)' : 'oklch(0.85 0.01 80)'}`,
          opacity: clicked ? 0.3 : 1,
          transform: clicked ? 'scale(0.88)' : 'scale(1)',
          cursor: clicked ? 'default' : 'pointer',
        }}>
        {!clicked && <FormaShape id={id} />}
        {clicked && <span className="text-xs font-medium text-muted-foreground">{order}</span>}
      </button>
    )
  }

  return (
    <div className="space-y-8">
      {/* Step indicator */}
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-1.5">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="rounded-full transition-all duration-300"
                style={{
                  width: i === step ? '20px' : '6px',
                  height: '6px',
                  background: i === step ? 'var(--gold)' : i < step ? 'oklch(0.20 0.06 268 / 0.35)' : 'oklch(0.88 0.01 80)',
                }} />
              {i < STEP_LABELS.length - 1 && (
                <div className="w-3 h-px" style={{ background: 'oklch(0.88 0.01 80)' }} />
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <h2 className="text-xl font-light" style={{ color: 'var(--navy)', fontFamily: 'var(--font-fraunces, serif)' }}>
            Lüscher — {STEP_LABELS[step]}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Selecciona del más al menos preferido
          </p>
        </div>
      </div>

      {/* Items — branch per step para tipos correctos */}
      <div className="flex flex-wrap justify-center gap-4 py-4">
        {step === 0 && GRISES.map(item => colorBox(item.id, item.color, 72, item.border))}
        {step === 1 && COLORES.map(item => colorBox(item.id, item.color, 64, false))}
        {step === 2 && FORMAS.map(item => formaBox(item.id))}
        {step === 3 && COLORES.map(item => colorBox(item.id, item.color, 64, false))}
      </div>

      {/* Contador */}
      {!showNext && (
        <p className="text-center text-xs text-muted-foreground">
          {remaining} {remaining === 1 ? 'elemento restante' : 'elementos restantes'}
        </p>
      )}

      {/* Avanzar */}
      {showNext && (
        <div className="flex justify-center">
          <button onClick={handleNext} disabled={isPending}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-lg text-sm font-medium disabled:opacity-60"
            style={{ background: 'var(--navy)', color: 'var(--cream)' }}>
            {isPending
              ? <><span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />Guardando...</>
              : isLast ? 'Finalizar Lüscher →' : `Continuar a ${STEP_LABELS[step + 1]} →`}
          </button>
        </div>
      )}
    </div>
  )
}
