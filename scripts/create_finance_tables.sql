-- ============================================================
-- FishFlow ERP — Script de creación de tablas de Finanzas
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Tabla de CATEGORÍAS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar categorías por defecto
INSERT INTO public.categories (name) VALUES
  ('Ventas'),
  ('Compras'),
  ('Gastos Operativos'),
  ('Nómina'),
  ('Servicios'),
  ('Logística'),
  ('Otros')
ON CONFLICT (name) DO NOTHING;

-- 2. Tabla de TRANSACCIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date        DATE NOT NULL,
  description TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('Ingreso', 'Gasto')),
  category    TEXT NOT NULL DEFAULT 'Otros',
  amount      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'Completado' CHECK (status IN ('Completado', 'Pendiente')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Políticas RLS (Row Level Security)
-- ============================================================
-- Habilitar RLS en ambas tablas
ALTER TABLE public.categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Permitir acceso TOTAL al rol anon (para desarrollo)
-- NOTA: En producción, reemplaza 'anon' por 'authenticated'
CREATE POLICY "Allow all for anon - categories"
  ON public.categories
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all for anon - transactions"
  ON public.transactions
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- 4. Índices para mejorar rendimiento
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_transactions_date     ON public.transactions (date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type     ON public.transactions (type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions (category);

-- ============================================================
-- ✅ LISTO — Verifica en Table Editor que aparezcan:
--    - public.categories
--    - public.transactions
-- ============================================================
