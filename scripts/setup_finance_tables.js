import pg from 'pg'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env') })

const { Client } = pg

const client = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
})

const SQL = `
-- 1. Tabla de CATEGORÍAS
CREATE TABLE IF NOT EXISTS public.categories (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categorías por defecto
INSERT INTO public.categories (name) VALUES
  ('Ventas'),
  ('Compras'),
  ('Gastos Operativos'),
  ('Nomina'),
  ('Servicios'),
  ('Logistica'),
  ('Otros')
ON CONFLICT (name) DO NOTHING;

-- 2. Tabla de TRANSACCIONES
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

-- 3. Habilitar RLS
ALTER TABLE public.categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 4. Políticas para rol anon (desarrollo)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'categories' AND policyname = 'Allow all for anon - categories'
  ) THEN
    CREATE POLICY "Allow all for anon - categories"
      ON public.categories FOR ALL TO anon
      USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'transactions' AND policyname = 'Allow all for anon - transactions'
  ) THEN
    CREATE POLICY "Allow all for anon - transactions"
      ON public.transactions FOR ALL TO anon
      USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 5. Índices
CREATE INDEX IF NOT EXISTS idx_transactions_date     ON public.transactions (date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type     ON public.transactions (type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions (category);
`

async function run() {
  console.log('🔌 Conectando a Supabase PostgreSQL...')
  console.log(`   Host: ${process.env.DB_HOST}`)
  console.log(`   User: ${process.env.DB_USER}`)

  try {
    await client.connect()
    console.log('✅ Conectado correctamente\n')

    console.log('⚙️  Ejecutando script SQL...')
    await client.query(SQL)
    console.log('✅ Script ejecutado exitosamente\n')

    // Verificar que las tablas existen
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('transactions', 'categories')
      ORDER BY table_name
    `)

    console.log('📋 Tablas creadas:')
    result.rows.forEach(row => console.log(`   ✓ ${row.table_name}`))

    // Contar categorías insertadas
    const cats = await client.query('SELECT COUNT(*) FROM public.categories')
    console.log(`\n📂 Categorías en la BD: ${cats.rows[0].count}`)

    console.log('\n🎉 ¡Todo listo! El módulo de Finanzas ya puede conectarse a la BD.')

  } catch (err) {
    console.error('\n❌ Error:', err.message)
    if (err.code) console.error('   Código:', err.code)
    process.exit(1)
  } finally {
    await client.end()
  }
}

run()
