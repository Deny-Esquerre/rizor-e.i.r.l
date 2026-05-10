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
-- Desactivar RLS en tablas de finanzas (entorno de desarrollo)
-- El rol anon del cliente REST tendrá acceso completo
-- ============================================================
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories   DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas existentes (ya no son necesarias)
DROP POLICY IF EXISTS "Allow all for anon - categories"   ON public.categories;
DROP POLICY IF EXISTS "Allow all for anon - transactions" ON public.transactions;
DROP POLICY IF EXISTS "anon_select_categories"            ON public.categories;
DROP POLICY IF EXISTS "anon_insert_categories"            ON public.categories;
DROP POLICY IF EXISTS "anon_select_transactions"          ON public.transactions;
DROP POLICY IF EXISTS "anon_insert_transactions"          ON public.transactions;
DROP POLICY IF EXISTS "anon_update_transactions"          ON public.transactions;
DROP POLICY IF EXISTS "anon_delete_transactions"          ON public.transactions;

-- GRANT explícito a los roles que usa PostgREST
GRANT USAGE  ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.transactions TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.categories   TO anon, authenticated, service_role;
`

async function run() {
  console.log('🔌 Conectando a Supabase...')

  try {
    await client.connect()
    console.log('✅ Conectado\n')

    console.log('🔓 Desactivando RLS y aplicando GRANTs...')
    await client.query(SQL)
    console.log('✅ Hecho\n')

    // Verificar estado final
    const result = await client.query(`
      SELECT 
        relname AS tabla,
        relrowsecurity AS rls_activo
      FROM pg_class
      WHERE relname IN ('transactions', 'categories')
        AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    `)

    console.log('📋 Estado de las tablas:')
    result.rows.forEach(row => {
      const rls = row.rls_activo ? '🔒 RLS ON' : '🔓 RLS OFF (acceso libre)'
      console.log(`   ${row.tabla}: ${rls}`)
    })

    // Probar INSERT de prueba
    console.log('\n🧪 Probando INSERT en transactions...')
    const testInsert = await client.query(`
      INSERT INTO public.transactions (date, description, type, category, amount, status)
      VALUES (CURRENT_DATE, 'Test de conexión', 'Ingreso', 'Otros', 1.00, 'Completado')
      RETURNING id
    `)
    const testId = testInsert.rows[0].id
    console.log(`   ✅ INSERT OK — id: ${testId}`)

    // Eliminar el registro de prueba
    await client.query(`DELETE FROM public.transactions WHERE id = $1`, [testId])
    console.log('   🧹 Registro de prueba eliminado')

    console.log('\n🎉 ¡Todo listo! El módulo de Finanzas ya puede guardar operaciones.')

  } catch (err) {
    console.error('\n❌ Error:', err.message)
    if (err.detail) console.error('   Detalle:', err.detail)
    process.exit(1)
  } finally {
    await client.end()
  }
}

run()
