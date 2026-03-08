-- ============================================================
-- MIGRATION 002 — Reestructuración a 3 roles
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================
--
-- NUEVA JERARQUÍA DE ROLES:
--   user        → rol base (antes: admin)
--   admin       → acceso total a datos + gestión de users (antes: super_admin)
--   super_admin → máximo nivel, puede banear admins
--
-- PASOS PREVIOS OBLIGATORIOS (en Supabase Dashboard → Authentication → Users):
--   1. Usuarios con role "admin"       → cambiar a "user"
--   2. Usuarios con role "super_admin" → cambiar a "admin"
--   3. Asignar "super_admin" al usuario de mayor jerarquía
--
-- ============================================================


-- ─── 1. FUNCIÓN: admin o superior (acceso a todos los datos) ─────────────────
-- Retorna true para 'admin' y 'super_admin'

CREATE OR REPLACE FUNCTION is_admin_or_above()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin'),
    false
  );
$$;


-- ─── 2. FUNCIÓN: super_admin (solo nivel máximo) ──────────────────────────────
-- Retorna true únicamente para 'super_admin'

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin',
    false
  );
$$;


-- ─── 3. POLÍTICAS: batteries ──────────────────────────────────────────────────

DROP POLICY IF EXISTS "batteries_select" ON batteries;
DROP POLICY IF EXISTS "batteries_insert" ON batteries;
DROP POLICY IF EXISTS "batteries_update" ON batteries;
DROP POLICY IF EXISTS "batteries_delete" ON batteries;

CREATE POLICY "batteries_select" ON batteries
  FOR SELECT TO authenticated
  USING (admin_id = auth.uid() OR is_admin_or_above());

CREATE POLICY "batteries_insert" ON batteries
  FOR INSERT TO authenticated
  WITH CHECK (admin_id = auth.uid() OR is_admin_or_above());

CREATE POLICY "batteries_update" ON batteries
  FOR UPDATE TO authenticated
  USING (admin_id = auth.uid() OR is_admin_or_above())
  WITH CHECK (admin_id = auth.uid() OR is_admin_or_above());

CREATE POLICY "batteries_delete" ON batteries
  FOR DELETE TO authenticated
  USING (admin_id = auth.uid() OR is_admin_or_above());


-- ─── 4. POLÍTICAS: evaluation_sessions ───────────────────────────────────────

DROP POLICY IF EXISTS "sessions_select" ON evaluation_sessions;
DROP POLICY IF EXISTS "sessions_insert" ON evaluation_sessions;
DROP POLICY IF EXISTS "sessions_update" ON evaluation_sessions;

CREATE POLICY "sessions_select" ON evaluation_sessions
  FOR SELECT TO authenticated
  USING (admin_id = auth.uid() OR is_admin_or_above());

CREATE POLICY "sessions_insert" ON evaluation_sessions
  FOR INSERT TO authenticated
  WITH CHECK (admin_id = auth.uid() OR is_admin_or_above());

CREATE POLICY "sessions_update" ON evaluation_sessions
  FOR UPDATE TO authenticated
  USING (admin_id = auth.uid() OR is_admin_or_above())
  WITH CHECK (admin_id = auth.uid() OR is_admin_or_above());


-- ─── 5. POLÍTICAS: candidates ─────────────────────────────────────────────────

DROP POLICY IF EXISTS "candidates_select" ON candidates;

CREATE POLICY "candidates_select" ON candidates
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM evaluation_sessions es
      WHERE es.id = candidates.session_id
        AND (es.admin_id = auth.uid() OR is_admin_or_above())
    )
  );


-- ─── 6. POLÍTICAS: test_results ──────────────────────────────────────────────

DROP POLICY IF EXISTS "test_results_select" ON test_results;

CREATE POLICY "test_results_select" ON test_results
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM evaluation_sessions es
      WHERE es.id = test_results.session_id
        AND (es.admin_id = auth.uid() OR is_admin_or_above())
    )
  );


-- ─── 7. POLÍTICAS: battery_tests ─────────────────────────────────────────────

DROP POLICY IF EXISTS "battery_tests_all" ON battery_tests;

CREATE POLICY "battery_tests_all" ON battery_tests
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM batteries b
      WHERE b.id = battery_tests.battery_id
        AND (b.admin_id = auth.uid() OR is_admin_or_above())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM batteries b
      WHERE b.id = battery_tests.battery_id
        AND (b.admin_id = auth.uid() OR is_admin_or_above())
    )
  );


-- ─── 8. POLÍTICAS: tests (catálogo público de lectura) ───────────────────────

DROP POLICY IF EXISTS "tests_public_read" ON tests;

CREATE POLICY "tests_public_read" ON tests
  FOR SELECT
  USING (true);

-- ============================================================
-- FIN DE LA MIGRACIÓN 002
-- ============================================================
