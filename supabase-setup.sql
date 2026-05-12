-- ============================================================
-- SCRIPT COMPLETO - Crear tablas y buckets para documentos
-- Ejecutar en Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. TABLA: contracts (si no existe)
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number TEXT NOT NULL,
  worker_name TEXT NOT NULL,
  contract_date DATE NOT NULL,
  file_name TEXT DEFAULT '',
  file_path TEXT DEFAULT '',
  file_size BIGINT DEFAULT 0,
  file_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABLA: invoices
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

-- 3. TABLA: permissions
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID DEFAULT NULL,
  worker_name TEXT DEFAULT '',
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Licencia',
  issue_date DATE,
  expiry_date DATE,
  status TEXT NOT NULL DEFAULT 'Vigente',
  description TEXT DEFAULT '',
  file_name TEXT DEFAULT '',
  file_path TEXT DEFAULT '',
  file_size BIGINT DEFAULT 0,
  file_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABLA: reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  report_date DATE,
  type TEXT NOT NULL DEFAULT 'Mensual',
  file_name TEXT DEFAULT '',
  file_path TEXT DEFAULT '',
  file_size BIGINT DEFAULT 0,
  file_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. TABLA: others
CREATE TABLE IF NOT EXISTS others (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  description TEXT DEFAULT '',
  file_name TEXT DEFAULT '',
  file_path TEXT DEFAULT '',
  file_size BIGINT DEFAULT 0,
  file_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. POLÍTICAS RLS
ALTER TABLE IF EXISTS contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS others ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contracts' AND policyname = 'Permitir todo a usuarios autenticados') THEN
    CREATE POLICY "Permitir todo a usuarios autenticados" ON contracts
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;
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
-- 7. POLÍTICAS DE STORAGE (para permitir subida/lectura de PDFs)
-- ============================================================
DO $$
DECLARE
  b TEXT;
BEGIN
  FOREACH b IN ARRAY ARRAY['contracts', 'invoices', 'permissions', 'reports', 'others']
  LOOP
    INSERT INTO storage.buckets (id, name, public) VALUES (b, b, true)
    ON CONFLICT (id) DO UPDATE SET public = true;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = b || '_public_read') THEN
      EXECUTE format('CREATE POLICY %I ON storage.objects FOR SELECT TO public USING (bucket_id = %L)', b || '_public_read', b);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = b || '_auth_insert') THEN
      EXECUTE format('CREATE POLICY %I ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = %L)', b || '_auth_insert', b);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = b || '_auth_delete') THEN
      EXECUTE format('CREATE POLICY %I ON storage.objects FOR DELETE TO authenticated USING (bucket_id = %L)', b || '_auth_delete', b);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = b || '_auth_update') THEN
      EXECUTE format('CREATE POLICY %I ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = %L) WITH CHECK (bucket_id = %L)', b || '_auth_update', b, b);
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- NOTA: Los buckets se crean automáticamente arriba.
-- Si prefieres crearlos manualmente desde el Dashboard:
-- Storage > Create bucket (público):
--   contracts, invoices, permissions, reports, others
-- ============================================================
