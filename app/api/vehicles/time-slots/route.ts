import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "tu-secreto-super-seguro-cambiar-en-produccion")

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Time-slots API started")

    // Verificar autenticación
    const token = request.cookies.get("admin-token")?.value
    if (!token) {
      console.log("❌ No token")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    await jwtVerify(token, JWT_SECRET)
    console.log("✅ Authenticated")

    // Obtener datos del request
    const requestData = await request.json()
    console.log("📝 Request data:", requestData)

    const { vehicleId, date } = requestData

    if (!vehicleId || !date) {
      console.log("❌ Missing data")
      return NextResponse.json({ error: "Vehicle ID and date required" }, { status: 400 })
    }

    // CONEXIÓN MEJORADA Y MÁS ROBUSTA
    let vehicle = null
    let existingBookings = []

    try {
      console.log("🔌 Attempting ROBUST database connection...")

      if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL not configured")
      }

      console.log("📊 DATABASE_URL configured, length:", process.env.DATABASE_URL.length)

      // Importar neon con manejo de errores mejorado
      const { neon } = await import("@neondatabase/serverless")

      // Crear cliente con configuración más robusta
      const sql = neon(process.env.DATABASE_URL, {
        fullResults: false,
      })

      // Test de conexión más simple
      console.log("🧪 Testing basic connection...")
      await sql`SELECT 1`
      console.log("✅ Basic connection successful")

      // Obtener vehículo con timeout
      console.log(`🚗 Fetching vehicle ${vehicleId}...`)
      const vehicleQuery = sql`
        SELECT id, name, pricing, available
        FROM vehicles 
        WHERE id = ${vehicleId}
        LIMIT 1
      `

      const vehicles = (await Promise.race([
        vehicleQuery,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Vehicle query timeout")), 10000)),
      ])) as any[]

      if (!vehicles || vehicles.length === 0) {
        console.log("❌ Vehicle not found")
        return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
      }

      vehicle = vehicles[0]
      console.log("✅ Vehicle found:", vehicle.name)

      // Parsear pricing
      if (typeof vehicle.pricing === "string") {
        try {
          vehicle.pricing = JSON.parse(vehicle.pricing)
          console.log("✅ Pricing parsed, options:", vehicle.pricing.length)
        } catch (e) {
          console.log("⚠️ Error parsing pricing, using defaults")
          vehicle.pricing = [
            { label: "30 minutos", duration: "30min", price: 600 },
            { label: "1 hora", duration: "1hour", price: 700 },
          ]
        }
      }

      // Obtener reservas con query más específica PARA LA FECHA CORRECTA
      console.log(`📅 Fetching bookings for vehicle ${vehicleId} on ${date}...`)
      const bookingsQuery = sql`
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
      `

      existingBookings = (await Promise.race([
        bookingsQuery,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Bookings query timeout")), 10000)),
      ])) as any[]

      console.log("📊 REAL bookings found for date", date, ":", existingBookings.length)
      existingBookings.forEach((booking, index) => {
        console.log(
          `  ${index + 1}. ${booking.customer_name} - ${booking.time_slot} (${booking.status}) - Date: ${booking.booking_date}`,
        )
      })
    } catch (dbError) {
      console.log("❌ Database connection FAILED")
      console.log("Error type:", dbError?.constructor?.name)
      console.log("Error message:", dbError instanceof Error ? dbError.message : String(dbError))

      // ❌ NO USAR DATOS DE FALLBACK - Devolver error real
      return NextResponse.json(
        {
          error: "Database connection failed",
          details: dbError instanceof Error ? dbError.message : String(dbError),
          suggestion: "Check DATABASE_URL configuration and database availability",
        },
        { status: 500 },
      )
    }

    if (!vehicle.available) {
      console.log("❌ Vehicle not available")
      return NextResponse.json({ availableSlots: [] })
    }

    // Generar slots
    console.log("⚙️ Generating slots with REAL booking conflicts for date:", date)
    const slots = generateSlots(vehicle.pricing, existingBookings, date)

    console.log("✅ Generated slots:", slots.length)

    return NextResponse.json({
      availableSlots: slots,
      debug: {
        vehicleName: vehicle.name,
        existingBookings: existingBookings.length,
        bookingsFound: existingBookings.map(
          (b) => `${b.customer_name}: ${b.time_slot} (${b.status}) - ${b.booking_date}`,
        ),
        date: date,
        databaseConnected: true,
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

function generateSlots(pricing: any[], existingBookings: any[], date: string) {
  console.log("🔧 Generating slots with REAL conflicts for date:", date)

  const slots = []
  const workStart = 10 * 60 // 10:00 AM
  const workEnd = 21 * 60 // 9:00 PM

  console.log(`⏰ Work hours: ${minutesToTime(workStart)} - ${minutesToTime(workEnd)}`)

  // Convertir reservas REALES a rangos ocupados
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
        bookingDate: booking.booking_date,
      })
      console.log(
        `🚫 OCCUPIED: ${startTime.trim()}-${endTime.trim()} by ${booking.customer_name} (${booking.status}) on ${booking.booking_date}`,
      )
    }
  }

  console.log("🚫 Total REAL occupied ranges for date", date, ":", occupiedRanges.length)

  // Generar slots para cada opción de pricing
  for (const option of pricing) {
    if (!option || !option.duration) continue

    const duration = getDuration(option.duration)
    console.log(`⏱️ Processing ${option.label}: ${duration} min`)

    // Generar slots cada 30 minutos
    for (let start = workStart; start + duration <= workEnd; start += 30) {
      const end = start + duration

      // Verificar conflictos con reservas REALES
      const conflictingRange = occupiedRanges.find((range) => {
        return start < range.end && end > range.start
      })

      if (conflictingRange) {
        console.log(
          `❌ REAL CONFLICT: ${minutesToTime(start)}-${minutesToTime(end)} conflicts with ${conflictingRange.customer}'s booking ${minutesToTime(conflictingRange.start)}-${minutesToTime(conflictingRange.end)} on ${conflictingRange.bookingDate}`,
        )
        continue
      }

      // Verificar si es pasado
      const isPast = isInPast(start, date)
      if (isPast) {
        console.log(`⏰ PAST: ${minutesToTime(start)}-${minutesToTime(end)} is in the past`)
        continue
      }

      slots.push({
        startTime: minutesToTime(start),
        endTime: minutesToTime(end),
        duration: option.duration,
        label: option.label || option.duration,
        price: option.price || 50,
      })
      console.log(`✅ AVAILABLE: ${minutesToTime(start)}-${minutesToTime(end)} (${option.label}) - €${option.price}`)
    }
  }

  // Ordenar por hora
  slots.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))

  console.log("✅ FINAL AVAILABLE SLOTS for date", date, "(after REAL conflicts):")
  slots.forEach((slot, index) => {
    console.log(`  ${index + 1}. ${slot.startTime}-${slot.endTime} (${slot.label}) - €${slot.price}`)
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
    fullday: 480,
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
