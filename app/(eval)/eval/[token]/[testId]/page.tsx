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
  if (session.status === 'completed') redirect(`/eval/${token}/hub`)

  const snapshot = session.tests_snapshot as TestSnapshot[]

  // Verify the requested test belongs to this session's snapshot
  const currentTest = snapshot.find(t => t.id === testId)
  if (!currentTest) notFound()

  // Fetch which tests have already been completed (free order)
  const { data: completedResults } = await supabase
    .from('test_results')
    .select('test_id')
    .eq('session_id', session.id)

  const completedTestIds = completedResults?.map(r => r.test_id) ?? []

  // If this specific test was already completed, redirect to hub
  if (completedTestIds.includes(testId)) {
    redirect(`/eval/${token}/hub`)
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
      testPath={currentTest.path}
      hasPractice={currentTest.has_practice}
      completedTestIds={completedTestIds}
      totalTests={snapshot.length}
      candidateName={candidate?.nombre ?? undefined}
      testsSnapshot={snapshot}
    />
  )
}
