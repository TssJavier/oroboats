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
      SELECT id, name, type, pricing, available, stock, requires_license
      FROM vehicles 
      WHERE id = ${vehicleId}
      LIMIT 1
    `)

    if (!vehicleQuery || vehicleQuery.length === 0) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
    }

    const vehicle = vehicleQuery[0]
    console.log("✅ [ADMIN] Vehicle found:", vehicle.name, "Requires license:", vehicle.requires_license)

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
      Boolean(vehicle.requires_license),
    )

    return NextResponse.json({
      availableSlots: slots,
      debug: {
        vehicleName: vehicle.name,
        vehicleType: vehicle.type,
        vehicleStock: vehicle.stock || 1,
        requiresLicense: vehicle.requires_license,
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

// ✅ FUNCIÓN AUXILIAR MEJORADA: Verificar solapamientos entre TODAS las duraciones
function checkSlotConflicts(
  startTime: string,
  endTime: string,
  existingBookings: any[],
  vehicleStock: number,
): {
  available: boolean
  availableUnits: number
  conflicts: string[]
  usedStock: number
} {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)

  console.log(`🔍 [ADMIN] Verificando conflictos para ${startTime}-${endTime}`)

  // ✅ DETECTAR TODOS LOS SOLAPAMIENTOS independientemente de la duración
  const overlappingBookings = existingBookings.filter((booking) => {
    if (!booking.time_slot || !booking.time_slot.includes("-")) {
      return false
    }

    const [bookingStart, bookingEnd] = booking.time_slot.split("-").map((t: string) => t.trim())
    const bookingStartMin = timeToMinutes(bookingStart)
    const bookingEndMin = timeToMinutes(bookingEnd)

    // ✅ DETECCIÓN CORRECTA DE SOLAPAMIENTOS
    const overlaps = startMinutes < bookingEndMin && endMinutes > bookingStartMin

    if (overlaps) {
      console.log(
        `   🚫 [ADMIN] SOLAPAMIENTO: ${startTime}-${endTime} solapa con ${bookingStart}-${bookingEnd} (${booking.customer_name})`,
      )
    }

    return overlaps
  })

  const usedStock = overlappingBookings.length
  const availableUnits = Math.max(0, vehicleStock - usedStock)
  const conflicts = overlappingBookings.map((b) => `${b.customer_name}: ${b.time_slot} (${b.status})`)

  console.log(`   📊 [ADMIN] Stock usado: ${usedStock}/${vehicleStock}, Disponible: ${availableUnits}`)

  return {
    available: availableUnits > 0,
    availableUnits,
    conflicts,
    usedStock,
  }
}

function generateAdminSlots(
  pricing: any[],
  existingBookings: any[],
  date: string,
  vehicleStock: number,
  vehicleType: string,
  requiresLicense: boolean,
) {
  const slots = []
  const workStart = 10 * 60 // 10:00
  const workEnd = 21 * 60 // 21:00

  // ✅ RESTRICCIÓN HORARIA: Motos sin licencia solo de 14:00 a 16:00
  const restrictedStart = 14 * 60 // 14:00
  const restrictedEnd = 16 * 60 // 16:00

  console.log("🔧 [ADMIN] Generando slots con verificación ESTRICTA de solapamientos")
  console.log(`📦 [ADMIN] Stock total: ${vehicleStock}`)
  console.log(`📋 [ADMIN] Reservas existentes: ${existingBookings.length}`)

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

      // ✅ VERIFICAR RESTRICCIONES DE LICENCIA
      const slotStartMinutes = startHour * 60
      const slotEndMinutes = endHour * 60

      let isAllowed = true
      if (vehicleType === "jetski" && requiresLicense) {
        // Motos CON licencia NO pueden alquilarse de 14:00 a 16:00
        if (slotStartMinutes < restrictedEnd && slotEndMinutes > restrictedStart) {
          isAllowed = false
          console.log(`🚫 [ADMIN] Slot ${startTime}-${endTime} bloqueado para jetski con licencia (horas restringidas)`)
        }
      } else if (vehicleType === "jetski" && !requiresLicense) {
        // Motos SIN licencia SOLO pueden alquilarse de 14:00 a 16:00
        if (slotStartMinutes < restrictedStart || slotEndMinutes > restrictedEnd) {
          isAllowed = false
          console.log(
            `🚫 [ADMIN] Slot ${startTime}-${endTime} bloqueado para jetski sin licencia (fuera de horas permitidas)`,
          )
        }
      }

      // ✅ VERIFICAR DISPONIBILIDAD CON DETECCIÓN ESTRICTA DE SOLAPAMIENTOS
      const availability = checkSlotConflicts(startTime, endTime, existingBookings, vehicleStock)

      if (!isInPast(startHour * 60, date) && isAllowed) {
        slots.push({
          startTime: startTime,
          endTime: endTime,
          duration: option.duration,
          label: option.label || `Medio día (${startTime} - ${endTime})`,
          price: option.price || 50,
          available: availability.available,
          availableUnits: availability.availableUnits,
          totalUnits: vehicleStock,
          conflicts: availability.usedStock,
          restricted: !isAllowed,
          conflictDetails: availability.conflicts,
        })
      }
    } else if (option.duration.startsWith("fullday_") || option.duration === "fullday") {
      // Para día completo, siempre es de 10:00 a 21:00
      const startTime = "10:00"
      const endTime = "21:00"

      // ✅ VERIFICAR RESTRICCIONES DE LICENCIA PARA DÍA COMPLETO
      let isAllowed = true
      if (vehicleType === "jetski" && requiresLicense) {
        // Motos CON licencia NO pueden hacer día completo (incluye horas restringidas)
        isAllowed = false
        console.log(`🚫 [ADMIN] Día completo bloqueado para jetski con licencia (incluye horas restringidas)`)
      } else if (vehicleType === "jetski" && !requiresLicense) {
        // Motos SIN licencia NO pueden hacer día completo (solo 14:00-16:00)
        isAllowed = false
        console.log(`🚫 [ADMIN] Día completo bloqueado para jetski sin licencia (fuera de horas permitidas)`)
      }

      // ✅ VERIFICAR DISPONIBILIDAD CON DETECCIÓN ESTRICTA DE SOLAPAMIENTOS
      const availability = checkSlotConflicts(startTime, endTime, existingBookings, vehicleStock)

      if (!isInPast(10 * 60, date) && isAllowed) {
        slots.push({
          startTime: startTime,
          endTime: endTime,
          duration: option.duration,
          label: option.label || `Día completo (${startTime} - ${endTime})`,
          price: option.price || 100,
          available: availability.available,
          availableUnits: availability.availableUnits,
          totalUnits: vehicleStock,
          conflicts: availability.usedStock,
          restricted: !isAllowed,
          conflictDetails: availability.conflicts,
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

        // ✅ VERIFICAR RESTRICCIONES DE LICENCIA
        let isAllowed = true
        if (vehicleType === "jetski" && requiresLicense) {
          // Motos CON licencia NO pueden alquilarse de 14:00 a 16:00
          if (start < restrictedEnd && end > restrictedStart) {
            isAllowed = false
          }
        } else if (vehicleType === "jetski" && !requiresLicense) {
          // Motos SIN licencia SOLO pueden alquilarse de 14:00 a 16:00
          if (start < restrictedStart || end > restrictedEnd) {
            isAllowed = false
          }
        }

        // ✅ VERIFICAR DISPONIBILIDAD CON DETECCIÓN ESTRICTA DE SOLAPAMIENTOS
        const availability = checkSlotConflicts(startTime, endTime, existingBookings, vehicleStock)

        if (!isInPast(start, date) && isAllowed) {
          slots.push({
            startTime: startTime,
            endTime: endTime,
            duration: option.duration,
            label: option.label || `${getDurationLabel(option.duration)} (${startTime} - ${endTime})`,
            price: option.price || 50,
            available: availability.available,
            availableUnits: availability.availableUnits,
            totalUnits: vehicleStock,
            conflicts: availability.usedStock,
            restricted: !isAllowed,
            conflictDetails: availability.conflicts,
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
