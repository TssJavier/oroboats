import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

export async function GET() {
  try {
    console.log("🔧 Fixing database schema...")

    // Ejecutar SQL para arreglar la tabla bookings
    const fixBookingsResult = await db.execute(sql`
      -- Asegurarse de que los campos existen
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE bookings 
          ADD COLUMN IF NOT EXISTS start_time TIME,
          ADD COLUMN IF NOT EXISTS end_time TIME,
          ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60;
        EXCEPTION
          WHEN duplicate_column THEN 
            RAISE NOTICE 'column already exists';
        END;
      END $$;

      -- Actualizar registros existentes con valores por defecto
      UPDATE bookings 
      SET 
        start_time = '10:00:00'::TIME,
        end_time = '11:00:00'::TIME
      WHERE start_time IS NULL;
    `)

    console.log("✅ Bookings table fixed:", fixBookingsResult)

    // Crear tabla de disponibilidad si no existe
    const createAvailabilityResult = await db.execute(sql`
      -- Crear tabla de disponibilidad
      CREATE TABLE IF NOT EXISTS vehicle_availability (
        id SERIAL PRIMARY KEY,
        vehicle_id INTEGER REFERENCES vehicles(id),
        day_of_week INTEGER NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        is_available BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `)

    console.log("✅ Availability table created:", createAvailabilityResult)

    // Insertar datos de disponibilidad por defecto
    const insertAvailabilityResult = await db.execute(sql`
      -- Insertar disponibilidad por defecto para todos los vehículos
      INSERT INTO vehicle_availability (vehicle_id, day_of_week, start_time, end_time, is_available)
      SELECT 
        v.id,
        d.day,
        '09:00:00'::TIME,
        '19:00:00'::TIME,
        true
      FROM vehicles v
      CROSS JOIN (
        SELECT generate_series(0, 6) AS day
      ) d
      WHERE NOT EXISTS (
        SELECT 1 FROM vehicle_availability va 
        WHERE va.vehicle_id = v.id AND va.day_of_week = d.day
      );
    `)

    console.log("✅ Default availability inserted:", insertAvailabilityResult)

    return NextResponse.json({
      success: true,
      message: "Database schema fixed successfully",
    })
  } catch (error) {
    console.error("❌ Error fixing database schema:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fix database schema",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
