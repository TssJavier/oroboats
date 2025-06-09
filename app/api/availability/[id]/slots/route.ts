import { type NextRequest, NextResponse } from "next/server"
import { sql } from "drizzle-orm"
import { db } from "@/lib/db"

// ✅ FUNCIÓN CORREGIDA: Generar slots con verificación ESTRICTA de solapamientos entre TODAS las duraciones
function generateSlotsWithStrictStock(
  pricing: any[],
  existingBookings: any[],
  date: string,
  durationType: string | null,
  vehicleStock: number,
  vehicleType: string,
  requiresLicense: boolean,
) {
  // Verificar que pricing es un array válido
  if (!Array.isArray(pricing)) {
    console.log("❌ ERROR: pricing no es un array:", typeof pricing)
    return []
  }

  console.log("✅ Pricing verificado como array con", pricing.length, "elementos")

  console.log("🔧 GENERANDO SLOTS con verificación ESTRICTA de solapamientos")
  console.log("📦 Stock total del vehículo:", vehicleStock)
  console.log("🎯 Filtro de duración:", durationType)
  console.log("🔑 Requiere licencia:", requiresLicense)
  console.log("📋 Reservas existentes:", existingBookings.length)

  // Mostrar todas las reservas existentes para debugging
  console.log("📋 RESERVAS EXISTENTES DETALLADAS:")
  existingBookings.forEach((booking, index) => {
    console.log(
      `   ${index + 1}. ${booking.customer_name || "Sin nombre"}: ${booking.start_time}-${booking.end_time} (${booking.duration || "Sin duración"})`,
    )
  })

  const slots = []
  const workStart = 10 * 60 // 10:00 AM
  const workEnd = 21 * 60 // 9:00 PM

  // ✅ RESTRICCIÓN HORARIA: Motos sin licencia solo de 14:00 a 16:00
  const restrictedStart = 14 * 60 // 14:00
  const restrictedEnd = 16 * 60 // 16:00

  // Filtrar pricing por tipo de duración
  let relevantPricing = pricing
  if (durationType) {
    console.log("🔍 Filtrando pricing por durationType:", durationType)

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

  console.log(`⏱️ Procesando ${relevantPricing.length} opciones de pricing para tipo: ${durationType}`)

  // ✅ FUNCIÓN AUXILIAR: Verificar solapamientos con TODAS las reservas existentes
  function checkSlotAvailability(
    startTime: string,
    endTime: string,
  ): {
    available: boolean
    availableUnits: number
    conflicts: string[]
  } {
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = timeToMinutes(endTime)

    console.log(`🔍 Verificando disponibilidad para ${startTime}-${endTime}`)

    // Contar solapamientos con TODAS las reservas existentes
    const overlappingBookings = existingBookings.filter((booking) => {
      const bookingStart = timeToMinutes(booking.start_time)
      const bookingEnd = timeToMinutes(booking.end_time)

      // ✅ DETECCIÓN CORRECTA DE SOLAPAMIENTOS
      const overlaps = startMinutes < bookingEnd && endMinutes > bookingStart

      if (overlaps) {
        console.log(
          `   🚫 SOLAPAMIENTO: ${startTime}-${endTime} solapa con ${booking.start_time}-${booking.end_time} (${booking.customer_name}, ${booking.duration})`,
        )
      }

      return overlaps
    })

    const usedStock = overlappingBookings.length
    const availableUnits = Math.max(0, vehicleStock - usedStock)
    const conflicts = overlappingBookings.map(
      (b) => `${b.customer_name}: ${b.start_time}-${b.end_time} (${b.duration})`,
    )

    console.log(`   📊 Stock usado: ${usedStock}/${vehicleStock}, Disponible: ${availableUnits}`)

    return {
      available: availableUnits > 0,
      availableUnits,
      conflicts,
    }
  }

  // Generar slots para cada opción de pricing
  for (const option of relevantPricing) {
    if (!option || !option.duration) continue

    const duration = getDuration(option.duration)
    console.log(`⏱️ Procesando ${option.label}: ${duration} min`)

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

          // ✅ VERIFICACIÓN ESTRICTA DE DISPONIBILIDAD
          const availability = checkSlotAvailability(startTime, endTime)

          console.log(`🚤 BARCO MEDIO DÍA: ${startTime}-${endTime}`)
          console.log(`   Disponible: ${availability.available}, Unidades: ${availability.availableUnits}`)

          // Solo añadir si no es pasado y hay unidades disponibles
          if (!isInPast(startHour * 60, date) && availability.available) {
            slots.push({
              time: startTime,
              endTime: endTime,
              duration: option.duration,
              label: option.label,
              price: option.price,
              available: true,
              availableUnits: availability.availableUnits,
              totalUnits: vehicleStock,
              type: "halfday",
              conflicts: availability.conflicts,
            })
            console.log(
              `✅ BARCO MEDIO DÍA AÑADIDO: ${startTime}-${endTime} - Disponible: ${availability.availableUnits}`,
            )
          } else {
            console.log(
              `❌ BARCO MEDIO DÍA BLOQUEADO: ${startTime}-${endTime} - Pasado: ${isInPast(startHour * 60, date)}, Disponible: ${availability.available}`,
            )
          }
        }
      } else if (option.duration.startsWith("fullday")) {
        // ✅ CRÍTICO: Día completo 10:00-21:00
        const startTime = "10:00"
        const endTime = "21:00"

        // ✅ VERIFICACIÓN ESTRICTA DE DISPONIBILIDAD
        const availability = checkSlotAvailability(startTime, endTime)

        console.log(`🚤 BARCO DÍA COMPLETO: ${startTime}-${endTime}`)
        console.log(`   Disponible: ${availability.available}, Unidades: ${availability.availableUnits}`)

        if (!isInPast(10 * 60, date) && availability.available) {
          slots.push({
            time: startTime,
            endTime: endTime,
            duration: option.duration,
            label: option.label,
            price: option.price,
            available: true,
            availableUnits: availability.availableUnits,
            totalUnits: vehicleStock,
            type: "fullday",
            conflicts: availability.conflicts,
          })
          console.log(
            `✅ BARCO DÍA COMPLETO AÑADIDO: ${startTime}-${endTime} - Disponible: ${availability.availableUnits}`,
          )
        } else {
          console.log(
            `❌ BARCO DÍA COMPLETO BLOQUEADO: ${startTime}-${endTime} - Pasado: ${isInPast(10 * 60, date)}, Disponible: ${availability.available}`,
          )
        }
      }
    } else {
      // Para motos de agua, generar slots cada 30 minutos
      console.log(`🏍️ Generando slots de jetski para ${option.duration} (${duration} min)`)

      for (let start = workStart; start + duration <= workEnd; start += 30) {
        const end = start + duration
        const startTime = minutesToTime(start)
        const endTime = minutesToTime(end)

        // ✅ VERIFICACIÓN ESTRICTA DE DISPONIBILIDAD
        const availability = checkSlotAvailability(startTime, endTime)

        // ✅ RESTRICCIÓN para motos SIN licencia (no pueden reservar de 14:00 a 16:00)
        let isRestricted = false
        if (vehicleType === "jetski" && !requiresLicense) {
          // Verificar si el slot se solapa con el horario restringido (14:00-16:00)
          if (start < restrictedEnd && end > restrictedStart) {
            isRestricted = true
            console.log(`🚫 JETSKI SIN LICENCIA RESTRINGIDO: ${startTime}-${endTime} (solapa con 14:00-16:00)`)
          }
        }

        // Verificar si es pasado y si está disponible
        if (!isInPast(start, date) && availability.available && !isRestricted) {
          slots.push({
            time: startTime,
            endTime: endTime,
            duration: option.duration,
            label: option.label,
            price: option.price,
            available: true,
            availableUnits: availability.availableUnits,
            totalUnits: vehicleStock,
            type: "regular",
            conflicts: availability.conflicts,
          })
          console.log(
            `✅ JETSKI SLOT AÑADIDO: ${startTime}-${endTime} (${option.duration}) - Disponible: ${availability.availableUnits}`,
          )
        } else {
          const reason = isRestricted
            ? "Horario restringido"
            : isInPast(start, date)
              ? "Hora pasada"
              : "Sin stock disponible"
          console.log(
            `❌ JETSKI SLOT BLOQUEADO: ${startTime}-${endTime} - Razón: ${reason}, Disponible: ${availability.available}`,
          )
        }
      }
    }
  }

  // Ordenar por hora
  slots.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))

  console.log("✅ SLOTS FINALES DISPONIBLES con VERIFICACIÓN ESTRICTA para fecha", date, ":")
  slots.forEach((slot, index) => {
    console.log(
      `  ${index + 1}. ${slot.time}-${slot.endTime} (${slot.duration}) - €${slot.price} - Stock: ${slot.availableUnits}/${slot.totalUnits}`,
    )
    if (slot.conflicts && slot.conflicts.length > 0) {
      console.log(`      Conflictos detectados: ${slot.conflicts.join(", ")}`)
    }
  })

  return slots
}

function minutesToTime(minutes: number) {
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
}

function timeToMinutes(time: string) {
  const [hour, minute] = time.split(":")
  return Number.parseInt(hour) * 60 + Number.parseInt(minute)
}

function isInPast(timeInMinutes: number, date: string) {
  const now = new Date()
  const [year, month, day] = date.split("-").map(Number)
  const bookingDate = new Date(year, month - 1, day) // Month is 0-indexed

  // Set booking date to the time provided in minutes
  bookingDate.setHours(Math.floor(timeInMinutes / 60), timeInMinutes % 60, 0, 0)

  // If the booking date is in the past, return true
  return bookingDate < now
}

function getDuration(durationString: string) {
  if (durationString === "30min") {
    return 30
  } else if (durationString === "1hr") {
    return 60
  } else if (durationString === "2hr") {
    return 120
  } else if (durationString === "3hr") {
    return 180
  } else if (durationString === "4hr") {
    return 240
  } else if (durationString === "fullday") {
    return 660 // 11 hours
  } else if (durationString.startsWith("halfday")) {
    return 240 // 4 hours
  }
  return 60 // Default to 1 hour
}

function normalizeTime(time: string) {
  if (!time) return "00:00"
  const [hour, minute] = time.split(":")
  const normalizedHour = hour.padStart(2, "0")
  const normalizedMinute = minute.padStart(2, "0")
  return `${normalizedHour}:${normalizedMinute}`
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🚀 Availability API started with FIXED STOCK support")

    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const durationType = searchParams.get("durationType")

    const vehicleId = (await params).id

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

      // Parsear pricing correctamente
      let pricing = []
      try {
        if (typeof vehicle.pricing === "string") {
          pricing = JSON.parse(vehicle.pricing)
        } else if (Array.isArray(vehicle.pricing)) {
          pricing = vehicle.pricing
        } else if (vehicle.pricing && typeof vehicle.pricing === "object") {
          // Si es un objeto, convertirlo a array
          pricing = Object.values(vehicle.pricing)
        }

        console.log("✅ Pricing parsed successfully:", pricing.length, "options")
        console.log("📋 Pricing data:", JSON.stringify(pricing, null, 2))
      } catch (e) {
        console.log("⚠️ Error parsing pricing:", e)
        pricing = []
      }

      // Verificar que pricing es un array antes de continuar
      if (!Array.isArray(pricing)) {
        console.log("❌ Pricing is not an array, converting...")
        pricing = []
      }

      // Filtrar pricing por tipo de duración si se especifica
      let relevantPricing = pricing
      if (durationType) {
        console.log("🔍 Filtering pricing by durationType:", durationType)

        if (durationType === "halfday") {
          relevantPricing = pricing.filter((p) => p.duration.startsWith("halfday"))
        } else if (durationType === "fullday") {
          relevantPricing = pricing.filter((p) => p.duration.startsWith("fullday"))
        } else {
          relevantPricing = pricing.filter((p) => p.duration === durationType)
        }
      }

      console.log(`⏱️ Found ${relevantPricing.length} pricing options for type: ${durationType}`)

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
          booking_date,
          time_slot
        FROM bookings 
        WHERE vehicle_id = ${vehicleId} 
        AND booking_date = ${date}
        AND status IN ('confirmed', 'pending', 'completed')
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

    // Contar reservas por slot
    const bookingCounts = new Map()
    for (const booking of existingBookings) {
      const slotKey = booking.time_slot
      const currentCount = bookingCounts.get(slotKey) || 0
      bookingCounts.set(slotKey, currentCount + 1)
    }

    // ✅ ARREGLADO: Generar slots con restricciones de licencia
    const availableSlots = generateSlotsWithStrictStock(
      (Array.isArray(vehicle.pricing)
        ? vehicle.pricing
        : typeof vehicle.pricing === "string"
        ? (() => { try { return JSON.parse(vehicle.pricing); } catch { return []; } })()
        : vehicle.pricing && typeof vehicle.pricing === "object"
        ? Object.values(vehicle.pricing)
        : []),
      existingBookings,
      date,
      durationType,
      typeof vehicle.stock === "number" ? vehicle.stock : 1,
      vehicle.type as string,
      Boolean(vehicle.requires_license),
    )

    console.log("✅ Generated available slots:", availableSlots.length)

    // Determinar categoría del vehículo para el frontend
    let vehicleCategory = vehicle.type
    if (vehicle.type === "jetski") {
      vehicleCategory = vehicle.requires_license ? "jetski_license" : "jetski_no_license"
    } else if (vehicle.type === "boat") {
      vehicleCategory = vehicle.requires_license ? "boat_license" : "boat_no_license"
    }

    return NextResponse.json({
      slots: availableSlots,
      vehicleInfo: {
        name: vehicle.name,
        type: vehicle.type,
        stock: vehicle.stock || 1,
        requiresLicense: Boolean(vehicle.requires_license),
      },
      vehicleCategory: vehicleCategory,
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
