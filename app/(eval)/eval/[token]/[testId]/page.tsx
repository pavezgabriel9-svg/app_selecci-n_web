import { createServiceClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import type { TestSnapshot } from '@/types/database'
import { TestRunner } from './test-runner'

interface Props {
  params: Promise<{ token: string; testId: string }>
}

export default async function TestShellPage({ params }: Props) {
  const { token, testId } = await params
  const supabase = createServiceClient()

  const { data: session } = await supabase
    .from('evaluation_sessions')
    .select('id, status, tests_snapshot')
    .eq('token', token)
    .single()

  if (!session) notFound()

  if (session.status === 'pending') redirect(`/eval/${token}`)
  if (session.status === 'completed') redirect(`/eval/${token}/gracias`)

  const snapshot = session.tests_snapshot as TestSnapshot[]

  // Determine which test is current by counting completed results
  const { count } = await supabase
    .from('test_results')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', session.id)

  const completedCount = count ?? 0

  if (completedCount >= snapshot.length) {
    redirect(`/eval/${token}/gracias`)
  }

  const currentTest = snapshot[completedCount]

  // Anti-skip: if URL testId doesn't match the expected current test, redirect
  if (testId !== currentTest.id) {
    redirect(`/eval/${token}/${currentTest.id}`)
  }

  // Load candidate name for display
  const { data: candidate } = await supabase
    .from('candidates')
    .select('nombre')
    .eq('session_id', session.id)
    .single()

  return (
    <TestRunner
      sessionId={session.id}
      token={token}
      testId={currentTest.id}
      testName={currentTest.name}
      currentIndex={completedCount}
      totalTests={snapshot.length}
      candidateName={candidate?.nombre ?? undefined}
    />
  )
}
