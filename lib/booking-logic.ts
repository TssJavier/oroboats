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

// Función mejorada para detectar conflictos con reservas existentes
export function hasConflict(
  checkStartTime: string,
  checkEndTime: string,
  existingBookings: ExistingBooking[],
): boolean {
  const checkStart = timeToMinutes(checkStartTime)
  const checkEnd = timeToMinutes(checkEndTime)

  console.log(`🔍 Verificando conflicto para slot ${checkStartTime}-${checkEndTime}`)

  return existingBookings.some((booking) => {
    // Extraer tiempo de inicio y fin del booking
    let bookingStart: string
    let bookingEnd: string

    // Priorizar time_slot de la BD
    const timeSlot = booking.time_slot || booking.timeSlot
    if (timeSlot && timeSlot.includes("-")) {
      ;[bookingStart, bookingEnd] = timeSlot.split("-").map((t) => t.trim())
    } else if (booking.startTime && booking.endTime) {
      bookingStart = booking.startTime
      bookingEnd = booking.endTime
    } else {
      console.log("⚠️ Booking sin formato válido:", booking)
      return false
    }

    // Convertir a minutos para comparación precisa
    const bookingStartMin = timeToMinutes(bookingStart)
    const bookingEndMin = timeToMinutes(bookingEnd)

    // Detectar solapamiento: hay conflicto si los rangos se solapan
    const overlaps = checkStart < bookingEndMin && checkEnd > bookingStartMin

    if (overlaps) {
      const customerName = booking.customer_name || booking.customerName || "Cliente"
      console.log(
        `❌ CONFLICTO DETECTADO: ${checkStartTime}-${checkEndTime} solapa con ${bookingStart}-${bookingEnd} (${customerName})`,
      )
    } else {
      console.log(`✅ Sin conflicto: ${checkStartTime}-${checkEndTime} vs ${bookingStart}-${bookingEnd}`)
    }

    return overlaps
  })
}

// Función mejorada para generar slots
export function generateSlotsForVehicle(
  vehicleType: string,
  businessSchedule: { startTime: string; endTime: string },
  existingBookings: any[],
  durationType = "regular",
  vehicleCategory = "default",
  selectedDate?: string, // Nuevo parámetro para fecha seleccionada
) {
  console.log("⚙️ Generando slots con parámetros:")
  console.log(`   - Tipo: ${vehicleType}`)
  console.log(`   - Categoría: ${vehicleCategory}`)
  console.log(`   - Horario: ${businessSchedule.startTime} - ${businessSchedule.endTime}`)
  console.log(`   - Duración: ${durationType}`)
  console.log(`   - Fecha seleccionada: ${selectedDate || "No especificada"}`)
  console.log(`   - Reservas existentes: ${existingBookings.length}`)

  // Mostrar detalles de reservas existentes
  console.log("📋 Detalles de reservas existentes:")
  existingBookings.forEach((booking, index) => {
    const timeSlot = booking.time_slot || booking.timeSlot || "Sin horario"
    const customer = booking.customer_name || booking.customerName || "Sin nombre"
    console.log(`   ${index + 1}. ${customer}: ${timeSlot} (${booking.status})`)
  })

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

  // Obtener la fecha actual para comparaciones
  const today = new Date().toISOString().split("T")[0]
  // Usar la fecha seleccionada o la fecha de la primera reserva o hoy
  const bookingDate = selectedDate || existingBookings[0]?.bookingDate || today

  console.log(`📅 Fecha para verificación de slots pasados: ${bookingDate} (hoy: ${today})`)

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

      // Verificar si el slot actual está ocupado usando la función hasConflict
      const isOccupied = hasConflict(startTimeString, endTimeString, existingBookings)

      // Verificar si el slot ya ha pasado usando la función mejorada
      const isPast = isPastSlot(slotStart, bookingDate)

      // Añadir el slot a la lista
      const slot = {
        time: startTimeString,
        available: !isOccupied && !isPast,
        type: "regular",
        restricted: false,
        restrictionReason: undefined,
        endTime: endTimeString,
        label: `${startTimeString} - ${endTimeString}`,
      }

      console.log(
        `Slot ${slot.label}: ${slot.available ? "✅ DISPONIBLE" : "❌ NO DISPONIBLE"} (ocupado: ${isOccupied}, pasado: ${isPast})`,
      )

      slots.push(slot)
    }
  }

  // Para slots de medio día y día completo
  if (["halfday", "fullday", "medio día", "día completo"].includes(durationType)) {
    console.log(`🕐 Generando slots de medio día/día completo...`)

    // Lógica para medio día (mañana: 10:00-15:00)
    if (["halfday", "fullday", "medio día", "día completo"].includes(durationType)) {
      const morningStart = startMinutes // 10:00
      const morningEnd = timeToMinutes("15:00") // 15:00
      const morningStartString = minutesToTime(morningStart)
      const morningEndString = minutesToTime(morningEnd)

      const morningOccupied = hasConflict(morningStartString, morningEndString, existingBookings)
      const morningPast = isPastSlot(morningStart, bookingDate)

      const morningSlot = {
        time: morningStartString,
        available: !morningOccupied && !morningPast,
        type: "morning-half",
        restricted: false,
        restrictionReason: undefined,
        endTime: morningEndString,
        label: `Mañana (${morningStartString} - ${morningEndString})`,
      }

      console.log(
        `Slot ${morningSlot.label}: ${morningSlot.available ? "✅ DISPONIBLE" : "❌ NO DISPONIBLE"} (ocupado: ${morningOccupied}, pasado: ${morningPast})`,
      )

      slots.push(morningSlot)
    }

    // Lógica para medio día (tarde: 15:00-21:00)
    if (["halfday", "fullday", "medio día", "día completo"].includes(durationType)) {
      const afternoonStart = timeToMinutes("15:00") // 15:00
      const afternoonEnd = endMinutes // 21:00
      const afternoonStartString = minutesToTime(afternoonStart)
      const afternoonEndString = minutesToTime(afternoonEnd)

      const afternoonOccupied = hasConflict(afternoonStartString, afternoonEndString, existingBookings)
      const afternoonPast = isPastSlot(afternoonStart, bookingDate)

      const afternoonSlot = {
        time: afternoonStartString,
        available: !afternoonOccupied && !afternoonPast,
        type: "afternoon-half",
        restricted: false,
        restrictionReason: undefined,
        endTime: afternoonEndString,
        label: `Tarde (${afternoonStartString} - ${afternoonEndString})`,
      }

      console.log(
        `Slot ${afternoonSlot.label}: ${afternoonSlot.available ? "✅ DISPONIBLE" : "❌ NO DISPONIBLE"} (ocupado: ${afternoonOccupied}, pasado: ${afternoonPast})`,
      )

      slots.push(afternoonSlot)
    }

    // Lógica para día completo (10:00-21:00)
    if (["fullday", "día completo"].includes(durationType)) {
      const fullDayStart = startMinutes // 10:00
      const fullDayEnd = endMinutes // 21:00
      const fullDayStartString = minutesToTime(fullDayStart)
      const fullDayEndString = minutesToTime(fullDayEnd)

      const fullDayOccupied = hasConflict(fullDayStartString, fullDayEndString, existingBookings)
      const fullDayPast = isPastSlot(fullDayStart, bookingDate)

      const fullDaySlot = {
        time: fullDayStartString,
        available: !fullDayOccupied && !fullDayPast,
        type: "fullday",
        restricted: false,
        restrictionReason: undefined,
        endTime: fullDayEndString,
        label: `Día completo (${fullDayStartString} - ${fullDayEndString})`,
      }

      console.log(
        `Slot ${fullDaySlot.label}: ${fullDaySlot.available ? "✅ DISPONIBLE" : "❌ NO DISPONIBLE"} (ocupado: ${fullDayOccupied}, pasado: ${fullDayPast})`,
      )

      slots.push(fullDaySlot)
    }
  }

  // Mostrar resumen de slots generados
  console.log(`✅ Slots generados: ${slots.length}`)
  console.log(`   - Disponibles: ${slots.filter((s) => s.available).length}`)
  console.log(`   - No disponibles: ${slots.filter((s) => !s.available).length}`)

  // Mostrar slots disponibles e indisponibles
  console.log(`✅ Slots disponibles:`)
  slots.filter((s) => s.available).forEach((s) => console.log(`   - ${s.label}`))

  console.log(`❌ Slots no disponibles:`)
  slots.filter((s) => !s.available).forEach((s) => console.log(`   - ${s.label}`))

  return slots
}
