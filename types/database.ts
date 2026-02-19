export type SessionStatus = 'pending' | 'in_progress' | 'completed'

export type Database = {
  public: {
    Tables: {
      tests: {
        Row: {
          id: string
          name: string
          path: string
          position: number
          has_practice: boolean
        }
        Insert: {
          id: string
          name: string
          path: string
          position?: number
          has_practice?: boolean
        }
        Update: Partial<{
          id: string
          name: string
          path: string
          position: number
          has_practice: boolean
        }>
        Relationships: []
      }
      batteries: {
        Row: {
          id: string
          name: string
          admin_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          admin_id: string
          created_at?: string
        }
        Update: Partial<{
          name: string
          admin_id: string
          created_at: string
        }>
        Relationships: [
          {
            foreignKeyName: 'batteries_admin_id_fkey'
            columns: ['admin_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      battery_tests: {
        Row: {
          battery_id: string
          test_id: string
          position: number
        }
        Insert: {
          battery_id: string
          test_id: string
          position?: number
        }
        Update: Partial<{
          battery_id: string
          test_id: string
          position: number
        }>
        Relationships: [
          {
            foreignKeyName: 'battery_tests_battery_id_fkey'
            columns: ['battery_id']
            isOneToOne: false
            referencedRelation: 'batteries'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'battery_tests_test_id_fkey'
            columns: ['test_id']
            isOneToOne: false
            referencedRelation: 'tests'
            referencedColumns: ['id']
          }
        ]
      }
      evaluation_sessions: {
        Row: {
          id: string
          token: string
          battery_id: string | null
          admin_id: string
          status: SessionStatus
          created_at: string
          started_at: string | null
          completed_at: string | null
          tests_snapshot: TestSnapshot[]
        }
        Insert: {
          id?: string
          token?: string
          battery_id?: string | null
          admin_id: string
          status?: SessionStatus
          created_at?: string
          started_at?: string | null
          completed_at?: string | null
          tests_snapshot?: TestSnapshot[]
        }
        Update: Partial<{
          battery_id: string | null
          admin_id: string
          status: SessionStatus
          started_at: string | null
          completed_at: string | null
          tests_snapshot: TestSnapshot[]
        }>
        Relationships: [
          {
            foreignKeyName: 'evaluation_sessions_battery_id_fkey'
            columns: ['battery_id']
            isOneToOne: false
            referencedRelation: 'batteries'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'evaluation_sessions_admin_id_fkey'
            columns: ['admin_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      candidates: {
        Row: {
          id: string
          session_id: string
          nombre: string
          rut: string
          registered_at: string
        }
        Insert: {
          id?: string
          session_id: string
          nombre: string
          rut: string
          registered_at?: string
        }
        Update: Partial<{
          session_id: string
          nombre: string
          rut: string
        }>
        Relationships: [
          {
            foreignKeyName: 'candidates_session_id_fkey'
            columns: ['session_id']
            isOneToOne: true
            referencedRelation: 'evaluation_sessions'
            referencedColumns: ['id']
          }
        ]
      }
      test_results: {
        Row: {
          id: string
          session_id: string
          test_id: string
          results: TestResultData
          completed_at: string
        }
        Insert: {
          id?: string
          session_id: string
          test_id: string
          results: TestResultData
          completed_at?: string
        }
        Update: Partial<{
          session_id: string
          test_id: string
          results: TestResultData
          completed_at: string
        }>
        Relationships: [
          {
            foreignKeyName: 'test_results_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'evaluation_sessions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'test_results_test_id_fkey'
            columns: ['test_id']
            isOneToOne: false
            referencedRelation: 'tests'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      session_status: SessionStatus
    }
    CompositeTypes: Record<string, never>
  }
}

export interface TestSnapshot {
  id: string
  name: string
  path: string
  has_practice: boolean
}

// Tipos de resultado por test
export interface HanoiResult {
  movimientos: number
  faltas: number
  tiempoTotal: number
  rendimiento: string
}

export interface ICResult {
  puntaje: number
  incorrectas: number
  omisiones: number
  puntuacionAjustada: number
  nivelRendimiento: string
}

export interface MemoriaResult {
  intentos: number
  tiempo: number
  erroresRepetidos: number
  puntuacionTotal: number
  rendimiento: string
}

export interface StroopResult {
  score: number
  total: number
  errors: number
  tiempoTotal: number
}

export interface LuscherResult {
  grises: number[]
  colores1: number[]
  formas: number[]
  colores2: number[]
}

export type TestResultData =
  | HanoiResult
  | ICResult
  | MemoriaResult
  | StroopResult
  | LuscherResult
  | Record<string, unknown>

export interface TestComponentProps {
  onComplete: (results: TestResultData) => void
  isPending: boolean
  hasPractice: boolean
}
