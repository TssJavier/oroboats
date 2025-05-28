-- Actualizar la tabla bookings con los campos que faltan
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_time TIME,
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60;

-- Actualizar registros existentes con valores por defecto
UPDATE bookings 
SET 
  start_time = '10:00:00',
  end_time = '11:00:00',
  duration_minutes = 60
WHERE start_time IS NULL;

-- Crear tabla de disponibilidad si no existe
CREATE TABLE IF NOT EXISTS availability_slots (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(vehicle_id, date, start_time)
);

-- Insertar slots de disponibilidad por defecto para los próximos 30 días
INSERT INTO availability_slots (vehicle_id, date, start_time, end_time, is_available)
SELECT 
  v.id,
  d.date,
  t.start_time,
  t.end_time,
  true
FROM vehicles v
CROSS JOIN (
  SELECT CURRENT_DATE + INTERVAL '1 day' * generate_series(0, 29) AS date
) d
CROSS JOIN (
  VALUES 
    ('09:00:00'::TIME, '10:00:00'::TIME),
    ('10:00:00'::TIME, '11:00:00'::TIME),
    ('11:00:00'::TIME, '12:00:00'::TIME),
    ('12:00:00'::TIME, '13:00:00'::TIME),
    ('14:00:00'::TIME, '15:00:00'::TIME),
    ('15:00:00'::TIME, '16:00:00'::TIME),
    ('16:00:00'::TIME, '17:00:00'::TIME),
    ('17:00:00'::TIME, '18:00:00'::TIME),
    ('18:00:00'::TIME, '19:00:00'::TIME)
) t(start_time, end_time)
ON CONFLICT (vehicle_id, date, start_time) DO NOTHING;
