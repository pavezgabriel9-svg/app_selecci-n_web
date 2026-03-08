-- ============================================================
-- MIGRATION 001 — RLS Policies + Performance Indexes
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================
--
-- PASO PREVIO OBLIGATORIO — Asignar rol super_admin al admin principal:
-- 1. Ve a Authentication → Users
-- 2. Selecciona el usuario admin principal
-- 3. En la sección "App Metadata" agrega: { "role": "super_admin" }
-- 4. Guarda los cambios
--
-- Los demás admins que crees desde la UI de /usuarios tendrán role: "admin"
-- automáticamente.
-- ============================================================

-- ─── 1. ÍNDICES DE PERFORMANCE ──────────────────────────────────────────────

-- Token único de sesión (lookup crítico en cada evaluación)
CREATE UNIQUE INDEX IF NOT EXISTS idx_eval_sessions_token
  ON evaluation_sessions(token);

-- Lookup de sesiones por admin (listado de resultados/baterías)
CREATE INDEX IF NOT EXISTS idx_eval_sessions_admin
  ON evaluation_sessions(admin_id);

-- Prevención de doble-submit (completeTestAction lo consulta en cada submit)
CREATE INDEX IF NOT EXISTS idx_test_results_session_test
  ON test_results(session_id, test_id);

-- Lookup de baterías por admin
CREATE INDEX IF NOT EXISTS idx_batteries_admin
  ON batteries(admin_id);

-- Lookup de candidatos por sesión
CREATE INDEX IF NOT EXISTS idx_candidates_session
  ON candidates(session_id);


-- ─── 2. HABILITAR RLS ────────────────────────────────────────────────────────

ALTER TABLE batteries           ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates          ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results        ENABLE ROW LEVEL SECURITY;
ALTER TABLE battery_tests       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests               ENABLE ROW LEVEL SECURITY;


-- ─── 3. HELPER FUNCTION — verifica rol super_admin desde JWT ─────────────────
-- Más eficiente que repetir el cast en cada política

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin';
$$;


-- ─── 4. POLÍTICAS: batteries ──────────────────────────────────────────────────
-- DROP IF EXISTS hace el script re-ejecutable sin errores

DROP POLICY IF EXISTS "batteries_select" ON batteries;
DROP POLICY IF EXISTS "batteries_insert" ON batteries;
DROP POLICY IF EXISTS "batteries_update" ON batteries;
DROP POLICY IF EXISTS "batteries_delete" ON batteries;

CREATE POLICY "batteries_select" ON batteries
  FOR SELECT TO authenticated
  USING (admin_id = auth.uid() OR is_super_admin());

CREATE POLICY "batteries_insert" ON batteries
  FOR INSERT TO authenticated
  WITH CHECK (admin_id = auth.uid() OR is_super_admin());

CREATE POLICY "batteries_update" ON batteries
  FOR UPDATE TO authenticated
  USING (admin_id = auth.uid() OR is_super_admin())
  WITH CHECK (admin_id = auth.uid() OR is_super_admin());

CREATE POLICY "batteries_delete" ON batteries
  FOR DELETE TO authenticated
  USING (admin_id = auth.uid() OR is_super_admin());


-- ─── 5. POLÍTICAS: evaluation_sessions ───────────────────────────────────────

DROP POLICY IF EXISTS "sessions_select" ON evaluation_sessions;
DROP POLICY IF EXISTS "sessions_insert" ON evaluation_sessions;
DROP POLICY IF EXISTS "sessions_update" ON evaluation_sessions;

CREATE POLICY "sessions_select" ON evaluation_sessions
  FOR SELECT TO authenticated
  USING (admin_id = auth.uid() OR is_super_admin());

CREATE POLICY "sessions_insert" ON evaluation_sessions
  FOR INSERT TO authenticated
  WITH CHECK (admin_id = auth.uid() OR is_super_admin());

CREATE POLICY "sessions_update" ON evaluation_sessions
  FOR UPDATE TO authenticated
  USING (admin_id = auth.uid() OR is_super_admin())
  WITH CHECK (admin_id = auth.uid() OR is_super_admin());


-- ─── 6. POLÍTICAS: candidates ─────────────────────────────────────────────────
-- Solo SELECT para admins autenticados (INSERT/UPDATE se hace con service_role)

DROP POLICY IF EXISTS "candidates_select" ON candidates;

CREATE POLICY "candidates_select" ON candidates
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM evaluation_sessions es
      WHERE es.id = candidates.session_id
        AND (es.admin_id = auth.uid() OR is_super_admin())
    )
  );


-- ─── 7. POLÍTICAS: test_results ──────────────────────────────────────────────

DROP POLICY IF EXISTS "test_results_select" ON test_results;

CREATE POLICY "test_results_select" ON test_results
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM evaluation_sessions es
      WHERE es.id = test_results.session_id
        AND (es.admin_id = auth.uid() OR is_super_admin())
    )
  );


-- ─── 8. POLÍTICAS: battery_tests ─────────────────────────────────────────────

DROP POLICY IF EXISTS "battery_tests_all" ON battery_tests;

CREATE POLICY "battery_tests_all" ON battery_tests
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM batteries b
      WHERE b.id = battery_tests.battery_id
        AND (b.admin_id = auth.uid() OR is_super_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM batteries b
      WHERE b.id = battery_tests.battery_id
        AND (b.admin_id = auth.uid() OR is_super_admin())
    )
  );


-- ─── 9. POLÍTICAS: tests (catálogo público de lectura) ───────────────────────

DROP POLICY IF EXISTS "tests_public_read" ON tests;

CREATE POLICY "tests_public_read" ON tests
  FOR SELECT
  USING (true);

-- ============================================================
-- FIN DE LA MIGRACIÓN
-- Verifica que no hay errores antes de continuar con el código.
-- ============================================================
