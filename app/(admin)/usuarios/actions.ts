'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/auth/roles'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ─── Auth guard ───────────────────────────────────────────────────────────────

async function requireSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isSuperAdmin(user)) {
    throw new Error('Sin permisos')
  }
  return user
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreateAdminState = { error: string } | { success: string } | null

// ─── Create Admin ─────────────────────────────────────────────────────────────

const CreateAdminSchema = z.object({
  email: z.string().email('Ingresa un email válido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe incluir al menos una letra mayúscula')
    .regex(/[0-9]/, 'Debe incluir al menos un número'),
})

export async function createAdminAction(
  _prevState: CreateAdminState,
  formData: FormData
): Promise<CreateAdminState> {
  try {
    await requireSuperAdmin()
  } catch {
    return { error: 'Sin permisos para realizar esta acción' }
  }

  const parsed = CreateAdminSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const service = createServiceClient()

  // Verificar que el email no esté ya registrado
  const { data: existing } = await service.auth.admin.listUsers({ perPage: 200 })
  const emailExists = existing.users.some(
    (u) => u.email?.toLowerCase() === parsed.data.email.toLowerCase()
  )
  if (emailExists) {
    return { error: 'Ya existe un usuario con ese email' }
  }

  const { error } = await service.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    app_metadata: { role: 'admin' },
  })

  if (error) return { error: error.message }

  revalidatePath('/usuarios')
  return { success: `Admin ${parsed.data.email} creado correctamente` }
}

// ─── Toggle Ban ───────────────────────────────────────────────────────────────

export async function toggleBanAction(userId: string, ban: boolean): Promise<void> {
  try {
    await requireSuperAdmin()
  } catch {
    return
  }

  const service = createServiceClient()
  await service.auth.admin.updateUserById(userId, {
    ban_duration: ban ? '876000h' : 'none',
  })

  revalidatePath('/usuarios')
}
