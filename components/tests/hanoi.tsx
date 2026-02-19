'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import type { TestComponentProps, HanoiResult } from '@/types/database'

// ─── Configuración por variante (hoistada) ────────────────────────────────────

const CONFIG = {
  medio:   { towerCount: 4, discCount: 5, timeLimit: 5 * 60 },
  dificil: { towerCount: 3, discCount: 5, timeLimit: 8 * 60 },
} as const

// disc 1 = más pequeño, disc 5 = más grande
const DISC_WIDTHS  = [0, 44, 72, 100, 128, 156] // index 0 unused
const DISC_COLORS  = [
  '',
  'hsl(220,55%,78%)', // disc 1 - más claro
  'hsl(220,55%,62%)',
  'hsl(220,55%,46%)',
  'hsl(220,55%,32%)',
  'hsl(220,55%,18%)', // disc 5 - navy oscuro
]

type Variant = 'medio' | 'dificil'
type Fase    = 'instrucciones' | 'practica' | 'practica_done' | 'real' | 'resultado'

interface HanoiProps extends TestComponentProps {
  variant: Variant
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function calcularScore(variant: Variant, movimientos: number, faltas: number, tiempoTotal: number) {
  let movScore: number, errScore: number, timScore: number

  if (variant === 'medio') {
    movScore = movimientos >= 15 && movimientos <= 17 ? 100 :
               movimientos >= 18 && movimientos <= 20 ? 85  :
               movimientos >= 21 && movimientos <= 27 ? 60  : 30
    errScore = faltas === 0                ? 100 :
               faltas >= 1  && faltas <= 7  ? 85  :
               faltas >= 8  && faltas <= 14 ? 60  : 30
    timScore = tiempoTotal <= 30  ? 100 :
               tiempoTotal <= 64  ? 85  :
               tiempoTotal <= 90  ? 60  : 30
  } else {
    movScore = movimientos >= 31 && movimientos <= 35 ? 100 :
               movimientos >= 36 && movimientos <= 40 ? 85  :
               movimientos >= 41 && movimientos <= 50 ? 60  : 30
    errScore = faltas === 0               ? 100 :
               faltas >= 1  && faltas <= 5 ? 85  :
               faltas >= 6  && faltas <= 10 ? 60  : 30
    timScore = tiempoTotal <= 120 ? 100 :
               tiempoTotal <= 180 ? 85  :
               tiempoTotal <= 300 ? 60  : 30
  }

  const puntajeFinal = movScore * 0.4 + errScore * 0.35 + timScore * 0.25
  const rendimiento  =
    puntajeFinal >= 90 ? 'Rendimiento Sobresaliente' :
    puntajeFinal >= 76 ? 'Rendimiento Alto' :
    puntajeFinal >= 41 ? 'Rendimiento Promedio' : 'Rendimiento Bajo'

  return { puntajeFinal: Math.round(puntajeFinal), rendimiento }
}

// ─── Sub-componente: tablero de Hanói ─────────────────────────────────────────

interface BoardProps {
  towerCount: number
  discCount: number
  timeLimit?: number   // si no se pasa, no hay timer (modo práctica)
  isPractice?: boolean
  onComplete: (movimientos: number, faltas: number, tiempoTotal: number) => void
}

function HanoiBoard({ towerCount, discCount, timeLimit, isPractice = false, onComplete }: BoardProps) {
  const [towers, setTowers]       = useState<number[][]>(() => {
    const t: number[][] = Array.from({ length: towerCount }, () => [])
    // Fill first tower from bottom (discCount) to top (1)
    for (let d = discCount; d >= 1; d--) t[0].push(d)
    return t
  })
  const [selected, setSelected]   = useState<number | null>(null) // tower index
  const [movimientos, setMovimientos] = useState(0)
  const [faltas, setFaltas]       = useState(0)
  const [timeLeft, setTimeLeft]   = useState(timeLimit ?? 0)
  const [finished, setFinished]   = useState(false)

  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedRef  = useRef(false)
  const startTimeRef = useRef<number>(0)
  const movRef      = useRef(0)
  const faltasRef   = useRef(0)

  const finish = useCallback((trs: number[][]) => {
    if (timerRef.current) clearInterval(timerRef.current)
    setFinished(true)
    const elapsed = startedRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0
    onComplete(movRef.current, faltasRef.current, elapsed)
  }, [onComplete])

  function startTimer() {
    if (startedRef.current || !timeLimit) return
    startedRef.current  = true
    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          setFinished(true)
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
          onComplete(movRef.current, faltasRef.current, elapsed)
          return 0
        }
        return t - 1
      })
    }, 1000)
  }

  function handleTowerClick(towerIdx: number) {
    if (finished) return

    setTowers(prev => {
      const next = prev.map(t => [...t])

      if (selected === null) {
        // Select top disc
        if (next[towerIdx].length > 0) {
          setSelected(towerIdx)
          if (!isPractice) startTimer()
        }
        return next
      }

      if (towerIdx === selected) {
        // Deselect
        setSelected(null)
        return next
      }

      // Attempt move
      const movingDisc = next[selected][next[selected].length - 1]
      const targetTop  = next[towerIdx][next[towerIdx].length - 1]

      if (targetTop === undefined || movingDisc < targetTop) {
        // Valid move
        next[selected].pop()
        next[towerIdx].push(movingDisc)
        movRef.current++
        setMovimientos(m => m + 1)
        setSelected(null)

        // Check win: all discs in last tower
        if (next[towerIdx].length === discCount && towerIdx === towerCount - 1) {
          setTimeout(() => finish(next), 200)
        }
      } else {
        // Invalid move — falta
        faltasRef.current++
        setFaltas(f => f + 1)
        setSelected(null)
      }

      return next
    })
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const mins = timeLimit ? Math.floor(timeLeft / 60) : 0
  const secs = timeLimit ? (timeLeft % 60).toString().padStart(2, '0') : '00'

  return (
    <div className="space-y-4">
      {/* Métricas */}
      {!isPractice && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>Movimientos: <strong style={{ color: 'var(--navy)' }}>{movimientos}</strong></span>
          {timeLimit && startedRef.current && (
            <span className="font-mono font-medium" style={{ color: timeLeft < 30 ? '#CC2200' : 'var(--navy)' }}>
              {mins}:{secs}
            </span>
          )}
          {timeLimit && !startedRef.current && (
            <span>Cronómetro inicia al mover</span>
          )}
          <span>Faltas: <strong style={{ color: '#CC2200' }}>{faltas}</strong></span>
        </div>
      )}

      {isPractice && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
          style={{ background: 'oklch(0.72 0.12 68 / 0.12)', color: 'var(--gold)' }}>
          PRÁCTICA — {discCount} discos, sin límite de tiempo
        </div>
      )}

      {/* Torres */}
      <div className="flex items-end justify-center gap-6 py-4">
        {towers.map((tower, tIdx) => {
          const isSelected = selected === tIdx
          const topDisc    = tower[tower.length - 1]

          return (
            <button key={tIdx} onClick={() => handleTowerClick(tIdx)}
              disabled={finished}
              className="relative flex flex-col-reverse items-center gap-1 pb-2 disabled:cursor-default"
              style={{
                width: '160px',
                minHeight: '180px',
                background: isSelected ? 'oklch(0.72 0.12 68 / 0.06)' : 'transparent',
                borderRadius: '12px',
                border: isSelected ? '2px dashed oklch(0.72 0.12 68 / 0.4)' : '2px solid transparent',
                transition: 'all 0.15s',
                cursor: finished ? 'default' : 'pointer',
              }}>
              {/* Poste vertical */}
              <div className="absolute inset-x-1/2 top-2 bottom-8 -translate-x-1/2"
                style={{ width: '4px', background: 'oklch(0.20 0.06 268 / 0.15)', borderRadius: '2px' }} />

              {/* Base */}
              <div className="relative z-10 rounded-md"
                style={{ width: '140px', height: '8px', background: 'oklch(0.20 0.06 268 / 0.20)' }} />

              {/* Discos (bottom-to-top via flex-col-reverse) */}
              {tower.map((disc, dIdx) => {
                const isTopDisc = dIdx === tower.length - 1
                const isSelectedDisc = isSelected && isTopDisc
                return (
                  <div key={`${tIdx}-${dIdx}-${disc}`}
                    className="relative z-10 rounded-md transition-all duration-200"
                    style={{
                      width: `${DISC_WIDTHS[disc]}px`,
                      height: '20px',
                      background: DISC_COLORS[disc],
                      boxShadow: isSelectedDisc ? `0 0 0 2px var(--gold)` : 'none',
                      transform: isSelectedDisc ? 'translateY(-4px)' : 'none',
                    }} />
                )
              })}

              {/* Etiqueta de torre */}
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
                {tIdx + 1}
              </span>
            </button>
          )
        })}
      </div>

      {/* Instrucción durante juego */}
      {!finished && selected === null && (
        <p className="text-center text-xs text-muted-foreground mt-2">
          Toca una torre para seleccionar el disco superior, luego toca la torre destino.
        </p>
      )}
      {!finished && selected !== null && (
        <p className="text-center text-xs mt-2" style={{ color: 'var(--gold)' }}>
          Disco seleccionado — toca la torre destino.
        </p>
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function HanoiTest({ onComplete, isPending, hasPractice, variant }: HanoiProps) {
  const [fase, setFase] = useState<Fase>('instrucciones')
  const [boardKey, setBoardKey] = useState(0)
  const resultRef = useRef<HanoiResult | null>(null)

  const cfg = CONFIG[variant]
  const variantName = variant === 'medio' ? 'Hanói Medio' : 'Hanói Difícil'

  function handlePracticeDone() {
    setFase('practica_done')
  }

  function handleRealDone(movimientos: number, faltas: number, tiempoTotal: number) {
    const { puntajeFinal, rendimiento } = calcularScore(variant, movimientos, faltas, tiempoTotal)
    resultRef.current = { movimientos, faltas, tiempoTotal, rendimiento }
    void puntajeFinal // stored in rendimiento context
    setFase('resultado')
  }

  function startReal() {
    setBoardKey(k => k + 1)
    setFase('real')
  }

  const practica_discCount = 3
  const practica_towerCount = variant === 'dificil' ? 3 : 4

  // ── Instrucciones ──────────────────────────────────────────────────────────
  if (fase === 'instrucciones') {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-light" style={{ color: 'var(--navy)', fontFamily: 'var(--font-fraunces, serif)' }}>
            Torre de Hanói — {variant === 'medio' ? 'Versión Media' : 'Versión Difícil'}
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>Tienes una torre de <strong className="text-foreground">{cfg.discCount} discos</strong> apilados en la primera torre, del más grande (abajo) al más pequeño (arriba).</p>
            <p>Tu objetivo es mover <strong className="text-foreground">todos los discos a la última torre</strong> siguiendo estas reglas:</p>
            <ul className="space-y-1 list-disc list-inside text-xs">
              <li>Solo puedes mover un disco a la vez (el superior de cualquier torre).</li>
              <li>No puedes colocar un disco grande sobre uno más pequeño.</li>
            </ul>
            <div className="rounded-xl p-3 text-xs" style={{ background: 'oklch(0.96 0.005 80)' }}>
              <p><strong className="text-foreground">{cfg.towerCount} torres</strong> disponibles · Límite de tiempo: <strong className="text-foreground">{cfg.timeLimit / 60} minutos</strong></p>
            </div>
          </div>
        </div>
        <button onClick={() => setFase(hasPractice ? 'practica' : 'real')}
          className="px-8 py-3 rounded-lg text-sm font-medium"
          style={{ background: 'var(--navy)', color: 'var(--cream)' }}>
          {hasPractice ? 'Comenzar práctica →' : 'Comenzar →'}
        </button>
      </div>
    )
  }

  // ── Práctica completada ────────────────────────────────────────────────────
  if (fase === 'practica_done') {
    return (
      <div className="text-center space-y-8 py-6">
        <div className="space-y-3">
          <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center text-2xl"
            style={{ background: 'oklch(0.88 0.08 140 / 0.15)' }}>✓</div>
          <h2 className="text-xl font-light" style={{ color: 'var(--navy)', fontFamily: 'var(--font-fraunces, serif)' }}>
            ¡Práctica completada!
          </h2>
          <p className="text-sm text-muted-foreground">
            Ahora comenzará el test real con {cfg.discCount} discos y {cfg.towerCount} torres.
            Tienes {cfg.timeLimit / 60} minutos.
          </p>
        </div>
        <button onClick={startReal} className="px-8 py-3 rounded-lg text-sm font-medium"
          style={{ background: 'var(--navy)', color: 'var(--cream)' }}>
          Comenzar test real →
        </button>
      </div>
    )
  }

  // ── Resultado ──────────────────────────────────────────────────────────────
  if (fase === 'resultado') {
    const r = resultRef.current!
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-light" style={{ color: 'var(--navy)', fontFamily: 'var(--font-fraunces, serif)' }}>
            Prueba completada
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Movimientos', value: r.movimientos },
              { label: 'Faltas',      value: r.faltas },
              { label: 'Tiempo',      value: `${r.tiempoTotal}s` },
            ].map(({ label, value }) => (
              <div key={label} className="text-center py-5 rounded-xl" style={{ background: 'oklch(0.96 0.005 80)' }}>
                <div className="text-2xl font-light" style={{ color: 'var(--navy)' }}>{value}</div>
                <div className="text-xs text-muted-foreground mt-1">{label}</div>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{r.rendimiento}</p>
        </div>
        <button onClick={() => onComplete(r)} disabled={isPending}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-lg text-sm font-medium disabled:opacity-60"
          style={{ background: 'var(--navy)', color: 'var(--cream)' }}>
          {isPending
            ? <><span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />Guardando...</>
            : 'Continuar →'}
        </button>
      </div>
    )
  }

  // ── Práctica ───────────────────────────────────────────────────────────────
  if (fase === 'practica') {
    return (
      <HanoiBoard
        key={`prac-${boardKey}`}
        towerCount={practica_towerCount}
        discCount={practica_discCount}
        isPractice
        onComplete={handlePracticeDone}
      />
    )
  }

  // ── Real ────────────────────────────────────────────────────────────────────
  return (
    <HanoiBoard
      key={`real-${boardKey}`}
      towerCount={cfg.towerCount}
      discCount={cfg.discCount}
      timeLimit={cfg.timeLimit}
      onComplete={handleRealDone}
    />
  )
}
