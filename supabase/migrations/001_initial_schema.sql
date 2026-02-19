-- =============================================================
-- App Selección Web — Schema inicial
-- Ejecutar en Supabase: SQL Editor > New Query
-- =============================================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------
-- 1. Catálogo de tests (seed fijo, no editable por el admin)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tests (
  id        TEXT PRIMARY KEY,           -- e.g. 'hanoi-medio'
  name      TEXT NOT NULL,              -- e.g. 'Hanói - Versión Media'
  path      TEXT NOT NULL,              -- e.g. 'hanoi-medio'
  position  INTEGER NOT NULL DEFAULT 0, -- orden de presentación
  has_practice BOOLEAN NOT NULL DEFAULT false
);

-- Seed con los 6 tests actuales
INSERT INTO tests (id, name, path, position, has_practice) VALUES
  ('hanoi-medio',   'Hanói — Versión Media',   'hanoi-medio',   1, true),
  ('hanoi-dificil', 'Hanói — Versión Difícil', 'hanoi-dificil', 2, true),
  ('ic',            'IC',                       'ic',            3, false),
  ('memoria',       'Memoria',                  'memoria',       4, true),
  ('stroop',        'Stroop',                   'stroop',        5, true),
  ('luscher',       'Lüscher',                  'luscher',       6, false)
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------------
-- 2. Baterías de tests
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS batteries (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  admin_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS battery_tests (
  battery_id UUID NOT NULL REFERENCES batteries(id) ON DELETE CASCADE,
  test_id    TEXT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  position   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (battery_id, test_id)
);

-- -------------------------------------------------------------
-- 3. Sesiones de evaluación
-- -------------------------------------------------------------
CREATE TYPE session_status AS ENUM ('pending', 'in_progress', 'completed');

CREATE TABLE IF NOT EXISTS evaluation_sessions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token        UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(), -- link del candidato
  battery_id   UUID REFERENCES batteries(id) ON DELETE SET NULL,
  admin_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status       session_status NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  -- Tests en orden al momento de crear la sesión (snapshot del battery)
  tests_snapshot JSONB NOT NULL DEFAULT '[]'
);

-- -------------------------------------------------------------
-- 4. Datos del candidato (se llenan al iniciar la evaluación)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS candidates (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id   UUID UNIQUE NOT NULL REFERENCES evaluation_sessions(id) ON DELETE CASCADE,
  nombre       TEXT NOT NULL,
  rut          TEXT NOT NULL,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 5. Resultados por test (se guardan al completar cada prueba)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS test_results (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id   UUID NOT NULL REFERENCES evaluation_sessions(id) ON DELETE CASCADE,
  test_id      TEXT NOT NULL REFERENCES tests(id),
  results      JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, test_id)
);

-- -------------------------------------------------------------
-- Row Level Security
-- -------------------------------------------------------------

ALTER TABLE batteries ENABLE ROW LEVEL SECURITY;
ALTER TABLE battery_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

-- Solo el admin dueño puede ver/modificar sus baterías
CREATE POLICY "admin_own_batteries" ON batteries
  FOR ALL USING (admin_id = auth.uid());

CREATE POLICY "admin_own_battery_tests" ON battery_tests
  FOR ALL USING (
    battery_id IN (SELECT id FROM batteries WHERE admin_id = auth.uid())
  );

-- Sesiones: admin ve las suyas; candidatos acceden por token (via service role en server actions)
CREATE POLICY "admin_own_sessions" ON evaluation_sessions
  FOR ALL USING (admin_id = auth.uid());

-- Candidatos y resultados: acceso solo via service_role en Server Actions
-- (los candidatos no están autenticados con Supabase Auth)
CREATE POLICY "admin_own_candidates" ON candidates
  FOR SELECT USING (
    session_id IN (SELECT id FROM evaluation_sessions WHERE admin_id = auth.uid())
  );

CREATE POLICY "admin_own_results" ON test_results
  FOR SELECT USING (
    session_id IN (SELECT id FROM evaluation_sessions WHERE admin_id = auth.uid())
  );

-- Tests (catálogo): lectura pública
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tests_public_read" ON tests FOR SELECT USING (true);
