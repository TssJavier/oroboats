import { type NextRequest, NextResponse } from "next/server"
import { sql } from "drizzle-orm"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 DEBUG: Testing availability logic for vehicle 29 on 2025-06-10")

    const vehicleId = 29
    const date = "2025-06-10"

    // Obtener vehículo
    const vehicleQuery = await db.execute(sql`
      SELECT id, name, type, requires_license, pricing, available, stock
      FROM vehicles 
      WHERE id = ${vehicleId}
      LIMIT 1
    `)

    const vehicle = vehicleQuery[0] as {
      id: number
      name: string
      type: string
      requires_license: boolean
      pricing: any
      available: boolean
      stock: number
    }
    console.log("Vehicle:", vehicle)

    // Obtener reservas
    const bookingsQuery = await db.execute(sql`
      SELECT 
        id,
        customer_name,
        start_time,
        end_time,
        duration,
        status,
        booking_date
      FROM bookings 
      WHERE vehicle_id = ${vehicleId} 
      AND booking_date = ${date}
      AND status IN ('confirmed', 'pending')
      ORDER BY start_time ASC
    `)

    const existingBookings = bookingsQuery || []
    console.log("Existing bookings:", existingBookings.length)

    // Contar reservas por slot
    const bookingCounts = new Map<string, number>()

    for (const booking of existingBookings) {
      const slotKey = `${booking.start_time}-${booking.end_time}`
      const currentCount = bookingCounts.get(slotKey) || 0
      bookingCounts.set(slotKey, currentCount + 1)
      console.log(`Slot ${slotKey}: ${currentCount + 1} bookings`)
    }

    // Verificar slot específico de día completo
    const fullDaySlot = "10:00:00-21:00:00"
    const bookingsForFullDay = bookingCounts.get(fullDaySlot) || 0
    const availableUnits = Math.max(0, vehicle.stock - bookingsForFullDay)

    const result = {
      vehicleId: vehicleId,
      vehicleName: vehicle.name,
      vehicleStock: vehicle.stock,
      date: date,
      totalBookings: existingBookings.length,
      bookingsBySlot: Object.fromEntries(bookingCounts),
      fullDaySlotCheck: {
        slot: fullDaySlot,
        bookingsInSlot: bookingsForFullDay,
        vehicleStock: vehicle.stock,
        availableUnits: availableUnits,
        shouldBeBlocked: availableUnits <= 0,
        status: availableUnits > 0 ? "DISPONIBLE" : "BLOQUEADO",
      },
      allBookings: existingBookings.map((b) => ({
        customer: b.customer_name,
        slot: `${b.start_time}-${b.end_time}`,
        status: b.status,
      })),
    }

    console.log("DEBUG RESULT:", result)

    return NextResponse.json(result)
  } catch (error) {
    console.error("❌ Debug API Error:", error)
    return NextResponse.json(
      {
        error: "Debug failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
