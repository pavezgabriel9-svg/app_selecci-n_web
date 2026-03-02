# Arquitectura del Proyecto — App Selección Web

> Guía completa para entender, modificar y extender la plataforma de evaluaciones psicológicas.

---

## ¿Qué es esta app?

Una plataforma web que permite a psicólogos o administradores crear **baterías de tests psicológicos**, compartir un link único con candidatos y revisar los resultados en un panel de administración.

**Flujo resumido:**
1. El admin crea una batería (agrupa tests en un orden)
2. Genera un link único (token) y lo envía al candidato
3. El candidato entra al link, llena un formulario (nombre + RUT) y completa los tests
4. El admin revisa los resultados y puede exportarlos a CSV

---

## Stack tecnológico

| Tecnología | Para qué sirve |
|---|---|
| **Next.js 16 (App Router)** | Framework principal — páginas, rutas, server actions |
| **React 19** | Interfaz de usuario interactiva |
| **TypeScript** | Tipado estático para evitar errores |
| **Supabase** | Base de datos PostgreSQL + autenticación |
| **Tailwind v4** | Estilos CSS mediante clases utilitarias |
| **shadcn/ui** | Componentes de UI preconstruidos (botones, cards, etc.) |
| **Zod** | Validación de formularios y datos |
| **React Hook Form** | Manejo de estado de formularios |

---

## Mapa del proyecto

```
app_seleccion_web/
│
├── app/                          ← Rutas y páginas (Next.js App Router)
│   ├── (auth)/login/             ← Página de login pública
│   ├── (admin)/                  ← Panel de administración (requiere login)
│   │   ├── dashboard/            ← Estadísticas generales
│   │   ├── baterias/             ← Gestión de baterías de tests
│   │   └── resultados/           ← Ver y exportar resultados
│   └── (eval)/eval/[token]/      ← Evaluación pública para candidatos
│       ├── page.tsx              ← Formulario de ingreso (nombre + RUT)
│       ├── [testId]/             ← Página de cada test
│       └── gracias/              ← Página de agradecimiento final
│
├── components/                   ← Componentes React reutilizables
│   ├── admin/                    ← Componentes del panel admin
│   │   ├── sidebar.tsx           ← Menú lateral de navegación
│   │   ├── topbar.tsx            ← Barra superior con menú de usuario
│   │   └── resultados-table.tsx  ← Tabla con búsqueda y exportación CSV
│   ├── tests/                    ← Los 5 tests psicológicos
│   │   ├── hanoi.tsx             ← Torre de Hanói
│   │   ├── ic.tsx                ← Inventario de Capacidades
│   │   ├── stroop.tsx            ← Test de Stroop
│   │   ├── memoria.tsx           ← Memoria y secuencias
│   │   └── luscher.tsx           ← Colores de Lüscher
│   └── ui/                       ← Componentes base de shadcn/ui
│       └── button, card, input, table, badge, avatar...
│
├── lib/                          ← Utilidades y configuración
│   ├── supabase/
│   │   ├── server.ts             ← Cliente Supabase para el servidor
│   │   └── client.ts             ← Cliente Supabase para el navegador
│   └── utils.ts                  ← Función cn() para combinar clases CSS
│
└── types/
    └── database.ts               ← Tipos TypeScript de toda la base de datos
```

---

## Los tres mundos del proyecto

El proyecto está dividido en 3 grupos de rutas (route groups de Next.js). Esto solo organiza carpetas — no crea URLs con esos nombres.

### 1. `(auth)` — Autenticación
- **Solo tiene**: la página `/login`
- **Quién la ve**: cualquier persona no autenticada
- **Tiene su propio layout**: mínimo, sin barra de navegación

### 2. `(admin)` — Panel de administración
- **Rutas**: `/dashboard`, `/baterias`, `/baterias/nueva`, `/baterias/:id`, `/resultados`, `/resultados/:id`
- **Quién la ve**: solo administradores autenticados (si no hay sesión, redirige a `/login`)
- **Layout compartido**: sidebar izquierdo + topbar superior (definidos en `app/(admin)/layout.tsx`)

### 3. `(eval)` — Evaluación de candidatos
- **Rutas**: `/eval/:token`, `/eval/:token/:testId`, `/eval/:token/gracias`
- **Quién la ve**: cualquier persona con el link (no requiere login)
- **Layout limpio**: sin navegación, diseño centrado para el candidato

---

## Cómo funciona la base de datos

```
tests           ← Catálogo fijo de tests (no se modifica)
    id, name, path, position, has_practice

batteries       ← Creadas por admins
    id, name, admin_id, created_at

battery_tests   ← Qué tests tiene cada batería (y en qué orden)
    battery_id, test_id, position

evaluation_sessions  ← Una sesión por cada link generado
    id, token, battery_id, status, tests_snapshot(JSONB)
    status: 'pending' → 'in_progress' → 'completed'

candidates      ← Datos del candidato al iniciar la evaluación
    id, session_id, nombre, rut, registered_at

test_results    ← Resultado de cada test completado
    id, session_id, test_id, results(JSONB), completed_at
```

**Concepto clave — `tests_snapshot`**: cuando se crea la sesión, se guarda una copia de los tests de la batería en ese momento. Así, si el admin modifica la batería después, las evaluaciones ya iniciadas no se ven afectadas.

---

## Cómo se guardan datos (Server Actions)

En lugar de APIs REST, el proyecto usa **Server Actions** de Next.js: funciones que corren en el servidor, llamadas directamente desde componentes de React.

### Acciones disponibles

| Archivo | Acción | Descripción |
|---|---|---|
| `(auth)/login/actions.ts` | `loginAction` | Inicia sesión con email/contraseña |
| `(auth)/login/actions.ts` | `logoutAction` | Cierra sesión y redirige al login |
| `(admin)/baterias/actions.ts` | `createBatteryAction` | Crea batería + tests asociados |
| `(admin)/baterias/actions.ts` | `deleteBatteryAction` | Elimina batería (verifica dueño) |
| `(admin)/baterias/actions.ts` | `createEvaluationAction` | Genera token único para evaluación |
| `(eval)/eval/actions.ts` | `startEvaluationAction` | Registra candidato, inicia sesión |
| `(eval)/eval/actions.ts` | `completeTestAction` | Guarda resultado y avanza al siguiente test |

### Cómo llamar una Server Action desde un componente

```tsx
// En un Server Component (page.tsx) con un formulario:
import { createBatteryAction } from './actions'

export default function Page() {
  return (
    <form action={createBatteryAction}>
      <input name="name" />
      <button type="submit">Crear</button>
    </form>
  )
}
```

```tsx
// En un Client Component con useActionState:
'use client'
import { useActionState } from 'react'
import { loginAction } from './actions'

export function LoginForm() {
  const [state, action, isPending] = useActionState(loginAction, null)
  return (
    <form action={action}>
      {/* inputs */}
      <button disabled={isPending}>Ingresar</button>
    </form>
  )
}
```

---

## Los 5 tests psicológicos

Todos los tests siguen el mismo contrato de interfaz:

```typescript
interface TestProps {
  onComplete: (results: TestResultData) => void  // se llama al terminar el test
  isPending: boolean                              // true mientras se guarda en BD
  hasPractice: boolean                           // si debe mostrar ronda de práctica
}
```

`HanoiTest` extiende este contrato con props adicionales:

```typescript
interface HanoiProps extends TestProps {
  variant: 'medio' | 'dificil'  // configura torres, discos y tiempo
  candidateName?: string         // muestra "¡Gracias, [Nombre]!" en la pantalla final
}
```

### Dónde están

```
components/tests/
├── hanoi.tsx     → Torre de Hanói (variante: 'medio' | 'dificil') — tablero full-screen
├── ic.tsx        → Inventario de Capacidades (25 preguntas, timer 7 min)
├── stroop.tsx    → Test de Stroop (colores vs palabras)
├── memoria.tsx   → Memoria de pares de cartas
└── luscher.tsx   → Colores de Lüscher (4 pasos)
```

### Cómo el test runner carga el test correcto

En `app/(eval)/eval/[token]/[testId]/test-runner.tsx` hay un mapa que conecta el `path` del test (guardado en la tabla `tests`) con el componente React correspondiente:

```typescript
// Simplificado
const testMap = {
  'hanoi-dificil': <HanoiTest variant="dificil" candidateName={candidateName} ... />,
  'hanoi-medio':   <HanoiTest variant="medio"   candidateName={candidateName} ... />,
  'ic':            <ICTest ... />,
  'stroop':        <StroopTest ... />,
  'memoria':       <MemoriaTest ... />,
  'luscher':       <LuscherTest ... />,
}
```

`candidateName` viene del campo `nombre` del registro `candidates` asociado a la sesión y se pasa únicamente a `HanoiTest` para personalizar la pantalla de agradecimiento.

---

## Diseño visual — Sistema de colores

El diseño usa una paleta "clínico-premium" definida en `app/globals.css`:

| Variable | Color | Uso |
|---|---|---|
| `--navy` | Azul oscuro | Fondo del sidebar, botones primarios |
| `--gold` | Dorado/ámbar | Acentos, links activos, highlights |
| `--cream` | Crema cálido | Fondo del admin panel |
| Destructivo | Rojo | Errores, acciones peligrosas |

**Tipografías:**
- `Fraunces` (serif) — Títulos y headings (`font-display`)
- `Sora` (sans-serif) — Texto general y UI
- `Geist Mono` — Código y datos técnicos

**Clases utilitarias especiales:**
- `.bg-admin-gradient` — Gradiente sutil para fondos admin
- `.gold-line` — Línea decorativa dorada bajo títulos
- `.noise-texture` — Textura de ruido sutil
- `.transition-base` — Transición suave estándar (0.2s)

---

## Clientes de Supabase — cuándo usar cada uno

```typescript
// lib/supabase/server.ts

// Para rutas de admin (usuario autenticado):
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
// → Respeta RLS (Row-Level Security), filtra por usuario logueado

// Para acciones de evaluación (candidato no autenticado):
import { createServiceClient } from '@/lib/supabase/server'
const supabase = createServiceClient()
// → Saltea RLS con service_role key — usar SOLO en server actions confiables
```

---

## Guía: Cómo modificar componentes existentes

### Modificar el Sidebar (agregar una nueva sección)

Archivo: [components/admin/sidebar.tsx](components/admin/sidebar.tsx)

```tsx
// Busca el array de navegación y agrega un ítem:
const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/baterias',  icon: ClipboardList,   label: 'Baterías'  },
  { href: '/resultados',icon: BarChart2,        label: 'Resultados'},
  // → Agrega aquí:
  { href: '/candidatos', icon: Users, label: 'Candidatos' },
]
```

### Modificar un test (cambiar preguntas, tiempo, lógica)

Cada test es autocontenido en su archivo. Ejemplo para cambiar el tiempo del IC:

Archivo: [components/tests/ic.tsx](components/tests/ic.tsx)

```tsx
// Busca la constante de tiempo (en segundos)
const TIEMPO_LIMITE = 7 * 60  // 7 minutos → cambia a 10 * 60 para 10 min
```

### Modificar la Torre de Hanói

Archivo: [components/tests/hanoi.tsx](components/tests/hanoi.tsx)

El tablero se renderiza en pantalla completa (`position: fixed; inset: 0`) durante las fases `practica` y `real`. Las fases de instrucciones, práctica completada y resultado se renderizan dentro del card normal.

```typescript
// Cambiar torres, discos y tiempo por variante:
const CONFIG = {
  medio:   { towerCount: 4, discCount: 5, timeLimit: 5 * 60 },
  dificil: { towerCount: 3, discCount: 5, timeLimit: 8 * 60 },
}

// Anchos de disco como % del ancho de la torre (responsivos):
const DISC_WIDTHS_PCT = [0, 34, 50, 63, 77, 92]  // índice = número de disco
```

La pantalla de resultado **no muestra el puntaje al candidato** — solo un mensaje de agradecimiento. Los datos (movimientos, faltas, tiempo, rendimiento) se guardan en BD vía `onComplete`.

### Modificar la tabla de resultados (agregar columnas)

Archivo: [components/admin/resultados-table.tsx](components/admin/resultados-table.tsx)

La tabla recibe datos como prop. Para agregar una columna:
1. Agrega el campo en el header de la tabla
2. Agrega la celda correspondiente en el map de filas
3. Si el dato viene de la BD, actualiza la query en `app/(admin)/resultados/page.tsx`

### Agregar un campo al formulario de nueva batería

Archivo: [app/(admin)/baterias/nueva/nueva-bateria-form.tsx](app/(admin)/baterias/nueva/nueva-bateria-form.tsx)

1. Agrega el campo al schema Zod en `baterias/actions.ts`
2. Agrega el input en el formulario
3. Actualiza `createBatteryAction` para usar el nuevo campo en el INSERT

---

## Guía: Cómo agregar nuevas funcionalidades

### Agregar una nueva página al panel admin

1. Crea la carpeta en `app/(admin)/nueva-seccion/`
2. Crea `page.tsx` — es un Server Component por defecto
3. Fetch datos con `createClient()` de Supabase directamente en el componente
4. Agrega el link al sidebar (ver arriba)

```tsx
// app/(admin)/candidatos/page.tsx
import { createClient } from '@/lib/supabase/server'

export default async function CandidatosPage() {
  const supabase = await createClient()
  const { data: candidatos } = await supabase
    .from('candidates')
    .select('*, evaluation_sessions(status)')
    .order('registered_at', { ascending: false })

  return (
    <div>
      <h1>Candidatos</h1>
      {/* tabla con candidatos */}
    </div>
  )
}
```

### Agregar un nuevo test psicológico

Esto requiere cambios en varios lugares:

**Paso 1 — Crear el componente del test**

```tsx
// components/tests/mi-nuevo-test.tsx
'use client'

interface MiTestProps {
  onComplete: (results: MiTestResult) => void
  isPending: boolean
  hasPractice: boolean
}

export function MiNuevoTest({ onComplete, isPending, hasPractice }: MiTestProps) {
  // Lógica del test...
  const handleFinish = () => {
    onComplete({ puntaje: 90, tiempo: 120 })
  }
  return <div>...</div>
}
```

**Paso 2 — Agregar el tipo de resultado** en [types/database.ts](types/database.ts):

```typescript
export type MiTestResult = {
  puntaje: number
  tiempo: number
  // otros campos...
}

// Agregar al union type de resultados:
export type TestResultData = HanoiResult | ICResult | ... | MiTestResult
```

**Paso 3 — Registrar en la base de datos**

Insertar en la tabla `tests`:
```sql
INSERT INTO tests (name, path, position, has_practice)
VALUES ('Mi Nuevo Test', 'mi-nuevo-test', 6, false);
```

**Paso 4 — Agregar al mapa del test runner** en [app/(eval)/eval/[token]/[testId]/test-runner.tsx](app/(eval)/eval/[token]/[testId]/test-runner.tsx):

```typescript
import { MiNuevoTest } from '@/components/tests/mi-nuevo-test'

// En el mapa de tests:
'mi-nuevo-test': <MiNuevoTest onComplete={handleComplete} isPending={isPending} hasPractice={hasPractice} />
```

### Agregar un componente shadcn/ui nuevo

```bash
npx shadcn@latest add dialog
npx shadcn@latest add select
npx shadcn@latest add tooltip
```

El componente queda disponible en `components/ui/` listo para importar.

### Agregar una nueva Server Action

```typescript
// app/(admin)/mi-seccion/actions.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const schema = z.object({
  nombre: z.string().min(1),
})

export async function miAccion(formData: FormData) {
  const supabase = await createClient()

  // Validar datos
  const parsed = schema.safeParse({
    nombre: formData.get('nombre'),
  })
  if (!parsed.success) {
    return { error: 'Datos inválidos' }
  }

  // Operación en BD
  const { error } = await supabase
    .from('mi_tabla')
    .insert(parsed.data)

  if (error) return { error: error.message }

  revalidatePath('/mi-seccion')  // Refrescar cache de la página
  redirect('/mi-seccion')
}
```

---

## Guía: Dónde reutilizar componentes existentes

### Componentes listos para reutilizar

| Componente | Archivo | Cuándo reutilizarlo |
|---|---|---|
| `<Button>` | `components/ui/button.tsx` | Cualquier botón de acción |
| `<Card>` + `<CardHeader>` + `<CardContent>` | `components/ui/card.tsx` | Contenedores de información |
| `<Input>` | `components/ui/input.tsx` | Campos de texto en formularios |
| `<Badge>` | `components/ui/badge.tsx` | Etiquetas de estado |
| `<Table>` | `components/ui/table.tsx` | Tablas de datos |
| `<Avatar>` | `components/ui/avatar.tsx` | Foto de perfil con fallback |
| `<Separator>` | `components/ui/separator.tsx` | Divisores visuales |

### Patrón de tarjeta estadística (reutilizable en dashboard)

```tsx
// Usado en app/(admin)/dashboard/page.tsx — fácil de copiar para otras estadísticas
<Card>
  <CardHeader className="pb-2">
    <CardDescription>Etiqueta</CardDescription>
    <CardTitle className="text-3xl font-display">42</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground">Descripción adicional</p>
  </CardContent>
</Card>
```

### Patrón de botón con acción destructiva

```tsx
// Reutiliza el patrón de delete-battery-button.tsx
'use client'
import { Button } from '@/components/ui/button'
import { useTransition } from 'react'

export function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="destructive"
      disabled={isPending}
      onClick={() => startTransition(() => miAccionEliminar(id))}
    >
      {isPending ? 'Eliminando...' : 'Eliminar'}
    </Button>
  )
}
```

### Función `cn()` para clases dinámicas

```tsx
import { cn } from '@/lib/utils'

// Combina clases estáticas con condicionales:
<div className={cn(
  'base-class p-4 rounded',
  isActive && 'bg-navy text-white',
  isError && 'border-red-500',
)}>
```

---

## Patrones de código frecuentes

### Fetch de datos en Server Component (page.tsx)

```tsx
// app/(admin)/mi-pagina/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function MiPagina() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')  // protección de ruta

  const { data, error } = await supabase
    .from('mi_tabla')
    .select('*')
    .eq('admin_id', user.id)

  return <div>{/* renderizar data */}</div>
}
```

### Formulario con validación Zod + React Hook Form

```tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
})

export function MiFormulario() {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '' }
  })

  return (
    <form onSubmit={form.handleSubmit(data => console.log(data))}>
      <Input {...form.register('nombre')} />
      {form.formState.errors.nombre && (
        <p className="text-destructive text-sm">
          {form.formState.errors.nombre.message}
        </p>
      )}
      <Button type="submit">Guardar</Button>
    </form>
  )
}
```

---

## Errores comunes a evitar

| Error | Solución |
|---|---|
| Usar `createClient()` en eval (candidato no autenticado) | Usar `createServiceClient()` en las actions de eval |
| Modificar datos de una evaluación en curso cambiando la batería | Los datos están protegidos por `tests_snapshot` — no afecta |
| Confiar en el cliente para saber la posición del test | Siempre contar los `test_results` guardados en BD (anti-skip) |
| Olvidar `'use client'` en componentes con estado o eventos | Agregar directiva al inicio del archivo |
| Olvidar `revalidatePath()` después de una mutación | Sin esto, Next.js muestra datos cacheados desactualizados |

---

## Puntos de mejora y posibles implementaciones

### Mejoras de funcionalidad inmediatas

**1. Notificaciones por email al candidato**
Enviar un correo de confirmación cuando el candidato completa la evaluación. Integrar con Resend o SendGrid desde una Server Action.

**2. Reenvío automático del link de evaluación**
Agregar un botón en la vista de batería para reenviar el link por email directamente desde el panel admin.

**3. Edición de baterías existentes**
Actualmente las baterías no se pueden editar una vez creadas. Agregar una página `/baterias/:id/editar` con la misma estructura del formulario de creación.

**4. Límite de tiempo para completar la evaluación**
Agregar un campo `expires_at` en `evaluation_sessions` para que los links tengan expiración (ej: 48 horas).

**5. Vista previa de tests para el admin**
Agregar una ruta `/baterias/:id/preview` donde el admin pueda ver cómo se verá cada test sin afectar estadísticas.

---

### Mejoras de experiencia de usuario

**6. Modo oscuro**
El archivo `globals.css` ya tiene soporte para `next-themes`. Solo falta agregar tokens de color en `:root.dark {}` y un toggle en el topbar.

**7. Dashboard con gráficos**
Agregar visualizaciones con Recharts o Chart.js para el dashboard: evolución de evaluaciones en el tiempo, distribución de resultados por test, etc.

**8. Ordenar y filtrar resultados avanzado**
Actualmente la búsqueda filtra por nombre/RUT. Agregar filtros por: estado de sesión, rango de fechas, batería específica.

**9. Paginación del lado del servidor**
La tabla de resultados carga todos los datos y filtra en cliente. Para grandes volúmenes, mover la búsqueda y paginación a la query de Supabase.

**10. Indicador de progreso en evaluación**
Mejorar la barra de progreso del candidato para mostrar el nombre del test actual y tiempo estimado restante.

---

### Mejoras de arquitectura y seguridad

**11. Rate limiting en acciones de evaluación**
Agregar middleware para limitar intentos de acceso a `/eval/:token` y prevenir abuso (ej: con Upstash Rate Limit).

**12. Logs de auditoría**
Crear una tabla `audit_log` que registre acciones importantes: quién creó qué batería, cuándo se generaron links, intentos de acceso fallidos.

**13. Roles de usuario (admin / super-admin)**
Actualmente todos los admins autenticados son iguales. Agregar un campo `role` en la tabla de usuarios para restringir ciertas acciones.

**14. Tests con múltiples variantes configurables**
Hacer que el admin pueda configurar parámetros de tests al asignarlos a una batería (ej: elegir dificultad del Hanói, número de preguntas del IC).

**15. Exportación a PDF**
Agregar exportación de resultados individuales a PDF con `@react-pdf/renderer` o `puppeteer`, formateado como informe psicológico.

---

### Nuevos tests posibles

**16. Test de atención sostenida (Toulouse)**
Marcar símbolos objetivo entre distractores en tiempo limitado. Similar en estructura al IC.

**17. Test de razonamiento abstracto**
Matrices de patrones (estilo IQ matrix). Componente con imágenes SVG y opciones múltiples.

**18. Escala de personalidad (Big Five)**
Cuestionario de 50 preguntas con escala Likert. El resultado es un perfil de 5 dimensiones.

---

### Mejoras de infraestructura

**19. Soporte multi-idioma (i18n)**
Agregar `next-intl` para tener la evaluación disponible en español e inglés. Crítico si la plataforma se usa para empresas internacionales.

**20. Webhooks al completar evaluación**
Emitir un webhook a una URL configurable cuando una sesión cambia a `completed`. Permite integrar con sistemas externos (HRIS, ATS).

**21. Sistema de plantillas de baterías**
Guardar baterías "plantilla" predefinidas que el admin pueda clonar rápidamente en lugar de armar cada batería desde cero.
