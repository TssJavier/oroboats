import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { vehicleAvailability, bookings } from "@/lib/db/schema"
import { eq, and, or } from "drizzle-orm"

interface RouteParams {
  params: { id: string }
}

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { id } = context.params
    const vehicleId = Number.parseInt(id)
    const { searchParams } = new URL(request.url)
    const year = searchParams.get("year")
    const month = searchParams.get("month")
    const checkFullDays = searchParams.get("checkFullDays") === "true"

    if (isNaN(vehicleId)) {
      return NextResponse.json({ error: "Invalid vehicle ID" }, { status: 400 })
    }

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
    const blockedDates: string[] = []
    const fullyBookedDates: string[] = []

    // Si se solicita verificar días completos y se especifica año y mes
    if (checkFullDays && year && month) {
      const yearNum = Number.parseInt(year)
      const monthNum = Number.parseInt(month)

      // Obtener días completamente reservados
      const bookedDates = await getFullyBookedDates(vehicleId, yearNum, monthNum)
      fullyBookedDates.push(...bookedDates)
    }

    return NextResponse.json({
      vehicleId,
      availability,
      blockedDates,
      fullyBookedDates,
    })
  } catch (error) {
    console.error("Error fetching availability:", error)
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const { id } = context.params
    const vehicleId = Number.parseInt(id)
    const body = await request.json()

    if (isNaN(vehicleId)) {
      return NextResponse.json({ error: "Invalid vehicle ID" }, { status: 400 })
    }

    // Eliminar disponibilidad existente
    await db.delete(vehicleAvailability).where(eq(vehicleAvailability.vehicleId, vehicleId))

    // Insertar nueva disponibilidad
    const newAvailability = body.availability.map(
      (item: {
        dayOfWeek: number
        startTime: string
        endTime: string
        isAvailable: boolean
      }) => ({
        vehicleId,
        dayOfWeek: item.dayOfWeek,
        startTime: item.startTime,
        endTime: item.endTime,
        isAvailable: item.isAvailable,
      }),
    )

    await db.insert(vehicleAvailability).values(newAvailability)

    return NextResponse.json({
      success: true,
      message: "Availability updated successfully",
    })
  } catch (error) {
    console.error("Error updating availability:", error)
    return NextResponse.json({ error: "Failed to update availability" }, { status: 500 })
  }
}

// Función para obtener días completamente reservados
async function getFullyBookedDates(vehicleId: number, year: number, month: number): Promise<string[]> {
  const fullyBookedDates: string[] = []

  // Obtener el primer y último día del mes
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)

  // Verificar cada día del mes
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`

    // Obtener reservas para este día
    const dayBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.vehicleId, vehicleId),
          eq(bookings.bookingDate, date),
          or(eq(bookings.status, "confirmed"), eq(bookings.status, "pending")),
        ),
      )

    // Obtener disponibilidad para este día de la semana
    const dayOfWeek = new Date(date).getDay()
    const dayAvailability = await db
      .select()
      .from(vehicleAvailability)
      .where(and(eq(vehicleAvailability.vehicleId, vehicleId), eq(vehicleAvailability.dayOfWeek, dayOfWeek)))

    // Si hay disponibilidad pero está completamente reservada
    if (dayAvailability.length > 0 && dayAvailability[0].isAvailable) {
      // Verificar si todas las horas están reservadas
      const startHour = Number.parseInt(dayAvailability[0].startTime.split(":")[0])
      const endHour = Number.parseInt(dayAvailability[0].endTime.split(":")[0])
      const totalHours = endHour - startHour

      // Si hay tantas reservas como horas disponibles, está completamente reservado
      if (dayBookings.length >= totalHours) {
        fullyBookedDates.push(date)
      }
    }
  }

  return fullyBookedDates
}
