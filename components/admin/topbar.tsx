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

export default function AdminTopbar({ user }: { user: User }) {
  const initials = user.email?.slice(0, 2).toUpperCase() ?? 'AD'

  return (
    <header className="h-16 border-b border-border/40 px-6 lg:px-8 flex items-center justify-between bg-background/60 backdrop-blur-sm sticky top-0 z-10">
      <div>
        {/* Espacio para breadcrumb en el futuro */}
      </div>

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
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Administrador
              </p>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <div className="px-2 py-1.5">
            <p className="text-xs font-medium truncate">{user.email}</p>
            <p className="text-[10px] text-muted-foreground">Administrador</p>
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
