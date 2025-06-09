// Constantes de horario de negocio
export const BUSINESS_HOURS = {
  START: "10:00",
  END: "21:00",
}

export interface ExistingBooking {
  id?: number | string // Añadir id
  time_slot?: string // Campo de BD: "19:00-19:30"
  timeSlot?: string // Campo alternativo camelCase
  startTime?: string // Mantener para compatibilidad
  endTime?: string // Mantener para compatibilidad
  duration?: string
  customer_name?: string
  customerName?: string
  status?: string
  booking_date?: string // Añadir booking_date
  bookingDate?: string // Añadir bookingDate
  vehicle_id?: number // ✅ NUEVO: Para identificar qué vehículo
  vehicleId?: number
}

// Función auxiliar para convertir hora (HH:MM) a minutos
export function timeToMinutes(timeString: string): number {
  if (!timeString || typeof timeString !== "string") return 0

  const [hours, minutes] = timeString.split(":").map(Number)
  return hours * 60 + minutes
}

// Función auxiliar para convertir minutos a hora (HH:MM)
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}

// Función mejorada para verificar si un slot ya pasó
export function isPastSlot(slotStart: number, selectedDate: string): boolean {
  const now = new Date()
  const today = now.toISOString().split("T")[0]

  // IMPORTANTE: Si la fecha seleccionada es futura, NUNCA está en el pasado
  if (selectedDate > today) {
    console.log(`📅 Fecha ${selectedDate} es futura (hoy: ${today}), slot disponible`)
    return false
  }

  // Si la fecha seleccionada es pasada, SIEMPRE está en el pasado
  if (selectedDate < today) {
    console.log(`📅 Fecha ${selectedDate} es pasada (hoy: ${today}), slot no disponible`)
    return true
  }

  // Solo para HOY, verificar la hora actual
  const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes()
  const isPast = slotStart <= currentTimeInMinutes

  console.log(
    `⏰ Verificando slot ${minutesToTime(slotStart)} para HOY: ${isPast ? "YA PASÓ" : "DISPONIBLE"} (ahora: ${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")})`,
  )

  return isPast
}

// ✅ FUNCIÓN CORREGIDA: Verificar disponibilidad de stock con detección de solapamientos entre TODAS las duraciones
export function checkStockAvailability(
  checkStartTime: string,
  checkEndTime: string,
  existingBookings: ExistingBooking[],
  totalStock: number,
): { available: boolean; usedStock: number; availableStock: number; conflicts: string[] } {
  const checkStart = timeToMinutes(checkStartTime)
  const checkEnd = timeToMinutes(checkEndTime)

  console.log(`📦 VERIFICANDO STOCK para slot ${checkStartTime}-${checkEndTime}`)
  console.log(`📦 Stock total disponible: ${totalStock}`)
  console.log(`📦 Reservas existentes a verificar: ${existingBookings.length}`)

  // ✅ CRÍTICO: Detectar TODOS los solapamientos independientemente de la duración
  const overlappingBookings = []
  const conflicts = []

  for (const booking of existingBookings) {
    let bookingStart: string
    let bookingEnd: string

    // Extraer horarios del booking (múltiples formatos)
    const timeSlot = booking.time_slot || booking.timeSlot
    if (timeSlot && timeSlot.includes("-")) {
      ;[bookingStart, bookingEnd] = timeSlot.split("-").map((t) => t.trim())
    } else if (booking.startTime && booking.endTime) {
      bookingStart = booking.startTime
      bookingEnd = booking.endTime
    } else {
      console.log("⚠️ Booking sin formato válido:", booking)
      continue
    }

    // Convertir a minutos para comparación precisa
    const bookingStartMin = timeToMinutes(bookingStart)
    const bookingEndMin = timeToMinutes(bookingEnd)

    // ✅ DETECCIÓN MEJORADA DE SOLAPAMIENTOS
    // Dos rangos se solapan si: checkStart < bookingEnd && checkEnd > bookingStart
    const overlaps = checkStart < bookingEndMin && checkEnd > bookingStartMin

    if (overlaps) {
      const customerName = booking.customer_name || booking.customerName || "Cliente"
      const bookingDuration = booking.duration || "Sin duración"

      overlappingBookings.push(booking)
      conflicts.push(`${customerName}: ${bookingStart}-${bookingEnd} (${bookingDuration})`)

      console.log(`🚫 SOLAPAMIENTO DETECTADO:`)
      console.log(`   Nuevo slot: ${checkStartTime}-${checkEndTime}`)
      console.log(`   Reserva existente: ${bookingStart}-${bookingEnd} (${customerName}, ${bookingDuration})`)
      console.log(`   Minutos: Nuevo [${checkStart}-${checkEnd}] vs Existente [${bookingStartMin}-${bookingEndMin}]`)
    }
  }

  const usedStock = overlappingBookings.length
  const availableStock = Math.max(0, totalStock - usedStock)

  console.log(`📦 RESULTADO STOCK:`)
  console.log(`   - Solapamientos encontrados: ${usedStock}`)
  console.log(`   - Stock usado: ${usedStock}/${totalStock}`)
  console.log(`   - Stock disponible: ${availableStock}`)
  console.log(`   - ¿Disponible?: ${availableStock > 0}`)

  if (conflicts.length > 0) {
    console.log(`🚫 CONFLICTOS:`)
    conflicts.forEach((conflict, index) => {
      console.log(`   ${index + 1}. ${conflict}`)
    })
  }

  return {
    available: availableStock > 0,
    usedStock,
    availableStock,
    conflicts, // ✅ NUEVO: Lista de conflictos para debugging
  }
}

// ✅ FUNCIÓN ACTUALIZADA: Detectar conflictos considerando stock y devolver detalles
export function hasConflict(
  checkStartTime: string,
  checkEndTime: string,
  existingBookings: ExistingBooking[],
  totalStock = 1, // Por defecto 1 unidad (comportamiento anterior)
): { hasConflict: boolean; details: any } {
  const stockCheck = checkStockAvailability(checkStartTime, checkEndTime, existingBookings, totalStock)

  return {
    hasConflict: !stockCheck.available,
    details: {
      availableStock: stockCheck.availableStock,
      usedStock: stockCheck.usedStock,
      totalStock: totalStock,
      conflicts: stockCheck.conflicts,
    },
  }
}

// ✅ NUEVA FUNCIÓN: Generar slots específicos para barcos
function generateBoatSlots(
  existingBookings: ExistingBooking[],
  selectedDate: string,
  durationType: string,
  totalStock = 1,
): any[] {
  console.log(`🚤 Generando slots específicos para barcos - Duración: ${durationType}, Stock: ${totalStock}`)

  const slots = []

  if (durationType === "halfday" || durationType === "medio día") {
    // ✅ MEDIO DÍA: Generar los 8 slots de 4 horas específicos
    const fourHourSlots = [
      { start: "10:00", end: "14:00", label: "10:00 - 14:00" },
      { start: "11:00", end: "15:00", label: "11:00 - 15:00" },
      { start: "12:00", end: "16:00", label: "12:00 - 16:00" },
      { start: "13:00", end: "17:00", label: "13:00 - 17:00" },
      { start: "14:00", end: "18:00", label: "14:00 - 18:00" },
      { start: "15:00", end: "19:00", label: "15:00 - 19:00" },
      { start: "16:00", end: "20:00", label: "16:00 - 20:00" },
      { start: "17:00", end: "21:00", label: "17:00 - 21:00" },
    ]

    for (const timeSlot of fourHourSlots) {
      const stockCheck = checkStockAvailability(timeSlot.start, timeSlot.end, existingBookings, totalStock)
      const isPast = isPastSlot(timeToMinutes(timeSlot.start), selectedDate)

      const slot = {
        time: timeSlot.start,
        available: stockCheck.available && !isPast,
        type: "boat-4hour",
        restricted: false,
        restrictionReason: undefined,
        endTime: timeSlot.end,
        label: timeSlot.label,
        stockInfo: stockCheck, // ✅ NUEVO: Información de stock
      }

      console.log(
        `Slot 4h ${slot.label}: ${slot.available ? "✅ DISPONIBLE" : "❌ NO DISPONIBLE"} (stock: ${stockCheck.availableStock}/${totalStock}, pasado: ${isPast})`,
      )

      slots.push(slot)
    }
  } else if (durationType === "fullday" || durationType === "día completo") {
    // ✅ DÍA COMPLETO: Solo 1 slot de 11 horas
    const fullDaySlot = {
      start: "10:00",
      end: "21:00",
      label: "10:00 - 21:00",
    }

    const stockCheck = checkStockAvailability(fullDaySlot.start, fullDaySlot.end, existingBookings, totalStock)
    const isPast = isPastSlot(timeToMinutes(fullDaySlot.start), selectedDate)

    const slot = {
      time: fullDaySlot.start,
      available: stockCheck.available && !isPast,
      type: "boat-fullday",
      restricted: false,
      restrictionReason: undefined,
      endTime: fullDaySlot.end,
      label: fullDaySlot.label,
      stockInfo: stockCheck, // ✅ NUEVO: Información de stock
    }

    console.log(
      `Slot día completo ${slot.label}: ${slot.available ? "✅ DISPONIBLE" : "❌ NO DISPONIBLE"} (stock: ${stockCheck.availableStock}/${totalStock}, pasado: ${isPast})`,
    )

    slots.push(slot)
  }

  return slots
}

// ✅ FUNCIÓN ACTUALIZADA: Generar slots con soporte para stock
export function generateSlotsForVehicle(
  vehicleType: string,
  businessSchedule: { startTime: string; endTime: string },
  existingBookings: ExistingBooking[],
  durationType = "regular",
  vehicleCategory = "default",
  selectedDate?: string,
  totalStock = 1, // ✅ NUEVO: Parámetro de stock
) {
  console.log("⚙️ Generando slots con parámetros:")
  console.log(`   - Tipo: ${vehicleType}`)
  console.log(`   - Categoría: ${vehicleCategory}`)
  console.log(`   - Horario: ${businessSchedule.startTime} - ${businessSchedule.endTime}`)
  console.log(`   - Duración: ${durationType}`)
  console.log(`   - Fecha seleccionada: ${selectedDate || "No especificada"}`)
  console.log(`   - Reservas existentes: ${existingBookings.length}`)
  console.log(`   - Stock total: ${totalStock}`) // ✅ NUEVO

  // Mostrar detalles de reservas existentes
  console.log("📋 Detalles de reservas existentes:")
  existingBookings.forEach((booking, index) => {
    const timeSlot = booking.time_slot || booking.timeSlot || "Sin horario"
    const customer = booking.customer_name || booking.customerName || "Sin nombre"
    console.log(`   ${index + 1}. ${customer}: ${timeSlot} (${booking.status})`)
  })

  // Obtener la fecha actual para comparaciones
  const today = new Date().toISOString().split("T")[0]
  const bookingDate = selectedDate || existingBookings[0]?.bookingDate || today

  console.log(`📅 Fecha para verificación de slots pasados: ${bookingDate} (hoy: ${today})`)

  // ✅ NUEVA LÓGICA: Si es un barco, usar slots específicos según duración
  if (vehicleType === "boat") {
    console.log("🚤 Detectado vehículo tipo BARCO - Usando slots específicos")
    return generateBoatSlots(existingBookings, bookingDate, durationType, totalStock)
  }

  // ✅ LÓGICA EXISTENTE ACTUALIZADA: Para jetskis y otros vehículos con stock
  console.log("🏍️ Vehículo tipo JETSKI/OTRO - Usando lógica regular con stock")

  // Convertir horarios a minutos para facilitar cálculos
  const startMinutes = timeToMinutes(businessSchedule.startTime)
  const endMinutes = timeToMinutes(businessSchedule.endTime)

  // Determinar intervalos basados en duración
  let intervalMinutes = 30 // Por defecto 30 minutos

  // Mapeo de duraciones a minutos
  const durationMap: Record<string, number> = {
    "30min": 30,
    "1hour": 60,
    "2hour": 120,
    "3hour": 180,
    "4hour": 240,
    halfday: 300, // 5 horas
    fullday: 660, // 11 horas (10:00-21:00)
    // Versiones en español
    "30 minutos": 30,
    "1 hora": 60,
    "2 horas": 120,
    "3 horas": 180,
    "4 horas": 240,
    "medio día": 300,
    "día completo": 660,
  }

  // Usar el mapeo para determinar la duración
  intervalMinutes = durationMap[durationType] || 30

  console.log(`⏱️ Intervalo seleccionado: ${intervalMinutes} minutos`)

  // Generar todos los slots posibles
  const slots = []

  // Para slots regulares (30min, 1h, etc.)
  if (!["halfday", "fullday", "medio día", "día completo"].includes(durationType)) {
    console.log(`🕐 Generando slots regulares de ${intervalMinutes} minutos...`)

    for (let time = startMinutes; time <= endMinutes - intervalMinutes; time += 30) {
      const slotStart = time
      const slotEnd = time + intervalMinutes

      const startTimeString = minutesToTime(slotStart)
      const endTimeString = minutesToTime(slotEnd)

      // ✅ ACTUALIZADO: Verificar stock en lugar de conflicto simple
      const stockCheck = checkStockAvailability(startTimeString, endTimeString, existingBookings, totalStock)

      // Verificar si el slot ya ha pasado
      const isPast = isPastSlot(slotStart, bookingDate)

      // Añadir el slot a la lista
      const slot = {
        time: startTimeString,
        available: stockCheck.available && !isPast,
        type: "regular",
        restricted: false,
        restrictionReason: undefined,
        endTime: endTimeString,
        label: `${startTimeString} - ${endTimeString}`,
        stockInfo: stockCheck, // ✅ NUEVO: Información de stock
      }

      console.log(
        `Slot ${slot.label}: ${slot.available ? "✅ DISPONIBLE" : "❌ NO DISPONIBLE"} (stock: ${stockCheck.availableStock}/${totalStock}, pasado: ${isPast})`,
      )

      slots.push(slot)
    }
  }

  // Para slots de medio día y día completo (solo para jetskis)
  if (["halfday", "fullday", "medio día", "día completo"].includes(durationType)) {
    console.log(`🕐 Generando slots de medio día/día completo...`)

    // Lógica para medio día (mañana: 10:00-15:00)
    if (["halfday", "fullday", "medio día", "día completo"].includes(durationType)) {
      const morningStart = startMinutes // 10:00
      const morningEnd = timeToMinutes("15:00") // 15:00
      const morningStartString = minutesToTime(morningStart)
      const morningEndString = minutesToTime(morningEnd)

      const stockCheck = checkStockAvailability(morningStartString, morningEndString, existingBookings, totalStock)
      const morningPast = isPastSlot(morningStart, bookingDate)

      const morningSlot = {
        time: morningStartString,
        available: stockCheck.available && !morningPast,
        type: "morning-half",
        restricted: false,
        restrictionReason: undefined,
        endTime: morningEndString,
        label: `Mañana (${morningStartString} - ${morningEndString})`,
        stockInfo: stockCheck,
      }

      console.log(
        `Slot ${morningSlot.label}: ${morningSlot.available ? "✅ DISPONIBLE" : "❌ NO DISPONIBLE"} (stock: ${stockCheck.availableStock}/${totalStock}, pasado: ${morningPast})`,
      )

      slots.push(morningSlot)
    }

    // Lógica para medio día (tarde: 15:00-21:00)
    if (["halfday", "fullday", "medio día", "día completo"].includes(durationType)) {
      const afternoonStart = timeToMinutes("15:00") // 15:00
      const afternoonEnd = endMinutes // 21:00
      const afternoonStartString = minutesToTime(afternoonStart)
      const afternoonEndString = minutesToTime(afternoonEnd)

      const stockCheck = checkStockAvailability(afternoonStartString, afternoonEndString, existingBookings, totalStock)
      const afternoonPast = isPastSlot(afternoonStart, bookingDate)

      const afternoonSlot = {
        time: afternoonStartString,
        available: stockCheck.available && !afternoonPast,
        type: "afternoon-half",
        restricted: false,
        restrictionReason: undefined,
        endTime: afternoonEndString,
        label: `Tarde (${afternoonStartString} - ${afternoonEndString})`,
        stockInfo: stockCheck,
      }

      console.log(
        `Slot ${afternoonSlot.label}: ${afternoonSlot.available ? "✅ DISPONIBLE" : "❌ NO DISPONIBLE"} (stock: ${stockCheck.availableStock}/${totalStock}, pasado: ${afternoonPast})`,
      )

      slots.push(afternoonSlot)
    }

    // Lógica para día completo (10:00-21:00)
    if (["fullday", "día completo"].includes(durationType)) {
      const fullDayStart = startMinutes // 10:00
      const fullDayEnd = endMinutes // 21:00
      const fullDayStartString = minutesToTime(fullDayStart)
      const fullDayEndString = minutesToTime(fullDayEnd)

      const stockCheck = checkStockAvailability(fullDayStartString, fullDayEndString, existingBookings, totalStock)
      const fullDayPast = isPastSlot(fullDayStart, bookingDate)

      const fullDaySlot = {
        time: fullDayStartString,
        available: stockCheck.available && !fullDayPast,
        type: "fullday",
        restricted: false,
        restrictionReason: undefined,
        endTime: fullDayEndString,
        label: `Día completo (${fullDayStartString} - ${fullDayEndString})`,
        stockInfo: stockCheck,
      }

      console.log(
        `Slot ${fullDaySlot.label}: ${fullDaySlot.available ? "✅ DISPONIBLE" : "❌ NO DISPONIBLE"} (stock: ${stockCheck.availableStock}/${totalStock}, pasado: ${fullDayPast})`,
      )

      slots.push(fullDaySlot)
    }
  }

  // Mostrar resumen de slots generados
  console.log(`✅ Slots generados: ${slots.length}`)
  console.log(`   - Disponibles: ${slots.filter((s) => s.available).length}`)
  console.log(`   - No disponibles: ${slots.filter((s) => !s.available).length}`)

  return slots
}
