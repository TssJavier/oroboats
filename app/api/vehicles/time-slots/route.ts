import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { vehicleId, date } = await request.json()

    console.log("🕐 Getting available time slots for vehicle:", vehicleId, "on date:", date)

    // Obtener información del vehículo
    const vehicleResult = await sql`
      SELECT id, category, pricing, requires_license
      FROM vehicles 
      WHERE id = ${vehicleId} AND available = true
    `

    if (vehicleResult.length === 0) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
    }

    const vehicle = vehicleResult[0]
    const dayOfWeek = new Date(date).getDay() // 0=Domingo, 1=Lunes, etc.

    // Obtener horarios disponibles para ese día
    const availabilityResult = await sql`
      SELECT start_time, end_time
      FROM vehicle_availability
      WHERE vehicle_id = ${vehicleId} 
      AND day_of_week = ${dayOfWeek}
      AND is_available = true
    `

    if (availabilityResult.length === 0) {
      return NextResponse.json({ availableSlots: [] })
    }

    const { start_time, end_time } = availabilityResult[0]

    // Obtener reservas existentes para ese día
    const reservationsResult = await sql`
      SELECT start_time, end_time
      FROM reservations
      WHERE vehicle_id = ${vehicleId}
      AND reservation_date = ${date}
      AND status = 'confirmed'
      ORDER BY start_time
    `

    // Generar slots disponibles basados en el pricing del vehículo
    const availableSlots = generateAvailableSlots(
      vehicle.pricing,
      start_time,
      end_time,
      reservationsResult,
      vehicle.category,
    )

    console.log("✅ Available slots generated:", availableSlots.length)

    return NextResponse.json({ availableSlots })
  } catch (error) {
    console.error("❌ Error getting time slots:", error)
    return NextResponse.json({ error: "Failed to get time slots" }, { status: 500 })
  }
}

function generateAvailableSlots(
  pricing: any[],
  startTime: string,
  endTime: string,
  existingReservations: any[],
  category: string,
) {
  const slots = []

  // Convertir tiempos a minutos para facilitar cálculos
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)

  // Para cada opción de pricing, generar slots disponibles
  for (const priceOption of pricing) {
    const duration = getDurationInMinutes(priceOption.duration)

    // Generar slots cada 30 minutos (o según la duración mínima)
    const stepMinutes = Math.min(30, duration)

    for (let currentMinutes = startMinutes; currentMinutes + duration <= endMinutes; currentMinutes += stepMinutes) {
      const slotStart = minutesToTime(currentMinutes)
      const slotEnd = minutesToTime(currentMinutes + duration)

      // Verificar si este slot no conflicta con reservas existentes
      const hasConflict = existingReservations.some((reservation) => {
        const resStart = timeToMinutes(reservation.start_time)
        const resEnd = timeToMinutes(reservation.end_time)

        return currentMinutes < resEnd && currentMinutes + duration > resStart
      })

      // Verificar restricciones para vehículos sin licencia (14:00-16:00)
      const isRestrictedTime =
        category.includes("no_license") && currentMinutes < 16 * 60 && currentMinutes + duration > 14 * 60

      if (!hasConflict && !isRestrictedTime) {
        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          duration: priceOption.duration,
          label: priceOption.label,
          price: priceOption.price,
        })
      }
    }
  }

  return slots
}

function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number)
  return hours * 60 + minutes
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}

function getDurationInMinutes(duration: string): number {
  switch (duration) {
    case "30min":
      return 30
    case "1hour":
      return 60
    case "2hour":
      return 120
    case "halfday_morning":
    case "halfday_afternoon":
    case "halfday_evening":
    case "halfday":
      return 240 // 4 horas
    case "fullday":
      return 660 // 11 horas
    default:
      return 60
  }
}
