import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Usar Service Role para saltar RLS en seeding

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Faltan variables de entorno: VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const workers = [
  { name: 'Carlos', surname: 'Sánchez', dni: '71452369', phone: '987654321', address: 'Av. Larco 456, Miraflores', area: 'Administración', salary: 3500.00 },
  { name: 'María', surname: 'García', dni: '72583694', phone: '951236874', address: 'Calle Los Pinos 123, San Isidro', area: 'Ventas', salary: 2800.00 },
  { name: 'Jorge', surname: 'Rodríguez', dni: '73694125', phone: '963258741', address: 'Jr. Junín 789, Cercado de Lima', area: 'Producción', salary: 1800.00 },
  { name: 'Ana', surname: 'Martínez', dni: '74125896', phone: '947852369', address: 'Av. Arequipa 2500, Lince', area: 'Ventas', salary: 2700.00 },
  { name: 'Luis', surname: 'López', dni: '75236984', phone: '932145698', address: 'Calle Las Flores 456, Surco', area: 'Producción', salary: 1750.00 },
  { name: 'Elena', surname: 'González', dni: '76325874', phone: '921456387', address: 'Av. Javier Prado 1500, San Borja', area: 'Administración', salary: 4200.00 },
  { name: 'Pedro', surname: 'Hernández', dni: '77412586', phone: '912345678', address: 'Jr. Huallaga 321, Lima', area: 'Limpieza', salary: 1100.00 },
  { name: 'Sofía', surname: 'Pérez', dni: '78523694', phone: '998877665', address: 'Av. La Marina 2800, San Miguel', area: 'Ventas', salary: 2600.00 },
  { name: 'Miguel', surname: 'Ramírez', dni: '79632581', phone: '987456321', address: 'Calle Los Jazmines 123, Los Olivos', area: 'Producción', salary: 1900.00 },
  { name: 'Lucía', surname: 'Torres', dni: '70125843', phone: '974125863', address: 'Av. Salaverry 1200, Jesús María', area: 'Administración', salary: 3800.00 },
  { name: 'Roberto', surname: 'Flores', dni: '71236985', phone: '965412387', address: 'Jr. Ica 456, Lima', area: 'Producción', salary: 1850.00 },
  { name: 'Isabel', surname: 'Gómez', dni: '72365418', phone: '954781236', address: 'Calle Las Begonias 789, San Isidro', area: 'Ventas', salary: 2900.00 },
  { name: 'Ricardo', surname: 'Díaz', dni: '73456129', phone: '941258763', address: 'Av. Petit Thouars 1800, Lince', area: 'Producción', salary: 1700.00 },
  { name: 'Carmen', surname: 'Vásquez', dni: '74561238', phone: '932587412', address: 'Calle Los Alamos 456, Surco', area: 'Limpieza', salary: 1100.00 },
  { name: 'Fernando', surname: 'Castro', dni: '75612349', phone: '923654781', address: 'Av. Brasil 2500, Pueblo Libre', area: 'Producción', salary: 1950.00 },
  { name: 'Rosa', surname: 'Quispe', dni: '76123458', phone: '914785236', address: 'Jr. Puno 321, Lima', area: 'Ventas', salary: 2500.00 },
  { name: 'Javier', surname: 'Morales', dni: '77234561', phone: '996325874', address: 'Calle San Martín 123, Miraflores', area: 'Administración', salary: 4000.00 },
  { name: 'Patricia', surname: 'Espinoza', dni: '78345612', phone: '985214763', address: 'Av. Aviación 3500, San Borja', area: 'Ventas', salary: 2750.00 },
  { name: 'Oscar', surname: 'Ramos', dni: '79456123', phone: '974125896', address: 'Jr. Ucayali 456, Lima', area: 'Producción', salary: 1800.00 },
  { name: 'Gabriela', surname: 'Mendoza', dni: '70561234', phone: '963214587', address: 'Calle Las Camelias 789, San Isidro', area: 'Administración', salary: 3600.00 },
  { name: 'Raúl', surname: 'Castillo', dni: '71654321', phone: '952147863', address: 'Av. Universitaria 1200, San Miguel', area: 'Producción', salary: 1750.00 },
  { name: 'Silvia', surname: 'Salazar', dni: '72741258', phone: '941236587', address: 'Calle Los Geranios 456, Surco', area: 'Ventas', salary: 2650.00 },
  { name: 'Hugo', surname: 'Chávez', dni: '73852147', phone: '932145876', address: 'Jr. Cusco 321, Lima', area: 'Producción', salary: 1800.00 },
  { name: 'Mónica', surname: 'Villegas', dni: '74963258', phone: '923654127', address: 'Av. El Ejército 1500, Miraflores', area: 'Administración', salary: 3900.00 },
  { name: 'Víctor', surname: 'Ortiz', dni: '75147852', phone: '914782365', address: 'Calle San José 123, Lince', area: 'Producción', salary: 1850.00 },
  { name: 'Beatriz', surname: 'Farfán', dni: '76258963', phone: '998521476', address: 'Av. Angamos 2800, Surquillo', area: 'Ventas', salary: 2550.00 },
  { name: 'Andrés', surname: 'Guerra', dni: '77369147', phone: '987412563', address: 'Jr. Tacna 456, Lima', area: 'Producción', salary: 1900.00 },
  { name: 'Teresa', surname: 'Palacios', dni: '78471256', phone: '976321458', address: 'Calle Los Robles 789, La Molina', area: 'Administración', salary: 4500.00 },
  { name: 'Mario', surname: 'Cárdenas', dni: '79582361', phone: '965214783', address: 'Av. La Molina 1200, La Molina', area: 'Producción', salary: 1700.00 },
  { name: 'Julia', surname: 'Rojas', dni: '70693412', phone: '954123687', address: 'Jr. Ayacucho 321, Lima', area: 'Limpieza', salary: 1100.00 }
  ]

async function seed() {
  console.log('Iniciando carga masiva de personal...')
  
  const { error } = await supabase
    .from('personnel')
    .insert(workers)

  if (error) {
    console.error('Error al insertar trabajadores:', error.message)
    process.exit(1)
  }

  console.log('¡Éxito! 30 trabajadores insertados correctamente.')
}

seed()
