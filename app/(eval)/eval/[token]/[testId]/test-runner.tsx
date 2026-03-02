'use client'

import dynamic from 'next/dynamic'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { completeTestAction } from '../../actions'
import type { TestResultData, TestComponentProps } from '@/types/database'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  sessionId: string
  token: string
  testId: string
  testName: string
  testPath: string
  hasPractice: boolean
  currentIndex: number
  totalTests: number
  candidateName?: string
}

interface HanoiTestProps extends TestComponentProps {
  variant: 'medio' | 'dificil'
  candidateName?: string
}

// ─── Dynamic imports — bundle-dynamic-imports: solo carga el test activo ──────

const StroopTest  = dynamic<TestComponentProps>(() => import('@/components/tests/stroop'))
const LuscherTest = dynamic<TestComponentProps>(() => import('@/components/tests/luscher'))
const MemoriaTest = dynamic<TestComponentProps>(() => import('@/components/tests/memoria'))
const ICTest      = dynamic<TestComponentProps>(() => import('@/components/tests/ic'))
const HanoiTest   = dynamic<HanoiTestProps>(() => import('@/components/tests/hanoi'))

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

// ─── Test resolver (por path del snapshot) ────────────────────────────────────

function resolveTestComponent(
  testPath: string,
  hasPractice: boolean,
  baseProps: Omit<TestComponentProps, 'hasPractice'>,
  testName: string,
  candidateName?: string,
): React.ReactNode {
  const path = testPath.toLowerCase()
  const fullProps: TestComponentProps = { ...baseProps, hasPractice }

  if (path.includes('stroop'))        return <StroopTest  {...fullProps} />
  if (path.includes('luscher'))       return <LuscherTest {...fullProps} />
  if (path.includes('memoria'))       return <MemoriaTest {...fullProps} />
  if (path.includes('hanoi-dificil')) return <HanoiTest   {...fullProps} variant="dificil" candidateName={candidateName} />
  if (path.includes('hanoi'))         return <HanoiTest   {...fullProps} variant="medio"   candidateName={candidateName} />
  if (path.includes('ic'))            return <ICTest      {...fullProps} />

  // Fallback
  return (
    <div className="text-center space-y-8 py-10">
      <h2 className="text-2xl font-light" style={{ color: 'var(--navy)' }}>{testName}</h2>
      <p className="text-sm text-muted-foreground">Esta prueba estará disponible próximamente.</p>
      <button
        onClick={() => baseProps.onComplete({})}
        disabled={baseProps.isPending}
        className="inline-flex items-center gap-2 px-8 py-3 rounded-lg text-sm font-medium disabled:opacity-60"
        style={{ background: 'var(--navy)', color: 'var(--cream)' }}
      >
        {baseProps.isPending
          ? <><span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />Guardando...</>
          : 'Continuar →'}
      </button>
    </div>
  )
}

// ─── TestRunner (orchestrator) ────────────────────────────────────────────────

export function TestRunner({
  sessionId, token, testId, testName, testPath,
  hasPractice, currentIndex, totalTests, candidateName,
}: Props) {
  const { completeTest, isPending } = useTestNavigation(sessionId, testId, token)
  const progressPct = Math.round((currentIndex / totalTests) * 100)

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          {candidateName && (
            <span className="text-xs font-medium text-muted-foreground">{candidateName}</span>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            Prueba {currentIndex + 1} de {totalTests}
          </span>
        </div>
        <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'oklch(0.88 0.01 80)' }}>
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
        {resolveTestComponent(testPath, hasPractice, { onComplete: completeTest, isPending }, testName, candidateName)}
      </div>
    </div>
  )
}
