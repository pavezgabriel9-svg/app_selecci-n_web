import { logoutAction } from '@/app/(auth)/login/actions'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { getRoleLabel, type UserRole } from '@/lib/auth/roles'

interface Props {
  user: User
  role: UserRole
}

export default function AdminTopbar({ user, role }: Props) {
  const initials = user.email?.slice(0, 2).toUpperCase() ?? 'AD'
  const roleLabel = getRoleLabel(role)

  const roleBadgeStyle: React.CSSProperties =
    role === 'super_admin'
      ? { background: 'oklch(0.72 0.12 68 / 0.15)', color: 'var(--gold)' }
      : role === 'admin'
        ? { background: 'oklch(0.20 0.06 268 / 0.10)', color: 'var(--navy)' }
        : { background: 'oklch(0.60 0.04 268 / 0.08)', color: 'oklch(0.45 0.05 268)' }

  return (
    <header className="h-16 border-b border-border/40 px-6 lg:px-8 flex items-center justify-between bg-background/60 backdrop-blur-sm sticky top-0 z-10">
      <div />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-3 h-auto py-2 px-3 rounded-md hover:bg-muted"
          >
            <Avatar className="w-7 h-7">
              <AvatarFallback
                className="text-xs font-semibold"
                style={{ background: 'var(--navy)', color: 'var(--gold)' }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-medium leading-none text-foreground">
                {user.email}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className="text-[9px] font-semibold tracking-wider uppercase px-1.5 py-px rounded-sm"
                  style={roleBadgeStyle}
                >
                  {roleLabel}
                </span>
              </div>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-xs font-medium truncate">{user.email}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className="text-[9px] font-semibold tracking-wider uppercase px-1.5 py-px rounded-sm"
                style={roleBadgeStyle}
              >
                {roleLabel}
              </span>
            </div>
          </div>
          <DropdownMenuSeparator />
          <form action={logoutAction}>
            <DropdownMenuItem asChild>
              <button
                type="submit"
                className="w-full flex items-center gap-2 text-destructive cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Cerrar sesión
              </button>
            </DropdownMenuItem>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
