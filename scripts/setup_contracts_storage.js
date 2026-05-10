import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function setup() {
  console.log('🔧 Configurando Supabase Storage para contratos...\n')

  // 1. Crear bucket "contracts" si no existe
  const { data: buckets } = await supabase.storage.listBuckets()
  const exists = buckets?.some(b => b.name === 'contracts')

  if (!exists) {
    const { error } = await supabase.storage.createBucket('contracts', {
      public: true,
      allowedMimeTypes: ['application/pdf'],
      fileSizeLimit: 3 * 1024 * 1024 // 3MB
    })
    if (error) {
      console.error('❌ Error al crear bucket:', error.message)
    } else {
      console.log('✅ Bucket "contracts" creado exitosamente')
    }
  } else {
    console.log('ℹ️  Bucket "contracts" ya existe, omitiendo...')
  }

  // 2. Crear tabla contracts
  const { error: tableError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS contracts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        contract_number TEXT NOT NULL,
        worker_name TEXT NOT NULL,
        contract_date DATE NOT NULL,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size BIGINT NOT NULL,
        file_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Trigger para updated_at
      CREATE OR REPLACE FUNCTION update_contracts_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS set_contracts_updated_at ON contracts;
      CREATE TRIGGER set_contracts_updated_at
        BEFORE UPDATE ON contracts
        FOR EACH ROW EXECUTE FUNCTION update_contracts_updated_at();
    `
  })

  if (tableError) {
    console.log('⚠️  RPC no disponible, copia y ejecuta este SQL en el SQL Editor de Supabase:')
    console.log(`
CREATE TABLE IF NOT EXISTS contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_number TEXT NOT NULL,
  worker_name TEXT NOT NULL,
  contract_date DATE NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
    `)
  } else {
    console.log('✅ Tabla "contracts" creada exitosamente')
  }

  console.log('\n✅ Setup completo!')
}

setup().catch(console.error)
