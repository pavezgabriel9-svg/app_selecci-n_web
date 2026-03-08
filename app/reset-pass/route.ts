import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createServiceClient()

  // Try to create the user first
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: 'admin123@admin.com',
    password: 'Admin123!',
    email_confirm: true,
  })

  if (!createError) {
    return NextResponse.json({ ok: true, action: 'created', email: created.user.email })
  }

  // If already exists, list users to find the ID and update
  const { data: list } = await supabase.auth.admin.listUsers()
  const existing = list?.users?.find(u => u.email === 'admin123@admin.com')

  if (!existing) {
    return NextResponse.json({ error: createError.message }, { status: 400 })
  }

  const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(
    existing.id,
    { password: 'Admin123!', email_confirm: true }
  )

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })
  return NextResponse.json({ ok: true, action: 'updated', email: updated.user.email })
}
