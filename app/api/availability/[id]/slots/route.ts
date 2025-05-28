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

    // 4. Extender horario hasta las 21:00 si es necesario
    let endTime = schedule.endTime
    const endHour = Number.parseInt(endTime.split(":")[0])

    if (endHour < 21) {
      endTime = "21:00"
      console.log(`⏰ Extendiendo horario hasta las 21:00 (era ${schedule.endTime})`)
    }

    console.log(`✅ Horario: ${schedule.startTime} - ${endTime}`)

    // 5. Obtener reservas existentes para esta fecha
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

    // 6. Generar slots de 30 minutos
    const slots = []
    const startHour = Number.parseInt(schedule.startTime.split(":")[0])
    const startMinute = Number.parseInt(schedule.startTime.split(":")[1])
    const finalEndHour = Number.parseInt(endTime.split(":")[0])
    const finalEndMinute = Number.parseInt(endTime.split(":")[1])

    let currentTime = startHour * 60 + startMinute // minutos desde medianoche
    const endTimeMinutes = finalEndHour * 60 + finalEndMinute

    console.log(
      `⏰ Generando slots desde ${Math.floor(currentTime / 60)}:${(currentTime % 60).toString().padStart(2, "0")} hasta ${Math.floor(endTimeMinutes / 60)}:${(endTimeMinutes % 60).toString().padStart(2, "0")}`,
    )

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
    console.log(`🕐 Último slot: ${slots[slots.length - 1]?.time} (debería ser 20:30 para sesión 20:00-21:00)`)

    return NextResponse.json({
      slots,
      schedule: {
        startTime: schedule.startTime,
        endTime: endTime,
        dayOfWeek,
      },
      existingBookings: existingBookings.length,
    })
  } catch (error) {
    console.error("❌ Error fetching time slots:", error)
    return NextResponse.json({ error: "Failed to fetch time slots" }, { status: 500 })
  }
}
