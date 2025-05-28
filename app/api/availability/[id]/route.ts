import { type NextRequest, NextResponse } from "next/server"
import { getBlockedDates, getAvailableTimeSlots } from "@/lib/db/availability-queries"

interface RouteParams {
  params: Promise<{ id: string }>
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

    // Obtener fechas bloqueadas para el mes
    const blockedDates = await getBlockedDates()

    // Filtrar por vehículo y mes si se especifica
    let filteredBlocked = blockedDates
      .filter((item) => !item.blockedDate.vehicleId || item.blockedDate.vehicleId === vehicleId)
      .map((item) => item.blockedDate.date)

    if (year && month) {
      const yearNum = Number.parseInt(year)
      const monthNum = Number.parseInt(month)

      filteredBlocked = filteredBlocked.filter((date) => {
        const dateObj = new Date(date)
        return dateObj.getFullYear() === yearNum && dateObj.getMonth() + 1 === monthNum
      })
    }

    // Si se solicita verificar días completos
    let fullyBookedDates: string[] = []
    if (checkFullDays && year && month) {
      fullyBookedDates = await getFullyBookedDates(vehicleId, Number.parseInt(year), Number.parseInt(month))
    }

    return NextResponse.json({
      vehicleId,
      blockedDates: filteredBlocked,
      fullyBookedDates,
    })
  } catch (error) {
    console.error("Error fetching availability:", error)
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 })
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

    // Obtener slots disponibles para este día
    const slots = await getAvailableTimeSlots(vehicleId, date)

    // Si no hay slots disponibles y no es un día bloqueado, está completamente reservado
    if (slots.length > 0 && !slots.some((slot) => slot.available)) {
      fullyBookedDates.push(date)
    }
  }

  return fullyBookedDates
}
