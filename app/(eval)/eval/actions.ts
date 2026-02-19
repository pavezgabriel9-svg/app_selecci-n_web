'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { TestResultData, TestSnapshot } from '@/types/database'

// ─── RUT Validation ───────────────────────────────────────────────────────────

function validateRut(raw: string): boolean {
  const clean = raw.replace(/\./g, '').replace(/-/g, '').toUpperCase().trim()
  if (!/^\d{7,8}[0-9K]$/.test(clean)) return false

  const body = clean.slice(0, -1)
  const dv = clean.slice(-1)

  let sum = 0
  let multiplier = 2

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }

  const remainder = 11 - (sum % 11)
  const expected =
    remainder === 11 ? '0' : remainder === 10 ? 'K' : String(remainder)

  return dv === expected
}

// ─── Start Evaluation ─────────────────────────────────────────────────────────

export async function startEvaluationAction(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const token = formData.get('token') as string
  const nombre = (formData.get('nombre') as string)?.trim()
  const rut = (formData.get('rut') as string)?.trim()

  if (!nombre || nombre.length < 2)
    return { error: 'Por favor ingresa tu nombre completo' }

  if (!rut || !validateRut(rut))
    return { error: 'RUT inválido. Formato: 12.345.678-9' }

  const supabase = createServiceClient()

  const { data: session } = await supabase
    .from('evaluation_sessions')
    .select('id, status, tests_snapshot')
    .eq('token', token)
    .single()

  if (!session) return { error: 'Esta evaluación no existe o el enlace es inválido' }
  if (session.status !== 'pending') return { error: 'Esta evaluación ya fue iniciada' }

  const snapshot = session.tests_snapshot as TestSnapshot[]
  if (!snapshot?.length)
    return { error: 'Esta evaluación no tiene pruebas configuradas' }

  const { error: candidateError } = await supabase
    .from('candidates')
    .insert({ session_id: session.id, nombre, rut })

  if (candidateError)
    return { error: 'Error al registrar tus datos. Intenta nuevamente.' }

  await supabase
    .from('evaluation_sessions')
    .update({ status: 'in_progress', started_at: new Date().toISOString() })
    .eq('id', session.id)

  redirect(`/eval/${token}/${snapshot[0].id}`)
}

// ─── Complete Test ────────────────────────────────────────────────────────────

export async function completeTestAction(
  sessionId: string,
  testId: string,
  token: string,
  results: TestResultData
): Promise<{ redirect: string }> {
  const supabase = createServiceClient()

  const { data: session } = await supabase
    .from('evaluation_sessions')
    .select('status, tests_snapshot')
    .eq('id', sessionId)
    .single()

  if (!session || session.status !== 'in_progress') {
    return { redirect: `/eval/${token}` }
  }

  const snapshot = session.tests_snapshot as TestSnapshot[]

  // Determine current position by counting saved results
  const { count } = await supabase
    .from('test_results')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId)

  const completedCount = count ?? 0
  const expectedTest = snapshot[completedCount]

  // Anti-skip: if submitted test is not the expected one, redirect correctly
  if (expectedTest?.id !== testId) {
    if (completedCount >= snapshot.length) {
      return { redirect: `/eval/${token}/gracias` }
    }
    return { redirect: `/eval/${token}/${expectedTest.id}` }
  }

  // Save result
  await supabase.from('test_results').insert({
    session_id: sessionId,
    test_id: testId,
    results: results as never,
  })

  const nextCount = completedCount + 1

  if (nextCount >= snapshot.length) {
    await supabase
      .from('evaluation_sessions')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', sessionId)

    return { redirect: `/eval/${token}/gracias` }
  }

  return { redirect: `/eval/${token}/${snapshot[nextCount].id}` }
}
