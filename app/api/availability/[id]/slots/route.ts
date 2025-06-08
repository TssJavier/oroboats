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
    console.log("🔍 API Route - Parámetros recibidos:")
    console.log("   - context.params:", context.params)
    console.log("   - URL:", request.url)

    // Corregir el error de Next.js usando await para params
    const params = await Promise.resolve(context.params)
    const { id: idParam } = params

    console.log("   - id extraído:", idParam, typeof idParam)

    const id = Number.parseInt(idParam)
    console.log("   - id parseado:", id, "isNaN:", isNaN(id))

    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const duration = searchParams.get("duration")

    console.log("   - Query params:")
    console.log("     - date:", date)
    console.log("     - duration:", duration)

    if (isNaN(id)) {
      console.error(`❌ ID de vehículo inválido: "${idParam}" -> ${id}`)
      return NextResponse.json(
        {
          error: "Invalid vehicle ID",
          details: `Received: "${idParam}", parsed: ${id}`,
        },
        { status: 400 },
      )
    }

    if (!date) {
      console.error(`❌ Fecha faltante`)
      return NextResponse.json({ error: "Date is required" }, { status: 400 })
    }

    // Validar formato de fecha (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      console.error(`❌ Formato de fecha inválido: ${date}`)
      return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD" }, { status: 400 })
    }

    console.log(`✅ Validación exitosa - Buscando vehículo ${id}`)

    // 1. Obtener información del vehículo
    const vehicle = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1)

    console.log(`🔍 Consulta de vehículo completada. Resultados: ${vehicle.length}`)

    if (vehicle.length === 0) {
      console.error(`❌ Vehículo no encontrado: ${id}`)
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
    }

    const vehicleInfo = vehicle[0]
    console.log(`🚤 Vehículo encontrado:`, {
      id: vehicleInfo.id,
      name: vehicleInfo.name,
      type: vehicleInfo.type,
      category: vehicleInfo.category,
    })

    // 2. Verificar si la fecha está bloqueada
    const isBlocked = await db
      .select()
      .from(blockedDates)
      .where(and(eq(blockedDates.vehicleId, id), eq(blockedDates.date, date)))

    if (isBlocked.length > 0) {
      console.log(`🚫 Fecha bloqueada: ${date}`)
      return NextResponse.json({
        slots: [],
        message: "Fecha bloqueada",
        vehicleCategory: vehicleInfo.category,
        vehicleType: vehicleInfo.type,
      })
    }

    // 3. Obtener el día de la semana
    const dayOfWeek = new Date(date).getDay()

    // 4. Obtener la disponibilidad del vehículo (opcional, usar horarios de negocio por defecto)
    const availability = await db
      .select()
      .from(vehicleAvailability)
      .where(and(eq(vehicleAvailability.vehicleId, id), eq(vehicleAvailability.dayOfWeek, dayOfWeek)))

    // 5. Usar horarios de negocio fijos (10:00 - 21:00)
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
          eq(bookings.vehicleId, id),
          eq(bookings.bookingDate, date),
          or(eq(bookings.status, "confirmed"), eq(bookings.status, "pending")),
        ),
      )

    console.log(`📋 Reservas existentes: ${existingBookings.length}`)

    // 7. Generar slots usando la nueva lógica CON LA CATEGORÍA
    const normalizedBookings = existingBookings.map((b) => ({
      ...b,
      status: b.status === null ? undefined : b.status,
    }))

    // Pasar la fecha seleccionada a la función para verificación correcta de slots pasados
    const slots = generateSlotsForVehicle(
      vehicleInfo.type,
      businessSchedule,
      normalizedBookings,
      duration || "regular",
      vehicleInfo.category,
      date, // Pasar la fecha seleccionada
    )

    console.log(`⏰ Generados ${slots.length} slots para ${vehicleInfo.type} (${vehicleInfo.category})`)
    console.log(`   - Disponibles: ${slots.filter((s) => s.available).length}`)
    console.log(`   - No disponibles: ${slots.filter((s) => !s.available).length}`)

    const response = {
      slots,
      schedule: businessSchedule,
      vehicleType: vehicleInfo.type,
      vehicleCategory: vehicleInfo.category,
      customDurationEnabled: false,
      existingBookings: existingBookings.length,
    }

    console.log(`✅ Respuesta exitosa:`, response)

    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ Error en API:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch time slots",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
