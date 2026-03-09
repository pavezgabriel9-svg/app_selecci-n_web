'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isAdminOrAbove, isSuperAdmin, getUserRole, canBanTarget } from '@/lib/auth/roles'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ─── Auth guards ───────────────────────────────────────────────────────────────

async function requireAdminOrAbove() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminOrAbove(user)) {
    throw new Error('Sin permisos')
  }
  return user
}

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

// ─── Create User ──────────────────────────────────────────────────────────────

const CreateAdminSchema = z.object({
  email: z.string().email('Ingresa un email válido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe incluir al menos una letra mayúscula')
    .regex(/[0-9]/, 'Debe incluir al menos un número'),
  role: z.enum(['user', 'admin']),
})

export async function createAdminAction(
  _prevState: CreateAdminState,
  formData: FormData
): Promise<CreateAdminState> {
  let actor: Awaited<ReturnType<typeof requireAdminOrAbove>>
  try {
    actor = await requireAdminOrAbove()
  } catch {
    return { error: 'Sin permisos para realizar esta acción' }
  }

  const parsed = CreateAdminSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  // Solo super_admin puede crear admins
  const actorRole = getUserRole(actor)
  if (parsed.data.role === 'admin' && actorRole !== 'super_admin') {
    return { error: 'Solo un Super Admin puede crear administradores' }
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
    app_metadata: { role: parsed.data.role },
  })

  if (error) return { error: error.message }

  revalidatePath('/usuarios')
  return { success: `Usuario ${parsed.data.email} creado como ${parsed.data.role === 'admin' ? 'Admin' : 'User'}` }
}

// ─── Toggle Ban ───────────────────────────────────────────────────────────────

export async function toggleBanAction(userId: string, ban: boolean): Promise<void> {
  // Obtener actor y validar que sea admin o superior
  const supabase = await createClient()
  const { data: { user: actor } } = await supabase.auth.getUser()
  if (!actor || !isAdminOrAbove(actor)) return

  const actorRole = getUserRole(actor)
  const service = createServiceClient()

  // Obtener el rol del usuario objetivo
  const { data: targetData } = await service.auth.admin.getUserById(userId)
  if (!targetData?.user) return

  const targetRole = getUserRole(targetData.user)

  // Validar jerarquía: solo se puede banear a un nivel inferior
  if (!canBanTarget(actorRole, targetRole)) return

  await service.auth.admin.updateUserById(userId, {
    ban_duration: ban ? '876000h' : 'none',
  })

  revalidatePath('/usuarios')
}
