import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { vehicleAvailability, bookings, blockedDates } from "@/lib/db/schema"
import { eq, and, or } from "drizzle-orm"

interface RouteParams {
  params: { id: string }
}

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params
    const vehicleId = Number.parseInt(id)
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")

    if (isNaN(vehicleId)) {
      return NextResponse.json({ error: "Invalid vehicle ID" }, { status: 400 })
    }

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 })
    }

    console.log(`🔍 Buscando slots para vehículo ${vehicleId} en fecha ${date}`)

    // 1. Verificar si la fecha está bloqueada
    const isBlocked = await db
      .select()
      .from(blockedDates)
      .where(and(eq(blockedDates.vehicleId, vehicleId), eq(blockedDates.date, date)))

    if (isBlocked.length > 0) {
      console.log(`🚫 Fecha bloqueada: ${date}`)
      return NextResponse.json({ slots: [], message: "Fecha bloqueada" })
    }

    // 2. Obtener el día de la semana (0=Domingo, 6=Sábado)
    const dayOfWeek = new Date(date).getDay()
    console.log(`📅 Día de la semana: ${dayOfWeek}`)

    // 3. Obtener la disponibilidad del vehículo para este día
    const availability = await db
      .select()
      .from(vehicleAvailability)
      .where(and(eq(vehicleAvailability.vehicleId, vehicleId), eq(vehicleAvailability.dayOfWeek, dayOfWeek)))

    if (availability.length === 0) {
      console.log(`⚠️ No hay disponibilidad configurada para el vehículo ${vehicleId} el día ${dayOfWeek}`)
      return NextResponse.json({
        slots: [],
        message: "No hay disponibilidad configurada para este día",
      })
    }

    const schedule = availability[0]
    if (!schedule.isAvailable) {
      console.log(`❌ El vehículo ${vehicleId} no está disponible los ${dayOfWeek}`)
      return NextResponse.json({
        slots: [],
        message: "El vehículo no está disponible este día de la semana",
      })
    }

    console.log(`✅ Horario encontrado: ${schedule.startTime} - ${schedule.endTime}`)

    // 4. Obtener reservas existentes para esta fecha
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

    // 5. Generar slots de 30 minutos
    const slots = []
    const startHour = Number.parseInt(schedule.startTime.split(":")[0])
    const startMinute = Number.parseInt(schedule.startTime.split(":")[1])
    const endHour = Number.parseInt(schedule.endTime.split(":")[0])
    const endMinute = Number.parseInt(schedule.endTime.split(":")[1])

    let currentTime = startHour * 60 + startMinute // minutos desde medianoche
    const endTimeMinutes = endHour * 60 + endMinute

    while (currentTime < endTimeMinutes) {
      const hours = Math.floor(currentTime / 60)
      const minutes = currentTime % 60
      const timeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`

      // Verificar si este slot está ocupado por alguna reserva
      const isOccupied = existingBookings.some((booking) => {
        const bookingStart = booking.startTime
        const bookingEnd = booking.endTime
        return timeString >= bookingStart && timeString < bookingEnd
      })

      slots.push({
        time: timeString,
        available: !isOccupied,
      })

      currentTime += 30 // Incrementar 30 minutos
    }

    console.log(`⏰ Generados ${slots.length} slots, ${slots.filter((s) => s.available).length} disponibles`)

    return NextResponse.json({
      slots,
      schedule: {
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        dayOfWeek,
      },
      existingBookings: existingBookings.length,
    })
  } catch (error) {
    console.error("❌ Error fetching time slots:", error)
    return NextResponse.json({ error: "Failed to fetch time slots" }, { status: 500 })
  }
}
