import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { vehicleAvailability, bookings, blockedDates, vehicles } from "@/lib/db/schema"
import { eq, and, or } from "drizzle-orm"
import { generateSlotsForVehicle, BUSINESS_HOURS } from "@/lib/booking-logic"

interface RouteParams {
  params: { id: string }
}

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params
    const vehicleId = Number.parseInt(id)
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const duration = searchParams.get("duration")

    if (isNaN(vehicleId)) {
      return NextResponse.json({ error: "Invalid vehicle ID" }, { status: 400 })
    }

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 })
    }

    console.log(`🔍 Buscando slots para vehículo ${vehicleId} en fecha ${date}, duración: ${duration}`)

    // 1. Obtener información del vehículo
    const vehicle = await db.select().from(vehicles).where(eq(vehicles.id, vehicleId)).limit(1)
    if (vehicle.length === 0) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
    }

    const vehicleInfo = vehicle[0]
    console.log(`🚤 Tipo de vehículo: ${vehicleInfo.type}`)

    // 2. Verificar si la fecha está bloqueada
    const isBlocked = await db
      .select()
      .from(blockedDates)
      .where(and(eq(blockedDates.vehicleId, vehicleId), eq(blockedDates.date, date)))

    if (isBlocked.length > 0) {
      console.log(`🚫 Fecha bloqueada: ${date}`)
      return NextResponse.json({ slots: [], message: "Fecha bloqueada" })
    }

    // 3. Obtener el día de la semana
    const dayOfWeek = new Date(date).getDay()

    // 4. Obtener la disponibilidad del vehículo
    const availability = await db
      .select()
      .from(vehicleAvailability)
      .where(and(eq(vehicleAvailability.vehicleId, vehicleId), eq(vehicleAvailability.dayOfWeek, dayOfWeek)))

    if (availability.length === 0) {
      return NextResponse.json({
        slots: [],
        message: "No hay disponibilidad configurada para este día",
      })
    }

    const schedule = availability[0]
    if (!schedule.isAvailable) {
      return NextResponse.json({
        slots: [],
        message: "El vehículo no está disponible este día de la semana",
      })
    }

    // 5. Usar horarios de negocio fijos (9:00 - 21:00)
    const businessSchedule = {
      startTime: BUSINESS_HOURS.START,
      endTime: BUSINESS_HOURS.END,
    }

    console.log(`✅ Horario de negocio: ${businessSchedule.startTime} - ${businessSchedule.endTime}`)

    // 6. Obtener reservas existentes
    const existingBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.vehicleId, vehicleId),
          eq(bookings.bookingDate, date),
          or(eq(bookings.status, "confirmed"), eq(bookings.status, "pending")),
        ),
      )

    console.log(`📋 Reservas existentes: ${existingBookings.length}`)

    // 7. Generar slots usando la nueva lógica
    const slots = generateSlotsForVehicle(vehicleInfo.type, businessSchedule, existingBookings, duration || "regular")

    console.log(`⏰ Generados ${slots.length} slots para ${vehicleInfo.type}`)

    return NextResponse.json({
      slots,
      schedule: businessSchedule,
      vehicleType: vehicleInfo.type,
      customDurationEnabled: vehicleInfo.customDurationEnabled, // NUEVO CAMPO
      existingBookings: existingBookings.length,
    })
  } catch (error) {
    console.error("❌ Error fetching time slots:", error)
    return NextResponse.json({ error: "Failed to fetch time slots" }, { status: 500 })
  }
}
