'use client'

import { useState, useRef, useEffect } from 'react'
import type { TestComponentProps, ICResult } from '@/types/database'

// ─── Datos hoistados (fuera del componente) ───────────────────────────────────

const TABLE_ROWS = [
  { cantidad: '300.000', clase: 'Incendios',  fecha: '02/01/1976' },
  { cantidad: '100.000', clase: 'Vida',        fecha: '22/10/1975' },
  { cantidad: '400.000', clase: 'Accidentes', fecha: '14/09/1975' },
  { cantidad: '200.000', clase: 'Vida',        fecha: '13/11/1976' },
  { cantidad: '400.000', clase: 'Incendios',  fecha: '17/05/1976' },
  { cantidad: '300.000', clase: 'Accidentes', fecha: '12/10/1975' },
  { cantidad: '500.000', clase: 'Vida',        fecha: '16/02/1976' },
  { cantidad: '100.000', clase: 'Incendios',  fecha: '03/08/1976' },
  { cantidad: '400.000', clase: 'Incendios',  fecha: '11/08/1976' },
  { cantidad: '200.000', clase: 'Accidentes', fecha: '21/05/1975' },
  { cantidad: '500.000', clase: 'Vida',        fecha: '09/03/1975' },
  { cantidad: '300.000', clase: 'Incendios',  fecha: '17/07/1976' },
  { cantidad: '100.000', clase: 'Accidentes', fecha: '04/06/1976' },
  { cantidad: '100.000', clase: 'Vida',        fecha: '23/11/1976' },
  { cantidad: '500.000', clase: 'Vida',        fecha: '18/04/1975' },
  { cantidad: '200.000', clase: 'Accidentes', fecha: '24/12/1976' },
  { cantidad: '500.000', clase: 'Accidentes', fecha: '19/04/1975' },
  { cantidad: '200.000', clase: 'Vida',        fecha: '07/12/1976' },
  { cantidad: '400.000', clase: 'Incendios',  fecha: '26/05/1975' },
  { cantidad: '300.000', clase: 'Accidentes', fecha: '06/01/1976' },
  { cantidad: '500.000', clase: 'Vida',        fecha: '29/03/1975' },
  { cantidad: '300.000', clase: 'Vida',        fecha: '28/06/1975' },
  { cantidad: '400.000', clase: 'Accidentes', fecha: '08/02/1976' },
  { cantidad: '100.000', clase: 'Incendios',  fecha: '27/07/1975' },
  { cantidad: '200.000', clase: 'Accidentes', fecha: '21/01/1976' },
] as const

// Columnas correctas por fila (1-indexed: 1, 2, 3)
const CORRECT_ANSWERS: readonly number[][] = [
  [1,3],[2],[1],[],[3],[1],[3],[],[],[1],
  [3],[],[2],[],[3],[],[],[],[1,3],[1,2],
  [3],[3],[1],[],[1,2],
]

const TIMER_SECONDS = 7 * 60

type Fase = 'instrucciones' | 'test' | 'resultado'

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ICTest({ onComplete, isPending }: TestComponentProps) {
  const [fase, setFase]       = useState<Fase>('instrucciones')
  const [answers, setAnswers] = useState<boolean[][]>(
    () => TABLE_ROWS.map(() => [false, false, false])
  )
  const [timeLeft, setTimeLeft]     = useState(TIMER_SECONDS)
  const [timerStarted, setTimerStarted] = useState(false)
  const [submitted, setSubmitted]   = useState(false)

  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const resultRef = useRef<ICResult | null>(null)

  function startTimer() {
    if (timerRef.current) return
    setTimerStarted(true)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          handleSubmit()
          return 0
        }
        return t - 1
      })
    }, 1000)
  }

  function toggleCheckbox(rowIdx: number, colIdx: number) {
    if (submitted) return
    if (!timerStarted) startTimer()
    setAnswers(prev => {
      const next = prev.map(r => [...r])
      next[rowIdx][colIdx] = !next[rowIdx][colIdx]
      return next
    })
  }

  function handleSubmit() {
    if (submitted) return
    setSubmitted(true)
    if (timerRef.current) clearInterval(timerRef.current)

    let puntaje = 0, incorrectas = 0, omisiones = 0
    TABLE_ROWS.forEach((_, i) => {
      const correctCols = CORRECT_ANSWERS[i]
      const userCols    = answers[i]
      correctCols.forEach(col => {
        if (userCols[col - 1]) puntaje++
        else omisiones++
      })
      for (let c = 0; c < 3; c++) {
        if (userCols[c] && !correctCols.includes(c + 1)) incorrectas++
      }
    })

    const totalCorrectas = CORRECT_ANSWERS.reduce((sum, cols) => sum + cols.length, 0)
    let puntuacionAjustada = puntaje - incorrectas - omisiones * 0.2
    if (puntuacionAjustada < 0) puntuacionAjustada = 0
    const porcentaje = (puntuacionAjustada / totalCorrectas) * 100
    const nivelRendimiento =
      porcentaje >= 90 ? 'Resultado Sobresaliente' :
      porcentaje >= 70 ? 'Rendimiento alto' :
      porcentaje >= 40 ? 'Rendimiento esperado' : 'Bajo rendimiento'
    const tiempoUsado = TIMER_SECONDS - timeLeft

    resultRef.current = {
      puntaje,
      incorrectas,
      omisiones,
      puntuacionAjustada: parseFloat(puntuacionAjustada.toFixed(1)),
      nivelRendimiento,
    }

    // Silence unused tiempoUsado in result (not in ICResult type, but log for context)
    void tiempoUsado

    setFase('resultado')
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const mins = Math.floor(timeLeft / 60)
  const secs = (timeLeft % 60).toString().padStart(2, '0')

  // ── Instrucciones ──────────────────────────────────────────────────────────
  if (fase === 'instrucciones') {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-light" style={{ color: 'var(--navy)', fontFamily: 'var(--font-fraunces, serif)' }}>
            Instrucciones Complejas (IC)
          </h2>
          <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>La siguiente prueba evalúa tu capacidad para seguir instrucciones.</p>
            <div className="rounded-xl p-5 space-y-3" style={{ background: 'oklch(0.96 0.005 80)', fontSize: '0.8rem' }}>
              <p><strong className="text-foreground">Criterio I:</strong> Seleccione la columna 1 a la altura de cada seguro de <em>incendios o accidentes</em>, cuyo monto esté entre $150.000–$400.000, contratado entre el 15/03/1975 y el 10/05/1976.</p>
              <p><strong className="text-foreground">Criterio II:</strong> Seleccione la columna 2 a la altura de cada seguro de <em>vida o accidentes</em>, hasta $300.000, contratado entre el 15/10/1975 y el 20/08/1976.</p>
              <p><strong className="text-foreground">Criterio III:</strong> Seleccione la columna 3 a la altura de cada seguro de <em>incendios o vida</em>, cuyo monto esté entre $200.000–$500.000, contratado entre el 10/02/1975 y el 15/06/1976.</p>
            </div>
            <ul className="space-y-1 list-disc list-inside text-xs">
              <li>Marca la casilla en la columna correspondiente (1, 2 y/o 3) según aplique.</li>
              <li>Si una fila no cumple ningún criterio, no marques nada.</li>
              <li>El cronómetro de <strong className="text-foreground">7 minutos</strong> comenzará al marcar la primera casilla.</li>
              <li>Al terminar, presiona el botón <strong className="text-foreground">&ldquo;Finalizar prueba&rdquo;</strong>.</li>
            </ul>
          </div>
        </div>
        <button onClick={() => setFase('test')}
          className="px-8 py-3 rounded-lg text-sm font-medium"
          style={{ background: 'var(--navy)', color: 'var(--cream)' }}>
          Entendido — ver tabla →
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
            ¡Bien hecho!
          </h2>
          <p className="text-sm text-muted-foreground">
            Has completado esta etapa de la evaluación.
          </p>
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

  // ── Test ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header sticky */}
      <div className="flex items-center justify-between sticky top-0 z-10 py-2 px-1 -mx-1"
        style={{ background: 'white' }}>
        <span className="text-sm font-medium" style={{ color: 'var(--navy)' }}>
          IC — Instrucciones Complejas
        </span>
        <div className="flex items-center gap-3">
          {timerStarted && (
            <span className="font-mono text-sm font-medium"
              style={{ color: timeLeft < 60 ? '#CC2200' : 'var(--navy)' }}>
              {mins}:{secs}
            </span>
          )}
          {!timerStarted && (
            <span className="text-xs text-muted-foreground">Cronómetro inicia al marcar</span>
          )}
          <button onClick={handleSubmit} disabled={submitted}
            className="px-4 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
            style={{ background: 'var(--navy)', color: 'var(--cream)' }}>
            Finalizar prueba
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid oklch(0.90 0.005 80)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'oklch(0.96 0.005 80)' }}>
              {['#', 'Cantidad', 'Clase', 'Fecha', 'Col. 1', 'Col. 2', 'Col. 3'].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground first:w-8">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TABLE_ROWS.map((row, i) => (
              <tr key={i} className="border-t" style={{ borderColor: 'oklch(0.92 0.005 80)' }}>
                <td className="px-3 py-2 text-xs text-muted-foreground">{i + 1}</td>
                <td className="px-3 py-2 text-xs tabular-nums">{row.cantidad}</td>
                <td className="px-3 py-2 text-xs">{row.clase}</td>
                <td className="px-3 py-2 text-xs tabular-nums">{row.fecha}</td>
                {[0, 1, 2].map(col => (
                  <td key={col} className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={answers[i][col]}
                      onChange={() => toggleCheckbox(i, col)}
                      disabled={submitted}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: 'var(--navy)', cursor: submitted ? 'default' : 'pointer' }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Botón final inferior */}
      <div className="flex justify-end pt-2">
        <button onClick={handleSubmit} disabled={submitted}
          className="px-8 py-3 rounded-lg text-sm font-medium disabled:opacity-50"
          style={{ background: 'var(--navy)', color: 'var(--cream)' }}>
          Finalizar prueba
        </button>
      </div>
    </div>
  )
}
