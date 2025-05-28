import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { vehicleAvailability, vehicles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
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

    // 1. Obtener todos los vehículos
    const allVehicles = await db.select().from(vehicles)
    console.log(`📋 Encontrados ${allVehicles.length} vehículos`)

    // 2. Para cada vehículo, verificar si tiene disponibilidad
    for (const vehicle of allVehicles) {
      console.log(`🚗 Procesando vehículo: ${vehicle.name} (ID: ${vehicle.id})`)

      // Verificar si ya tiene disponibilidad
      const existingAvailability = await db
        .select()
        .from(vehicleAvailability)
        .where(eq(vehicleAvailability.vehicleId, vehicle.id))

      if (existingAvailability.length === 0) {
        console.log(`⚠️ Sin disponibilidad para ${vehicle.name} - Creando horarios por defecto`)

        // Crear disponibilidad para todos los días de la semana (0=Domingo, 6=Sábado)
        const defaultSchedule = []
        for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
          defaultSchedule.push({
            vehicleId: vehicle.id,
            dayOfWeek,
            startTime: "09:00:00",
            endTime: "19:00:00",
            isAvailable: true,
          })
        }

        // Insertar la disponibilidad
        await db.insert(vehicleAvailability).values(defaultSchedule)
        console.log(`✅ Creados horarios 9:00-19:00 para ${vehicle.name}`)
      } else {
        console.log(`✅ ${vehicle.name} ya tiene ${existingAvailability.length} horarios configurados`)
      }
    }

    // 3. Verificar el resultado final
    const totalAvailability = await db.select().from(vehicleAvailability)
    console.log(`📊 Total de horarios en la base de datos: ${totalAvailability.length}`)

    return NextResponse.json({
      success: true,
      message: "Database schema fixed successfully",
      vehicles: allVehicles.length,
      totalSchedules: totalAvailability.length,
      details: allVehicles.map((v) => ({
        id: v.id,
        name: v.name,
        available: v.available,
      })),
    })
  } catch (error) {
    console.error("❌ Error fixing database schema:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
