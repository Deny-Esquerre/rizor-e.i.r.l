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
-- ============================================================
-- PASO 1: Eliminar políticas existentes que puedan estar mal
-- ============================================================
DROP POLICY IF EXISTS "Allow all for anon - categories"   ON public.categories;
DROP POLICY IF EXISTS "Allow all for anon - transactions" ON public.transactions;

-- ============================================================
-- PASO 2: GRANT explícito al schema y tablas para rol anon
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON TABLE public.categories   TO anon;
GRANT ALL PRIVILEGES ON TABLE public.transactions TO anon;

-- ============================================================
-- PASO 3: Recrear políticas RLS correctamente
-- ============================================================

-- Política SELECT para anon
CREATE POLICY "anon_select_categories"
  ON public.categories
  AS PERMISSIVE FOR SELECT TO anon
  USING (true);

CREATE POLICY "anon_insert_categories"
  ON public.categories
  AS PERMISSIVE FOR INSERT TO anon
  WITH CHECK (true);

-- Política para transactions (todas las operaciones)
CREATE POLICY "anon_select_transactions"
  ON public.transactions
  AS PERMISSIVE FOR SELECT TO anon
  USING (true);

CREATE POLICY "anon_insert_transactions"
  ON public.transactions
  AS PERMISSIVE FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "anon_update_transactions"
  ON public.transactions
  AS PERMISSIVE FOR UPDATE TO anon
  USING (true) WITH CHECK (true);

CREATE POLICY "anon_delete_transactions"
  ON public.transactions
  AS PERMISSIVE FOR DELETE TO anon
  USING (true);
`

async function run() {
  console.log('🔌 Conectando a Supabase...')

  try {
    await client.connect()
    console.log('✅ Conectado\n')

    console.log('🔐 Aplicando GRANTs y políticas RLS...')
    await client.query(SQL)
    console.log('✅ Permisos aplicados\n')

    // Verificar políticas creadas
    const result = await client.query(`
      SELECT tablename, policyname, cmd, roles
      FROM pg_policies
      WHERE tablename IN ('transactions', 'categories')
      ORDER BY tablename, policyname
    `)

    console.log('📋 Políticas activas:')
    result.rows.forEach(row => {
      console.log(`   ✓ [${row.tablename}] ${row.policyname} — ${row.cmd}`)
    })

    console.log('\n🎉 ¡Listo! Ahora el cliente Supabase puede hacer INSERT/UPDATE/DELETE.')

  } catch (err) {
    console.error('\n❌ Error:', err.message)
    if (err.detail) console.error('   Detalle:', err.detail)
    process.exit(1)
  } finally {
    await client.end()
  }
}

run()
