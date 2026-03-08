import type { User } from '@supabase/supabase-js'

export type UserRole = 'super_admin' | 'admin'

export function getUserRole(user: User): UserRole {
  return (user.app_metadata?.role as UserRole) ?? 'admin'
}

export function isSuperAdmin(user: User): boolean {
  return getUserRole(user) === 'super_admin'
}

export function getRoleLabel(role: UserRole): string {
  return role === 'super_admin' ? 'Super Admin' : 'Admin'
}

export function isUserBanned(user: User): boolean {
  if (!user.banned_until) return false
  return new Date(user.banned_until) > new Date()
}
