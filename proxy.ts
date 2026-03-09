import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  // Patrón oficial @supabase/ssr: supabaseResponse debe crearse aquí
  // y ser el único response retornado para que las cookies se propaguen.
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: no escribir lógica entre createServerClient y getUser()
  // para evitar que las sesiones se invaliden inesperadamente.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Redirigir usuarios ya autenticados fuera del login
  if (pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Rutas protegidas — requieren sesión activa
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/baterias') ||
    pathname.startsWith('/resultados') ||
    pathname.startsWith('/usuarios')

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // /usuarios requiere rol admin o superior
  if (pathname.startsWith('/usuarios')) {
    const role = user?.app_metadata?.role
    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Excluir archivos estáticos, imágenes y rutas públicas
    '/((?!_next/static|_next/image|favicon.ico|eval|gracias|reset-pass).*)',
  ],
}
