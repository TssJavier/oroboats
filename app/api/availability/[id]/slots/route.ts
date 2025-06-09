import { type NextRequest, NextResponse } from "next/server"
import { sql } from "drizzle-orm"
import { db } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🚀 Availability API started with FIXED STOCK support")

    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const durationType = searchParams.get("durationType")

    const vehicleId = params.id

    if (!vehicleId || !date) {
      console.log("❌ Missing required parameters")
      return NextResponse.json({ error: "Vehicle ID and date required" }, { status: 400 })
    }

    console.log(`🔍 Processing request:`)
    console.log(`   - Vehicle ID: ${vehicleId}`)
    console.log(`   - Date: ${date}`)
    console.log(`   - Duration Type: ${durationType}`)

    let vehicle = null
    let existingBookings = []

    try {
      console.log(`🚗 Fetching vehicle ${vehicleId} with stock...`)

      const vehicleQuery = await db.execute(sql`
        SELECT id, name, type, requires_license, pricing, available, stock
        FROM vehicles 
        WHERE id = ${vehicleId}
        LIMIT 1
      `)

      if (!vehicleQuery || vehicleQuery.length === 0) {
        console.log("❌ Vehicle not found")
        return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
      }

      vehicle = vehicleQuery[0]
      console.log("✅ Vehicle found:", vehicle.name, "Stock:", vehicle.stock || 1)

      // Parsear pricing
      if (typeof vehicle.pricing === "string") {
        try {
          vehicle.pricing = JSON.parse(vehicle.pricing) as any[]
          console.log("✅ Pricing parsed, options:", (vehicle.pricing as any[]).length)
        } catch (e) {
          console.log("⚠️ Error parsing pricing, using defaults")
          vehicle.pricing = []
        }
      }

      // ✅ CRÍTICO: Obtener reservas CONFIRMADAS para la fecha específica
      console.log(`📅 Fetching CONFIRMED bookings for vehicle ${vehicleId} on ${date}...`)

      const bookingsQuery = await db.execute(sql`
        SELECT 
          id,
          customer_name,
          start_time,
          end_time,
          duration,
          status,
          created_at,
          booking_date
        FROM bookings 
        WHERE vehicle_id = ${vehicleId} 
        AND booking_date = ${date}
        AND status IN ('confirmed', 'pending')
        ORDER BY start_time ASC
      `)

      existingBookings = bookingsQuery || []

      console.log("📊 CONFIRMED bookings found for date", date, ":", existingBookings.length)
      existingBookings.forEach((booking, index) => {
        console.log(
          `  ${index + 1}. ${booking.customer_name} - ${booking.start_time}-${booking.end_time} (${booking.status})`,
        )
      })

      console.log("✅ Database connection successful - using REAL data with STOCK")
    } catch (dbError) {
      console.log("❌ Database query FAILED")
      console.log("Error message:", dbError instanceof Error ? dbError.message : String(dbError))

      return NextResponse.json(
        {
          error: "Database connection failed",
          details: dbError instanceof Error ? dbError.message : String(dbError),
        },
        { status: 500 },
      )
    }

    if (!vehicle.available) {
      console.log("❌ Vehicle not available")
      return NextResponse.json({ slots: [] })
    }

    // ✅ ARREGLADO: Generar slots con verificación ESTRICTA de stock
    console.log("⚙️ Generating slots with STRICT STOCK verification for date:", date)
    console.log("📦 Vehicle stock:", vehicle.stock || 1)

    const slots = generateSlotsWithStrictStock(
      vehicle.pricing as any[],
      existingBookings,
      date,
      durationType,
      typeof vehicle.stock === "number" ? vehicle.stock : 1,
      vehicle.type as string,
      Boolean(vehicle.requires_license),
    )

    console.log("✅ Generated slots with strict stock:", slots.length)

    return NextResponse.json({
      slots: slots,
      vehicleType: vehicle.type,
      vehicleCategory: getVehicleCategory(vehicle.type as string, Boolean(vehicle.requires_license)),
      debug: {
        vehicleName: vehicle.name,
        vehicleStock: vehicle.stock || 1,
        existingBookings: existingBookings.length,
        date: date,
        durationType: durationType,
        databaseConnected: true,
        bookingDetails: existingBookings.map((b) => ({
          customer: b.customer_name,
          time: `${b.start_time}-${b.end_time}`,
          status: b.status,
        })),
      },
    })
  } catch (error) {
    console.error("❌ API Error:", error)
    return NextResponse.json(
      {
        error: "Server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function getVehicleCategory(type: string, requiresLicense: boolean): string {
  if (type === "jetski") {
    return requiresLicense ? "jetski_license" : "jetski_no_license"
  } else if (type === "boat") {
    return requiresLicense ? "boat_license" : "boat_no_license"
  }
  return "unknown"
}

// ✅ FUNCIÓN PARA NORMALIZAR TIEMPO (quitar segundos)
function normalizeTime(timeStr: string): string {
  if (!timeStr) return ""

  // Si tiene formato "HH:MM:SS", convertir a "HH:MM"
  if (timeStr.includes(":") && timeStr.split(":").length === 3) {
    const parts = timeStr.split(":")
    return `${parts[0]}:${parts[1]}`
  }

  // Si ya tiene formato "HH:MM", devolverlo tal como está
  return timeStr
}

function generateSlotsWithStrictStock(
  pricing: any[],
  existingBookings: any[],
  date: string,
  durationType: string | null,
  vehicleStock: number,
  vehicleType: string,
  requiresLicense: boolean,
) {
  console.log("🔧 Generating slots with STRICT STOCK verification for date:", date)
  console.log("📦 Total vehicle stock:", vehicleStock)
  console.log("🎯 Duration type filter:", durationType)

  const slots = []
  const workStart = 10 * 60 // 10:00 AM
  const workEnd = 21 * 60 // 9:00 PM

  // Filtrar pricing por tipo de duración
  let relevantPricing = pricing
  if (durationType) {
    console.log("🔍 Filtering pricing by durationType:", durationType)

    if (durationType === "halfday") {
      relevantPricing = pricing.filter((p) => p.duration.startsWith("halfday"))
    } else if (durationType === "fullday") {
      relevantPricing = pricing.filter((p) => p.duration.startsWith("fullday"))
    } else if (durationType === "30min") {
      relevantPricing = pricing.filter((p) => p.duration === "30min")
    } else if (durationType === "hourly") {
      relevantPricing = pricing.filter(
        (p) => p.duration !== "30min" && !p.duration.startsWith("halfday") && !p.duration.startsWith("fullday"),
      )
    } else {
      relevantPricing = pricing.filter((p) => p.duration === durationType)
    }
  }

  console.log(`⏱️ Processing ${relevantPricing.length} pricing options for type: ${durationType}`)

  // ✅ CRÍTICO: Contar reservas por slot EXACTO con NORMALIZACIÓN DE TIEMPO
  const bookingCounts = new Map<string, number>()

  for (const booking of existingBookings) {
    // ✅ ARREGLADO: Normalizar tiempos para que coincidan las claves
    const normalizedStartTime = normalizeTime(booking.start_time)
    const normalizedEndTime = normalizeTime(booking.end_time)
    const slotKey = `${normalizedStartTime}-${normalizedEndTime}`

    const currentCount = bookingCounts.get(slotKey) || 0
    bookingCounts.set(slotKey, currentCount + 1)

    console.log(
      `📊 STRICT: Booking count for slot ${slotKey}: ${currentCount + 1} (normalized from ${booking.start_time}-${booking.end_time})`,
    )
  }

  console.log("📋 All booking counts (normalized):")
  for (const [slot, count] of bookingCounts.entries()) {
    console.log(`   - ${slot}: ${count} reservas`)
  }

  // Generar slots para cada opción de pricing
  for (const option of relevantPricing) {
    if (!option || !option.duration) continue

    const duration = getDuration(option.duration)
    console.log(`⏱️ Processing ${option.label}: ${duration} min`)

    // Para barcos, usar horarios específicos basados en la duración
    if (vehicleType === "boat") {
      if (option.duration.startsWith("halfday")) {
        // Extraer horario específico del duration (ej: "halfday_10_14" -> 10:00-14:00)
        const match = option.duration.match(/halfday_(\d+)_(\d+)/)
        if (match) {
          const startHour = Number.parseInt(match[1])
          const endHour = Number.parseInt(match[2])
          const startTime = `${startHour.toString().padStart(2, "0")}:00`
          const endTime = `${endHour.toString().padStart(2, "0")}:00`

          const slotKey = `${startTime}-${endTime}`
          const bookingsForSlot = bookingCounts.get(slotKey) || 0
          const availableUnits = Math.max(0, vehicleStock - bookingsForSlot)

          console.log(
            `🚤 BOAT HALFDAY: ${slotKey} - Bookings: ${bookingsForSlot}, Stock: ${vehicleStock}, Available: ${availableUnits}`,
          )

          // Solo añadir si no es pasado y hay unidades disponibles
          if (!isInPast(startHour * 60, date) && availableUnits > 0) {
            slots.push({
              time: startTime,
              endTime: endTime,
              duration: option.duration,
              label: option.label,
              price: option.price,
              available: true,
              availableUnits: availableUnits,
              totalUnits: vehicleStock,
              type: "halfday",
            })
            console.log(`✅ BOAT HALFDAY SLOT ADDED: ${startTime}-${endTime} - Available: ${availableUnits}`)
          } else {
            console.log(
              `❌ BOAT HALFDAY SLOT BLOCKED: ${startTime}-${endTime} - Past: ${isInPast(startHour * 60, date)}, Available: ${availableUnits}`,
            )
          }
        }
      } else if (option.duration.startsWith("fullday")) {
        // ✅ CRÍTICO: Día completo 10:00-21:00
        const startTime = "10:00"
        const endTime = "21:00"
        const slotKey = `${startTime}-${endTime}`
        const bookingsForSlot = bookingCounts.get(slotKey) || 0
        const availableUnits = Math.max(0, vehicleStock - bookingsForSlot)

        console.log(
          `🚤 BOAT FULLDAY: ${slotKey} - Bookings: ${bookingsForSlot}, Stock: ${vehicleStock}, Available: ${availableUnits}`,
        )

        if (!isInPast(10 * 60, date) && availableUnits > 0) {
          slots.push({
            time: startTime,
            endTime: endTime,
            duration: option.duration,
            label: option.label,
            price: option.price,
            available: true,
            availableUnits: availableUnits,
            totalUnits: vehicleStock,
            type: "fullday",
          })
          console.log(`✅ BOAT FULLDAY SLOT ADDED: ${startTime}-${endTime} - Available: ${availableUnits}`)
        } else {
          console.log(
            `❌ BOAT FULLDAY SLOT BLOCKED: ${startTime}-${endTime} - Past: ${isInPast(10 * 60, date)}, Available: ${availableUnits}`,
          )
        }
      }
    } else {
      // Para motos de agua, generar slots cada 30 minutos
      console.log(`🏍️ Generating jetski slots for ${option.duration} (${duration} min)`)

      for (let start = workStart; start + duration <= workEnd; start += 30) {
        const end = start + duration
        const startTime = minutesToTime(start)
        const endTime = minutesToTime(end)
        const slotKey = `${startTime}-${endTime}`

        const bookingsForSlot = bookingCounts.get(slotKey) || 0
        const availableUnits = Math.max(0, vehicleStock - bookingsForSlot)

        // Verificar si es pasado
        if (!isInPast(start, date) && availableUnits > 0) {
          slots.push({
            time: startTime,
            endTime: endTime,
            duration: option.duration,
            label: option.label,
            price: option.price,
            available: true,
            availableUnits: availableUnits,
            totalUnits: vehicleStock,
            type: "regular",
          })
          console.log(
            `✅ JETSKI SLOT ADDED: ${startTime}-${endTime} (${option.duration}) - Available: ${availableUnits}`,
          )
        } else {
          console.log(
            `❌ JETSKI SLOT BLOCKED: ${startTime}-${endTime} - Past: ${isInPast(start, date)}, Available: ${availableUnits}`,
          )
        }
      }
    }
  }

  // Ordenar por hora
  slots.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))

  console.log("✅ FINAL AVAILABLE SLOTS with STRICT STOCK for date", date, ":")
  slots.forEach((slot, index) => {
    console.log(
      `  ${index + 1}. ${slot.time}-${slot.endTime} (${slot.duration}) - €${slot.price} - Stock: ${slot.availableUnits}/${slot.totalUnits}`,
    )
  })

  return slots
}

function timeToMinutes(timeStr: string): number {
  if (!timeStr || typeof timeStr !== "string") return 0

  try {
    const parts = timeStr.split(":")
    if (parts.length !== 2) return 0

    const hours = Number.parseInt(parts[0]) || 0
    const minutes = Number.parseInt(parts[1]) || 0

    return hours * 60 + minutes
  } catch {
    return 0
  }
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}

function getDuration(duration: string): number {
  if (!duration) return 30

  const durationMap: Record<string, number> = {
    "30min": 30,
    "1hour": 60,
    "2hour": 120,
    "3hour": 180,
    "4hour": 240,
    halfday: 240,
    fullday: 660, // 11 horas (10:00-21:00)
  }

  // Para duraciones específicas de barcos
  if (duration.startsWith("halfday_")) {
    return 240 // 4 horas
  }
  if (duration.startsWith("fullday_")) {
    return 660 // 11 horas
  }

  return durationMap[duration] || 60
}

function isInPast(slotStart: number, date: string): boolean {
  try {
    const now = new Date()
    const slotDate = new Date(date)

    // Solo verificar si es hoy
    if (slotDate.toDateString() !== now.toDateString()) {
      return false
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    return slotStart <= currentMinutes
  } catch {
    return false
  }
}
