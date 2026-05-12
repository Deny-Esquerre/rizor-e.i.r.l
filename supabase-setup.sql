-- ============================================================
-- SCRIPT COMPLETO - Crear tablas y buckets para documentos
-- Ejecutar en Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. TABLA: invoices (nueva)
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  file_name TEXT DEFAULT '',
  file_path TEXT DEFAULT '',
  file_size BIGINT DEFAULT 0,
  file_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABLA: permissions (agregar columnas faltantes)
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS file_name TEXT DEFAULT '';
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS file_path TEXT DEFAULT '';
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0;
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS file_url TEXT DEFAULT '';

-- 3. TABLA: reports (agregar file_size)
ALTER TABLE reports ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0;

-- 4. TABLA: others (agregar file_size)
ALTER TABLE others ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0;

-- 5. POLÍTICAS RLS (permitir CRUD a usuarios autenticados)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE others ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Permitir todo a usuarios autenticados') THEN
    CREATE POLICY "Permitir todo a usuarios autenticados" ON invoices
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'permissions' AND policyname = 'Permitir todo a usuarios autenticados') THEN
    CREATE POLICY "Permitir todo a usuarios autenticados" ON permissions
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reports' AND policyname = 'Permitir todo a usuarios autenticados') THEN
    CREATE POLICY "Permitir todo a usuarios autenticados" ON reports
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'others' AND policyname = 'Permitir todo a usuarios autenticados') THEN
    CREATE POLICY "Permitir todo a usuarios autenticados" ON others
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- ============================================================
-- NOTA: Los buckets de Storage DEBEN crearse manualmente desde
-- Supabase Dashboard > Storage > Create bucket:
--   - invoices (public)
--   - permissions (public)
--   - reports (public)
--   - others (public)
-- (contracts ya debería existir)
-- ============================================================
