import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '6543'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

async function analyzeDatabase() {
  try {
    console.log('--- Analizando tablas ---');
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    if (tablesRes.rows.length === 0) {
      console.log('No se encontraron tablas en el esquema público.');
      return;
    }

    for (const table of tablesRes.rows) {
      const tableName = table.table_name;
      console.log(`\nTabla: ${tableName}`);
      
      const columnsRes = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [tableName]);

      console.table(columnsRes.rows);
    }
  } catch (err) {
    console.error('Error al conectar con la base de datos:', err.message);
    if (err.message.includes('password authentication failed')) {
      console.error('NOTA: Por favor, asegúrate de haber actualizado la contraseña en el archivo .env');
    }
  } finally {
    await pool.end();
  }
}

analyzeDatabase();
