import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { sql } from "drizzle-orm"
import { db } from "@/lib/db"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "tu-secreto-super-seguro-cambiar-en-produccion")

// ✅ ESTA RUTA ES PARA: Admin que gestiona horarios (POST request con auth)
// URL: /api/vehicles/time-slots (POST)
// Uso: Admin dashboard para ver/gestionar slots de vehículos específicos

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 [ADMIN] Time-slots API started")

    // ✅ REQUIERE AUTENTICACIÓN DE ADMIN
    const token = request.cookies.get("admin-token")?.value
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    await jwtVerify(token, JWT_SECRET)
    console.log("✅ [ADMIN] Authenticated")

    const requestData = await request.json()
    const { vehicleId, date } = requestData

    if (!vehicleId || !date) {
      return NextResponse.json({ error: "Vehicle ID and date required" }, { status: 400 })
    }

    console.log(`🔍 [ADMIN] Request: Vehicle ${vehicleId}, Date: ${date}`)

    // Obtener vehículo con stock
    const vehicleQuery = await db.execute(sql`
      SELECT id, name, type, pricing, available, stock
      FROM vehicles 
      WHERE id = ${vehicleId}
      LIMIT 1
    `)

    if (!vehicleQuery || vehicleQuery.length === 0) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
    }

    const vehicle = vehicleQuery[0]
    console.log("✅ [ADMIN] Vehicle found:", vehicle.name)

    // Parsear pricing
    if (typeof vehicle.pricing === "string") {
      try {
        vehicle.pricing = JSON.parse(vehicle.pricing)
      } catch (e) {
        vehicle.pricing = []
      }
    }

    // ✅ IMPORTANTE: Esta API usa time_slot (formato "HH:MM-HH:MM") para compatibilidad con datos existentes
    const bookingsQuery = await db.execute(sql`
      SELECT 
        id,
        customer_name,
        time_slot,
        status,
        created_at,
        booking_date
      FROM bookings 
      WHERE vehicle_id = ${vehicleId} 
      AND booking_date = ${date}
      AND status IN ('confirmed', 'completed', 'pending')
      ORDER BY time_slot ASC
    `)

    const existingBookings = bookingsQuery || []
    console.log("📊 [ADMIN] Bookings found:", existingBookings.length)

    if (!vehicle.available) {
      return NextResponse.json({ availableSlots: [] })
    }

    // Generar slots para admin (sin filtro de tipo)
    const slots = generateAdminSlots(
      vehicle.pricing as any[],
      existingBookings,
      date,
      typeof vehicle.stock === "number" ? vehicle.stock : 1
    )

    return NextResponse.json({
      availableSlots: slots,
      debug: {
        vehicleName: vehicle.name,
        vehicleStock: vehicle.stock || 1,
        existingBookings: existingBookings.length,
        bookingsFound: existingBookings.map((b) => `${b.customer_name}: ${b.time_slot} (${b.status})`),
        date: date,
        databaseConnected: true,
      },
    })
  } catch (error) {
    console.error("❌ [ADMIN] API Error:", error)
    return NextResponse.json(
      {
        error: "Server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function generateAdminSlots(pricing: any[], existingBookings: any[], date: string, vehicleStock: number) {
  const slots = []
  const workStart = 10 * 60
  const workEnd = 21 * 60

  // ✅ ADMIN: Convertir time_slot a rangos ocupados
  const occupiedRanges = []
  for (const booking of existingBookings) {
    if (booking.time_slot && booking.time_slot.includes("-")) {
      const [startTime, endTime] = booking.time_slot.split("-")
      const startMinutes = timeToMinutes(startTime.trim())
      const endMinutes = timeToMinutes(endTime.trim())

      occupiedRanges.push({
        start: startMinutes,
        end: endMinutes,
        customer: booking.customer_name,
        status: booking.status,
      })
    }
  }

  // Generar slots para cada opción de pricing
  for (const option of pricing) {
    if (!option || !option.duration) continue

    const duration = getDuration(option.duration)

    for (let start = workStart; start + duration <= workEnd; start += 30) {
      const end = start + duration

      // Contar conflictos para calcular stock disponible
      const conflicts = occupiedRanges.filter((range) => start < range.end && end > range.start)
      const availableUnits = Math.max(0, vehicleStock - conflicts.length)

      if (!isInPast(start, date)) {
        slots.push({
          startTime: minutesToTime(start),
          endTime: minutesToTime(end),
          duration: option.duration,
          label: option.label || option.duration,
          price: option.price || 50,
          available: availableUnits > 0,
          availableUnits: availableUnits,
          totalUnits: vehicleStock,
          conflicts: conflicts.length,
        })
      }
    }
  }

  return slots.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
}

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0
  const [hours, minutes] = timeStr.split(":").map(Number)
  return hours * 60 + minutes
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}

function getDuration(duration: string): number {
  const durationMap: Record<string, number> = {
    "30min": 30,
    "1hour": 60,
    "2hour": 120,
    "3hour": 180,
    "4hour": 240,
    halfday: 240,
    fullday: 480,
  }
  return durationMap[duration] || 60
}

function isInPast(slotStart: number, date: string): boolean {
  try {
    const now = new Date()
    const slotDate = new Date(date)
    if (slotDate.toDateString() !== now.toDateString()) return false
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    return slotStart <= currentMinutes
  } catch {
    return false
  }
}
