import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { vehicleAvailability, blockedDates } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

interface RouteParams {
  params: { id: string }
}

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

    const fullyBookedDates: string[] = []

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
