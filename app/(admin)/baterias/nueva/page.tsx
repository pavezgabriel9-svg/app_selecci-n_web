import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { NuevaBateriaForm } from './nueva-bateria-form'

export const metadata: Metadata = { title: 'Nueva batería' }

export default async function NuevaBateriaPage() {
  const supabase = await createClient()

  const { data: tests } = await supabase
    .from('tests')
    .select('id, name, has_practice, position')
    .order('position', { ascending: true })

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/baterias" className="hover:text-navy transition-colors">
          Baterías
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground/70">Nueva batería</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-4xl font-light text-navy gold-line">Nueva batería</h1>
        <p className="text-sm text-muted-foreground mt-4">
          Nombra tu batería y selecciona las pruebas que la componen.
          El orden de selección determina la secuencia de evaluación.
        </p>
      </div>

      {/* Form */}
      <NuevaBateriaForm tests={tests ?? []} />
    </div>
  )
}
