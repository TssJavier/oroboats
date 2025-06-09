import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { sql } from "drizzle-orm"
import { db } from "@/lib/db"

interface PricingOption {
  duration: string
  label?: string
  price?: number
}

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
    const { vehicleId, date, durationType } = requestData

    if (!vehicleId || !date) {
      return NextResponse.json({ error: "Vehicle ID and date required" }, { status: 400 })
    }

    console.log(`🔍 [ADMIN] Request: Vehicle ${vehicleId}, Date: ${date}, Duration: ${durationType || "all"}`)

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
    let pricing = []
    if (typeof vehicle.pricing === "string") {
      try {
        pricing = JSON.parse(vehicle.pricing)
      } catch (e) {
        pricing = []
      }
    } else if (Array.isArray(vehicle.pricing)) {
      pricing = vehicle.pricing
    }

    // Filtrar por tipo de duración si se especifica
    if (durationType) {
      console.log(`🔍 [ADMIN] Filtering by duration type: ${durationType}`)

      if (durationType === "halfday") {
        pricing = pricing.filter((p: PricingOption) => p.duration.startsWith("halfday"))
      } else if (durationType === "fullday") {
        pricing = pricing.filter((p: PricingOption) => p.duration.startsWith("fullday"))
      } else {
        pricing = pricing.filter((p: PricingOption) => p.duration === durationType)
      }

      console.log(`🔍 [ADMIN] Found ${pricing.length} pricing options for this duration`)
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

    // Generar slots para admin
    const slots = generateAdminSlots(
      pricing,
      existingBookings,
      date,
      typeof vehicle.stock === "number" ? vehicle.stock : 1,
      vehicle.type as string,
    )

    return NextResponse.json({
      availableSlots: slots,
      debug: {
        vehicleName: vehicle.name,
        vehicleType: vehicle.type,
        vehicleStock: vehicle.stock || 1,
        existingBookings: existingBookings.length,
        bookingsFound: existingBookings.map((b) => `${b.customer_name}: ${b.time_slot} (${b.status})`),
        date: date,
        durationType: durationType || "all",
        pricingOptions: pricing.length,
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

function generateAdminSlots(
  pricing: any[],
  existingBookings: any[],
  date: string,
  vehicleStock: number,
  vehicleType: string,
) {
  const slots = []
  const workStart = 10 * 60 // 10:00
  const workEnd = 21 * 60 // 21:00

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
        timeSlot: booking.time_slot.trim(),
      })
    }
  }

  // Contar reservas por slot
  const bookingCounts = new Map()
  for (const booking of existingBookings) {
    if (booking.time_slot) {
      const slotKey = booking.time_slot.trim()
      const currentCount = bookingCounts.get(slotKey) || 0
      bookingCounts.set(slotKey, currentCount + 1)
    }
  }

  // Generar slots para cada opción de pricing
  for (const option of pricing) {
    if (!option || !option.duration) continue

    // ✅ CORREGIDO: Manejo especial para medio día y día completo
    if (option.duration.startsWith("halfday_") || option.duration === "halfday") {
      // Extraer horarios específicos para medio día
      let startHour = 10
      let endHour = 14

      // Si es un formato específico como halfday_10_14, extraer las horas
      if (option.duration.startsWith("halfday_")) {
        const match = option.duration.match(/halfday_(\d+)_(\d+)/)
        if (match) {
          startHour = Number.parseInt(match[1])
          endHour = Number.parseInt(match[2])
        }
      }

      const startTime = `${startHour.toString().padStart(2, "0")}:00`
      const endTime = `${endHour.toString().padStart(2, "0")}:00`
      const timeSlot = `${startTime}-${endTime}`

      // Verificar disponibilidad
      const bookingsForSlot = bookingCounts.get(timeSlot) || 0
      const availableUnits = Math.max(0, vehicleStock - bookingsForSlot)

      if (!isInPast(startHour * 60, date)) {
        slots.push({
          startTime: startTime,
          endTime: endTime,
          duration: option.duration,
          label: option.label || `Medio día (${startTime} - ${endTime})`,
          price: option.price || 50,
          available: availableUnits > 0,
          availableUnits: availableUnits,
          totalUnits: vehicleStock,
          conflicts: bookingsForSlot,
        })
      }
    } else if (option.duration.startsWith("fullday_") || option.duration === "fullday") {
      // Para día completo, siempre es de 10:00 a 21:00
      const startTime = "10:00"
      const endTime = "21:00"
      const timeSlot = `${startTime}-${endTime}`

      // Verificar disponibilidad
      const bookingsForSlot = bookingCounts.get(timeSlot) || 0
      const availableUnits = Math.max(0, vehicleStock - bookingsForSlot)

      if (!isInPast(10 * 60, date)) {
        slots.push({
          startTime: startTime,
          endTime: endTime,
          duration: option.duration,
          label: option.label || `Día completo (${startTime} - ${endTime})`,
          price: option.price || 100,
          available: availableUnits > 0,
          availableUnits: availableUnits,
          totalUnits: vehicleStock,
          conflicts: bookingsForSlot,
        })
      }
    } else {
      // Para duraciones normales (30min, 1hour, 2hour, etc.)
      const duration = getDuration(option.duration)

      // Generar slots cada 30 minutos
      for (let start = workStart; start + duration <= workEnd; start += 30) {
        const end = start + duration
        const startTime = minutesToTime(start)
        const endTime = minutesToTime(end)
        const timeSlot = `${startTime}-${endTime}`

        // Verificar disponibilidad
        const bookingsForSlot = bookingCounts.get(timeSlot) || 0
        const availableUnits = Math.max(0, vehicleStock - bookingsForSlot)

        // Contar conflictos para slots que se solapan
        const conflicts = occupiedRanges.filter((range) => start < range.end && end > range.start)
        const conflictCount = conflicts.length

        if (!isInPast(start, date)) {
          slots.push({
            startTime: startTime,
            endTime: endTime,
            duration: option.duration,
            label: option.label || `${getDurationLabel(option.duration)} (${startTime} - ${endTime})`,
            price: option.price || 50,
            available: availableUnits > 0,
            availableUnits: availableUnits,
            totalUnits: vehicleStock,
            conflicts: conflictCount,
          })
        }
      }
    }
  }

  return slots.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
}

function getDurationLabel(duration: string): string {
  if (duration === "30min") return "30 minutos"
  if (duration === "1hour") return "1 hora"
  if (duration === "2hour") return "2 horas"
  if (duration === "3hour") return "3 horas"
  if (duration === "4hour") return "4 horas"
  if (duration.startsWith("halfday")) return "Medio día"
  if (duration.startsWith("fullday")) return "Día completo"
  return duration
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
    fullday: 660,
  }

  // Si es un formato específico como halfday_10_14
  if (duration.startsWith("halfday_")) return 240
  if (duration.startsWith("fullday_")) return 660

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
