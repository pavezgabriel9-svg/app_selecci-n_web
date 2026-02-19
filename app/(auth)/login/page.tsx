import { Metadata } from 'next'
import LoginForm from './login-form'

export const metadata: Metadata = {
  title: 'Acceso',
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirect?: string }>
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Panel izquierdo — Visual */}
      <div className="relative hidden lg:flex flex-col justify-between bg-navy p-12 overflow-hidden">
        {/* Patrón geométrico de fondo */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                45deg,
                oklch(0.90 0.01 85) 0px,
                oklch(0.90 0.01 85) 1px,
                transparent 1px,
                transparent 60px
              )
            `,
          }}
        />

        {/* Círculo decorativo */}
        <div
          className="absolute -right-32 -top-32 w-[28rem] h-[28rem] rounded-full opacity-10"
          style={{ background: 'var(--gold)' }}
        />
        <div
          className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full opacity-[0.06]"
          style={{ background: 'var(--gold)' }}
        />

        {/* Logo / Marca */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-sm"
              style={{ background: 'var(--gold)' }}
            />
            <span
              className="text-sm font-semibold tracking-widest uppercase"
              style={{ color: 'var(--gold)', fontFamily: 'var(--font-sora)' }}
            >
              App Selección
            </span>
          </div>
        </div>

        {/* Texto central */}
        <div className="relative z-10">
          <h1
            className="text-5xl font-light leading-[1.1] mb-6"
            style={{
              fontFamily: 'var(--font-fraunces)',
              color: 'oklch(0.95 0.005 85)',
            }}
          >
            Evaluaciones
            <br />
            <em
              className="not-italic font-normal"
              style={{ color: 'var(--gold)' }}
            >
              de alto estándar
            </em>
          </h1>
          <p
            className="text-sm leading-relaxed max-w-xs"
            style={{ color: 'oklch(0.65 0.02 265)' }}
          >
            Plataforma de evaluación psicológica diseñada para
            procesos de selección de personal precisos y confiables.
          </p>
        </div>

        {/* Footer del panel */}
        <div className="relative z-10">
          <div className="flex items-center gap-6">
            {['Hanói', 'IC', 'Stroop', 'Lüscher', 'Memoria'].map((test) => (
              <span
                key={test}
                className="text-xs tracking-wider uppercase opacity-40"
                style={{ color: 'oklch(0.90 0.01 85)', fontFamily: 'var(--font-sora)' }}
              >
                {test}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Panel derecho — Formulario */}
      <div className="flex items-center justify-center p-8 bg-admin-gradient">
        <div className="w-full max-w-sm">
          {/* Marca mobile */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div
              className="w-6 h-6 rounded-sm"
              style={{ background: 'var(--gold)' }}
            />
            <span
              className="text-xs font-semibold tracking-widest uppercase text-navy"
              style={{ fontFamily: 'var(--font-sora)' }}
            >
              App Selección
            </span>
          </div>

          <div className="mb-8">
            <h2
              className="text-3xl mb-2"
              style={{
                fontFamily: 'var(--font-fraunces)',
                color: 'var(--navy)',
              }}
            >
              Bienvenido
            </h2>
            <p className="text-sm text-muted-foreground">
              Ingresa tus credenciales para acceder al panel de administración.
            </p>
          </div>

          <LoginForm searchParams={searchParams} />
        </div>
      </div>
    </div>
  )
}
