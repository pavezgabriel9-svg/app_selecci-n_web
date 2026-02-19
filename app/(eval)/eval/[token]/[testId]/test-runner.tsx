'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { completeTestAction } from '../../actions'
import type { TestResultData } from '@/types/database'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  sessionId: string
  token: string
  testId: string
  testName: string
  currentIndex: number
  totalTests: number
  candidateName?: string
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useTestNavigation(sessionId: string, testId: string, token: string) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function completeTest(results: TestResultData) {
    startTransition(async () => {
      const result = await completeTestAction(sessionId, testId, token, results)
      router.push(result.redirect)
    })
  }

  return { completeTest, isPending }
}

// ─── Test Stub ────────────────────────────────────────────────────────────────

function TestStub({
  testName,
  onComplete,
  isPending,
}: {
  testName: string
  onComplete: (results: TestResultData) => void
  isPending: boolean
}) {
  return (
    <div className="text-center space-y-8 py-10">
      <div className="space-y-4">
        <div
          className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
          style={{ background: 'oklch(0.20 0.06 268 / 0.06)' }}
        >
          <span
            className="font-display text-2xl font-light"
            style={{ color: 'var(--navy)' }}
          >
            ◈
          </span>
        </div>
        <h2 className="text-2xl font-light" style={{ color: 'var(--navy)' }}>
          {testName}
        </h2>
        <p className="text-sm text-muted-foreground">
          Esta prueba estará disponible próximamente.
        </p>
      </div>

      <button
        onClick={() => onComplete({})}
        disabled={isPending}
        className="inline-flex items-center gap-2 px-8 py-3 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-60"
        style={{ background: 'var(--navy)', color: 'var(--cream)' }}
      >
        {isPending ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Guardando...
          </>
        ) : (
          'Continuar →'
        )}
      </button>
    </div>
  )
}

// ─── Lüscher Stub (4 pasos internos) ──────────────────────────────────────────

const LUSCHER_STEPS = ['Grises', 'Colores I', 'Formas', 'Colores II'] as const

function LuscherStub({
  onComplete,
  isPending,
}: {
  onComplete: (results: TestResultData) => void
  isPending: boolean
}) {
  const [step, setStep] = useState(0)
  const isLast = step === LUSCHER_STEPS.length - 1

  function handleNext() {
    if (!isLast) {
      setStep((s) => s + 1)
    } else {
      onComplete({ grises: [], colores1: [], formas: [], colores2: [] })
    }
  }

  return (
    <div className="text-center space-y-8 py-10">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-1.5">
        {LUSCHER_STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className="rounded-full transition-all duration-300"
              style={{
                width: i === step ? '20px' : '6px',
                height: '6px',
                background:
                  i === step
                    ? 'var(--gold)'
                    : i < step
                      ? 'oklch(0.20 0.06 268 / 0.35)'
                      : 'oklch(0.88 0.01 80)',
              }}
            />
            {i < LUSCHER_STEPS.length - 1 && (
              <div
                className="w-3 h-px"
                style={{ background: 'oklch(0.88 0.01 80)' }}
              />
            )}
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div
          className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
          style={{ background: 'oklch(0.72 0.12 68 / 0.09)' }}
        >
          <span
            className="font-display text-2xl font-light"
            style={{ color: 'var(--gold)' }}
          >
            {step + 1}
          </span>
        </div>
        <h2 className="text-2xl font-light" style={{ color: 'var(--navy)' }}>
          Lüscher — {LUSCHER_STEPS[step]}
        </h2>
        <p className="text-sm text-muted-foreground">
          Parte {step + 1} de {LUSCHER_STEPS.length}
        </p>
      </div>

      <button
        onClick={handleNext}
        disabled={isPending}
        className="inline-flex items-center gap-2 px-8 py-3 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-60"
        style={{ background: 'var(--navy)', color: 'var(--cream)' }}
      >
        {isPending ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Guardando...
          </>
        ) : isLast ? (
          'Finalizar prueba →'
        ) : (
          'Siguiente parte →'
        )}
      </button>
    </div>
  )
}

// ─── TestRunner (orchestrator) ────────────────────────────────────────────────

export function TestRunner({
  sessionId,
  token,
  testId,
  testName,
  currentIndex,
  totalTests,
  candidateName,
}: Props) {
  const { completeTest, isPending } = useTestNavigation(sessionId, testId, token)
  const progressPct = Math.round((currentIndex / totalTests) * 100)

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          {candidateName && (
            <span className="text-xs font-medium text-muted-foreground">
              {candidateName}
            </span>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            Prueba {currentIndex + 1} de {totalTests}
          </span>
        </div>
        <div
          className="h-0.5 rounded-full overflow-hidden"
          style={{ background: 'oklch(0.88 0.01 80)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%`, background: 'var(--gold)' }}
          />
        </div>
      </div>

      {/* Test content */}
      <div
        className="rounded-2xl border p-8"
        style={{ background: 'white', borderColor: 'oklch(0.92 0.005 80)' }}
      >
        {testId === 'test9' ? (
          <LuscherStub onComplete={completeTest} isPending={isPending} />
        ) : (
          <TestStub
            testName={testName}
            onComplete={completeTest}
            isPending={isPending}
          />
        )}
      </div>
    </div>
  )
}
