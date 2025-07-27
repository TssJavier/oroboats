import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { sql } from "drizzle-orm"
import { db } from "@/lib/db"

interface PricingOption {
  duration: string
  label?: string
  price?: number
  startTime?: string // Añadido para compatibilidad con halfday/fullday específicos
  endTime?: string // Añadido para compatibilidad con halfday/fullday específicos
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
    let pricing: PricingOption[] = []
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
  pricing: PricingOption[], // Usar el tipo PricingOption
  existingBookings: any[],
  date: string,
  vehicleStock: number,
  vehicleType: string,
  requiresLicense: boolean,
) {
  const slots = []
  const workStart = 10 * 60 // 10:00
  const workEnd = 21 * 60 // 21:00

  // ✅ RESTRICCIÓN HORARIA: Motos sin licencia NO pueden de 14:00 a 16:00
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
      const startTime = option.startTime || "10:00"
      const endTime = option.endTime || "14:00"

      const slotStartMinutes = timeToMinutes(startTime)
      const slotEndMinutes = timeToMinutes(endTime)

      let isAllowed = true
      if (vehicleType === "jetski") {
        if (requiresLicense) {
          // ✅ Motos CON licencia: NO tienen restricciones horarias.
          console.log(`✅ [ADMIN] Jetski con licencia: Sin restricciones horarias para ${startTime}-${endTime}.`)
        } else {
          // ✅ Motos SIN licencia: NO pueden alquilarse si solapan con 14:00 a 16:00
          if (slotStartMinutes < restrictedEnd && slotEndMinutes > restrictedStart) {
            isAllowed = false
            console.log(
              `🚫 [ADMIN] Slot ${startTime}-${endTime} bloqueado para jetski sin licencia (solapa con horas restringidas 14:00-16:00)`,
            )
          }
        }
      }

      // Solo añadir si no es pasado y está permitido
      if (!isInPast(slotEndMinutes, date) && isAllowed) {
        const availability = checkSlotConflicts(startTime, endTime, existingBookings, vehicleStock)
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
      const startTime = option.startTime || "10:00"
      const endTime = option.endTime || "21:00"

      const slotStartMinutes = timeToMinutes(startTime)
      const slotEndMinutes = timeToMinutes(endTime)

      let isAllowed = true
      if (vehicleType === "jetski") {
        if (requiresLicense) {
          // ✅ Motos CON licencia: NO tienen restricciones horarias.
          console.log(`✅ [ADMIN] Jetski con licencia: Sin restricciones horarias para ${startTime}-${endTime}.`)
        } else {
          // ✅ Motos SIN licencia: NO pueden alquilarse si solapan con 14:00 a 16:00
          // Un día completo (10:00-21:00) siempre solapa con 14:00-16:00, así que siempre se bloqueará.
          if (slotStartMinutes < restrictedEnd && slotEndMinutes > restrictedStart) {
            isAllowed = false
            console.log(
              `🚫 [ADMIN] Día completo bloqueado para jetski sin licencia (solapa con horas restringidas 14:00-16:00)`,
            )
          }
        }
      }

      // Solo añadir si no es pasado y está permitido
      if (!isInPast(slotEndMinutes, date) && isAllowed) {
        const availability = checkSlotConflicts(startTime, endTime, existingBookings, vehicleStock)
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

        let isAllowed = true
        if (vehicleType === "jetski") {
          if (requiresLicense) {
            // ✅ Motos CON licencia: NO tienen restricciones horarias.
            console.log(`✅ [ADMIN] Jetski con licencia: Sin restricciones horarias para ${startTime}-${endTime}.`)
          } else {
            // ✅ Motos SIN licencia: NO pueden alquilarse si solapan con 14:00 a 16:00
            if (start < restrictedEnd && end > restrictedStart) {
              isAllowed = false
            }
          }
        }

        // Solo añadir si no es pasado y está permitido
        if (!isInPast(end, date) && isAllowed) {
          const availability = checkSlotConflicts(startTime, endTime, existingBookings, vehicleStock)
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

  // Deduplicar slots antes de ordenar
  const uniqueSlotsMap = new Map<string, any>()
  for (const slot of slots) {
    // La clave debe ser única para cada combinación de inicio, fin y duración
    const key = `${slot.startTime}-${slot.endTime}-${slot.duration}`
    if (!uniqueSlotsMap.has(key)) {
      uniqueSlotsMap.set(key, slot)
    }
  }

  const uniqueAndSortedSlots = Array.from(uniqueSlotsMap.values()).sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
  )

  console.log("✅ [ADMIN] SLOTS FINALES DISPONIBLES (deduplicados y ordenados):", uniqueAndSortedSlots.length)
  uniqueAndSortedSlots.forEach((slot, index) => {
    console.log(
      `  ${index + 1}. ${slot.startTime}-${slot.endTime} (${slot.duration}) - €${slot.price} - Stock: ${slot.availableUnits}/${slot.totalUnits}`,
    )
    if (slot.conflictDetails && slot.conflictDetails.length > 0) {
      console.log(`      Conflictos detectados: ${slot.conflictDetails.join(", ")}`)
    }
  })

  return uniqueAndSortedSlots
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

// ✅ FUNCIÓN isInPast CORREGIDA: Ahora compara los tiempos en UTC para evitar problemas de zona horaria
function isInPast(slotEndMinutes: number, date: string): boolean {
  try {
    // Obtener la hora actual en UTC
    const nowUtc = new Date()

    // Asumimos que los slots están definidos para la zona horaria de España (GMT+2 en verano, GMT+1 en invierno).
    // Para simplificar y basándonos en tu "2 horas menos", usaremos un desfase fijo de +2 horas respecto a UTC.
    // Esto significa que 16:00 en España es 14:00 UTC.
    const TARGET_TIMEZONE_OFFSET_HOURS = 2 // Desfase de la zona horaria de los slots respecto a UTC

    // Construir la fecha y hora de fin del slot en UTC
    const [year, month, day] = date.split("-").map(Number)
    // Creamos una fecha UTC para el inicio del día del slot
    const slotEndDateTimeUtc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))

    // Convertir los minutos de fin del slot (que están en la zona horaria objetivo) a su equivalente UTC.
    // Ejemplo: Si slotEndMinutes es 16:00 (960 minutos) y el offset es +2 horas (120 minutos),
    // entonces 16:00 CEST es 14:00 UTC.
    // 960 (CEST) - 120 (offset) = 840 (UTC)
    const slotEndMinutesAdjustedToUtc = slotEndMinutes - TARGET_TIMEZONE_OFFSET_HOURS * 60

    // Establecer la hora y minutos UTC en el objeto Date del slot
    slotEndDateTimeUtc.setUTCHours(Math.floor(slotEndMinutesAdjustedToUtc / 60), slotEndMinutesAdjustedToUtc % 60, 0, 0)

    // Comparar el timestamp UTC del fin del slot con el timestamp UTC actual
    return slotEndDateTimeUtc.getTime() <= nowUtc.getTime()
  } catch (e) {
    console.error("Error in isInPast:", e)
    return false
  }
}
