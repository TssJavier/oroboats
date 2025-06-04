import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { vehicleAvailability, blockedDates } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

interface RouteParams {
  params: { id: string }
}

// ✅ MÉTODO GET EXISTENTE - Para obtener disponibilidad de un vehículo específico
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params
    const vehicleId = Number.parseInt(id)
    const { searchParams } = new URL(request.url)
    const year = searchParams.get("year")
    const month = searchParams.get("month")
    const checkFullDays = searchParams.get("checkFullDays") === "true"

    if (isNaN(vehicleId)) {
      return NextResponse.json({ error: "Invalid vehicle ID" }, { status: 400 })
    }

    console.log("🔍 GET availability for vehicle:", vehicleId)

    // Obtener disponibilidad del vehículo
    const availability = await db.select().from(vehicleAvailability).where(eq(vehicleAvailability.vehicleId, vehicleId))

    // Si no hay disponibilidad, crear disponibilidad por defecto
    if (availability.length === 0) {
      console.log("⚠️ No hay disponibilidad para el vehículo", vehicleId, "- Creando por defecto")

      // Crear disponibilidad por defecto para todos los días de la semana
      const defaultAvailability = []
      for (let day = 0; day <= 6; day++) {
        const newAvailability = {
          vehicleId,
          dayOfWeek: day,
          startTime: "09:00:00",
          endTime: "19:00:00",
          isAvailable: true,
        }

        await db.insert(vehicleAvailability).values(newAvailability)
        defaultAvailability.push(newAvailability)
      }

      return NextResponse.json({
        availability: defaultAvailability,
        message: "Disponibilidad creada por defecto",
      })
    }

    // Obtener fechas bloqueadas para el mes
    const blocked = await db.select().from(blockedDates).where(eq(blockedDates.vehicleId, vehicleId))

    const blockedDatesArray = blocked.map((item) => item.date)

    // ✅ NUEVO: Obtener fechas completamente reservadas si se solicita
    const fullyBookedDates: string[] = []

    if (checkFullDays && year && month) {
      try {
        // Consultar fechas completamente reservadas usando SQL directo para mayor flexibilidad
        const fullyBookedQuery = `
          SELECT DISTINCT reservation_date::text as date
          FROM bookings 
          WHERE vehicle_id = $1 
          AND status = 'confirmed'
          AND EXTRACT(YEAR FROM reservation_date) = $2
          AND EXTRACT(MONTH FROM reservation_date) = $3
          GROUP BY reservation_date
          HAVING COUNT(*) >= (
            SELECT COUNT(*) 
            FROM vehicle_availability va 
            WHERE va.vehicle_id = $1 
            AND va.is_available = true
          )
        `

        const fullyBookedResult = await sql(fullyBookedQuery, [
          vehicleId,
          Number.parseInt(year),
          Number.parseInt(month),
        ])
        fullyBookedDates.push(...fullyBookedResult.map((row: any) => row.date))
      } catch (error) {
        console.error("Error checking fully booked dates:", error)
      }
    }

    return NextResponse.json({
      vehicleId,
      availability,
      blockedDates: blockedDatesArray,
      fullyBookedDates,
    })
  } catch (error) {
    console.error("Error fetching availability:", error)
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 })
  }
}

// ✅ MÉTODO POST MEJORADO - Verificación exacta de horarios
export async function POST(request: NextRequest) {
  try {
    const { date, startTime, endTime, vehicleIds } = await request.json()

    console.log("🔍 POST - Checking availability for:", { date, startTime, endTime, vehicleIds })

    // Validar parámetros requeridos
    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        {
          error: "Missing required parameters: date, startTime, endTime",
        },
        { status: 400 },
      )
    }

    // ✅ VALIDAR QUE LOS HORARIOS SEAN VÁLIDOS (00 o 30 minutos)
    const validateTime = (timeStr: string): boolean => {
      const [hours, minutes] = timeStr.split(":").map(Number)
      return minutes === 0 || minutes === 30
    }

    if (!validateTime(startTime) || !validateTime(endTime)) {
      return NextResponse.json(
        {
          error: "Invalid time format. Only :00 and :30 minutes are allowed",
        },
        { status: 400 },
      )
    }

    // Si no se especifican vehículos, obtener todos los disponibles
    const vehicleFilter = vehicleIds && vehicleIds.length > 0 ? `AND v.id = ANY($4::int[])` : ""

    // ✅ CONSULTA MEJORADA PARA VERIFICACIÓN EXACTA DE HORARIOS
    const query = `
      SELECT 
        v.id,
        v.name,
        v.type,
        v.category,
        v.pricing,
        v.image,
        v.capacity,
        v.requires_license,
        v.fuel_included,
        v.description,
        v.includes,
        v.extra_features,
        v.security_deposit,
        v.available,
        CASE 
          WHEN check_vehicle_availability(v.id, $1::date, $2::time, $3::time) THEN true
          ELSE false
        END as is_available,
        -- ✅ VERIFICAR SLOTS ESPECÍFICOS DISPONIBLES
        (
          SELECT json_agg(
            json_build_object(
              'startTime', slot_start::text,
              'endTime', slot_end::text,
              'available', check_vehicle_availability(v.id, $1::date, slot_start, slot_end)
            )
          )
          FROM (
            SELECT 
              ($2::time + (generate_series(0, EXTRACT(EPOCH FROM ($3::time - $2::time))/1800 - 1) * interval '30 minutes'))::time as slot_start,
              ($2::time + (generate_series(1, EXTRACT(EPOCH FROM ($3::time - $2::time))/1800) * interval '30 minutes'))::time as slot_end
          ) slots
        ) as available_slots
      FROM vehicles v
      WHERE v.available = true
      ${vehicleFilter}
      ORDER BY v.type, v.name
    `

    const params =
      vehicleIds && vehicleIds.length > 0 ? [date, startTime, endTime, vehicleIds] : [date, startTime, endTime]

    const result = await sql(query, params)

    console.log("✅ POST - Availability check completed:", result.length, "vehicles checked")

    // Transformar el resultado para mantener consistencia con el formato esperado
    const transformedResult = result.map((vehicle: any) => ({
      ...vehicle,
      requiresLicense: vehicle.requires_license,
      fuelIncluded: vehicle.fuel_included,
      extraFeatures: vehicle.extra_features,
      securityDeposit: vehicle.security_deposit,
      isAvailable: vehicle.is_available,
      availableSlots: vehicle.available_slots || [],
    }))

    return NextResponse.json(transformedResult)
  } catch (error) {
    console.error("❌ Error in POST availability check:", error)
    return NextResponse.json(
      {
        error: "Failed to check availability",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// ✅ MÉTODO PUT NUEVO - Para actualizar disponibilidad de un vehículo
export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params
    const vehicleId = Number.parseInt(id)
    const { dayOfWeek, startTime, endTime, isAvailable } = await request.json()

    if (isNaN(vehicleId)) {
      return NextResponse.json({ error: "Invalid vehicle ID" }, { status: 400 })
    }

    console.log("🔄 PUT - Updating availability for vehicle:", vehicleId, {
      dayOfWeek,
      startTime,
      endTime,
      isAvailable,
    })

    // Verificar si ya existe disponibilidad para ese día
    const existingAvailability = await db
      .select()
      .from(vehicleAvailability)
      .where(and(eq(vehicleAvailability.vehicleId, vehicleId), eq(vehicleAvailability.dayOfWeek, dayOfWeek)))

    if (existingAvailability.length > 0) {
      // Actualizar disponibilidad existente
      const updated = await db
        .update(vehicleAvailability)
        .set({
          startTime,
          endTime,
          isAvailable,
          updatedAt: new Date(),
        })
        .where(and(eq(vehicleAvailability.vehicleId, vehicleId), eq(vehicleAvailability.dayOfWeek, dayOfWeek)))
        .returning()

      return NextResponse.json({
        message: "Availability updated successfully",
        availability: updated[0],
      })
    } else {
      // Crear nueva disponibilidad
      const created = await db
        .insert(vehicleAvailability)
        .values({
          vehicleId,
          dayOfWeek,
          startTime,
          endTime,
          isAvailable,
        })
        .returning()

      return NextResponse.json({
        message: "Availability created successfully",
        availability: created[0],
      })
    }
  } catch (error) {
    console.error("❌ Error updating availability:", error)
    return NextResponse.json(
      {
        error: "Failed to update availability",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// ✅ MÉTODO DELETE NUEVO - Para eliminar disponibilidad
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params
    const vehicleId = Number.parseInt(id)
    const { searchParams } = new URL(request.url)
    const dayOfWeek = searchParams.get("dayOfWeek")

    if (isNaN(vehicleId)) {
      return NextResponse.json({ error: "Invalid vehicle ID" }, { status: 400 })
    }

    console.log("🗑️ DELETE - Removing availability for vehicle:", vehicleId, "day:", dayOfWeek)

    if (dayOfWeek !== null) {
      // Eliminar disponibilidad para un día específico
      const deleted = await db
        .delete(vehicleAvailability)
        .where(
          and(
            eq(vehicleAvailability.vehicleId, vehicleId),
            eq(vehicleAvailability.dayOfWeek, Number.parseInt(dayOfWeek)),
          ),
        )
        .returning()

      return NextResponse.json({
        message: "Availability deleted successfully",
        deleted: deleted.length,
      })
    } else {
      // Eliminar toda la disponibilidad del vehículo
      const deleted = await db
        .delete(vehicleAvailability)
        .where(eq(vehicleAvailability.vehicleId, vehicleId))
        .returning()

      return NextResponse.json({
        message: "All availability deleted successfully",
        deleted: deleted.length,
      })
    }
  } catch (error) {
    console.error("❌ Error deleting availability:", error)
    return NextResponse.json(
      {
        error: "Failed to delete availability",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
