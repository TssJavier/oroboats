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
function timeToMinutes(timeString: string): number {
  if (!timeString || typeof timeString !== "string") return 0
  const [hours, minutes] = timeString.split(":").map(Number)
  return hours * 60 + minutes
}

// Función auxiliar para convertir minutos a hora (HH:MM)
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}

// Función principal para generar slots
export function generateSlotsForVehicle(
  vehicleType: string,
  businessSchedule: { startTime: string; endTime: string },
  existingBookings: ExistingBooking[],
  durationType = "regular",
  vehicleCategory = "default",
) {
  console.log("⚙️ Generando slots con parámetros:")
  console.log(`   - Tipo: ${vehicleType}`)
  console.log(`   - Categoría: ${vehicleCategory}`)
  console.log(`   - Horario: ${businessSchedule.startTime} - ${businessSchedule.endTime}`)
  console.log(`   - Duración: ${durationType}`)
  console.log(`   - Reservas existentes: ${existingBookings.length}`)

  // Convertir horarios a minutos
  const startMinutes = timeToMinutes(businessSchedule.startTime)
  const endMinutes = timeToMinutes(businessSchedule.endTime)

  // Procesar reservas existentes
  const occupiedRanges = existingBookings
    .map((booking) => {
      const timeSlot = booking.time_slot || booking.timeSlot || ""
      const [startTime, endTime] = timeSlot.split("-")

      if (!startTime || !endTime) {
        console.log(`⚠️ Reserva con formato inválido:`, booking)
        return null
      }

      return {
        start: timeToMinutes(startTime.trim()),
        end: timeToMinutes(endTime.trim()),
        customer: booking.customer_name || booking.customerName || "Cliente",
        id: booking.id,
        timeSlot: timeSlot,
      }
    })
    .filter(Boolean) // Filtrar nulls

  console.log("🚫 Reservas ocupadas:")
  occupiedRanges.forEach((range) => {
    if (range) {
      // Verificar que range no sea null
      console.log(`   - ${minutesToTime(range.start)}-${minutesToTime(range.end)} (${range.customer})`)
    }
  })

  const hasConflict = (checkStart: string, checkEnd: string): boolean => {
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
      const checkStartMin = timeToMinutes(checkStart)
      const checkEndMin = timeToMinutes(checkEnd)
      const bookingStartMin = timeToMinutes(bookingStart)
      const bookingEndMin = timeToMinutes(bookingEnd)

      // Detectar solapamiento: hay conflicto si los rangos se solapan
      const overlaps = checkStartMin < bookingEndMin && checkEndMin > bookingStartMin

      if (overlaps) {
        const customerName = booking.customer_name || booking.customerName || "Cliente"
        console.log(
          `❌ Conflicto detectado: ${checkStart}-${checkEnd} solapa con ${bookingStart}-${bookingEnd} (${customerName})`,
        )
      }

      return overlaps
    })
  }

  // Función para verificar si un slot ya pasó (solo para hoy)
  const isPastSlot = (slotStart: number, selectedDate: string): boolean => {
    const now = new Date()
    const today = new Date().toISOString().split("T")[0]

    if (selectedDate !== today) return false

    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes()
    return slotStart < currentTimeInMinutes
  }

  const slots = []
  const selectedDate =
    existingBookings[0]?.booking_date || existingBookings[0]?.bookingDate || new Date().toISOString().split("T")[0]

  // ✅ CORREGIDO: Usar los valores exactos de la base de datos
  if (durationType === "30min" || durationType === "30 minutos" || durationType === "regular") {
    // Slots de 30 minutos: 10:00-10:30, 10:30-11:00, etc.
    console.log("🕐 Generando slots de 30 minutos...")

    for (let time = startMinutes; time < endMinutes; time += 30) {
      const slotStart = time
      const slotEnd = time + 30
      const timeString = minutesToTime(slotStart)
      const endTimeString = minutesToTime(slotEnd)

      if (slotEnd > endMinutes) break // No exceder horario de cierre

      const isOccupied = hasConflict(timeString, endTimeString)
      const isPast = isPastSlot(slotStart, selectedDate)

      slots.push({
        time: minutesToTime(slotStart),
        available: !isOccupied && !isPast,
        type: "regular",
        restricted: false,
        restrictionReason: undefined,
        endTime: minutesToTime(slotEnd),
        label: `${minutesToTime(slotStart)} - ${minutesToTime(slotEnd)}`,
      })
    }
  }

  // ✅ CORREGIDO: Usar "1hour" que es lo que viene de la BD
  if (durationType === "1hour" || durationType === "1 hora" || durationType === "1h" || durationType === "hour") {
    // Slots de 1 hora: 10:00-11:00, 10:30-11:30, 11:00-12:00, etc.
    console.log("🕐 Generando slots de 1 hora...")

    for (let time = startMinutes; time < endMinutes; time += 30) {
      const slotStart = time
      const slotEnd = time + 60
      const timeString = minutesToTime(slotStart)
      const endTimeString = minutesToTime(slotEnd)

      if (slotEnd > endMinutes) break // No exceder horario de cierre

      const isOccupied = hasConflict(timeString, endTimeString)
      const isPast = isPastSlot(slotStart, selectedDate)

      slots.push({
        time: minutesToTime(slotStart),
        available: !isOccupied && !isPast,
        type: "regular",
        restricted: false,
        restrictionReason: undefined,
        endTime: minutesToTime(slotEnd),
        label: `${minutesToTime(slotStart)} - ${minutesToTime(slotEnd)}`,
      })
    }
  }

  // ✅ CORREGIDO: Usar "2hour" que es lo que viene de la BD
  if (durationType === "2hour" || durationType === "2 horas" || durationType === "2h") {
    // Slots de 2 horas: 10:00-12:00, 10:30-12:30, etc.
    console.log("🕐 Generando slots de 2 horas...")

    for (let time = startMinutes; time < endMinutes; time += 30) {
      const slotStart = time
      const slotEnd = time + 120
      const timeString = minutesToTime(slotStart)
      const endTimeString = minutesToTime(slotEnd)

      if (slotEnd > endMinutes) break

      const isOccupied = hasConflict(timeString, endTimeString)
      const isPast = isPastSlot(slotStart, selectedDate)

      slots.push({
        time: minutesToTime(slotStart),
        available: !isOccupied && !isPast,
        type: "regular",
        restricted: false,
        restrictionReason: undefined,
        endTime: minutesToTime(slotEnd),
        label: `${minutesToTime(slotStart)} - ${minutesToTime(slotEnd)}`,
      })
    }
  }

  // ✅ CORREGIDO: Usar "halfday" que es lo que viene de la BD
  if (durationType === "halfday" || durationType === "medio día" || durationType === "half-day") {
    console.log("🕐 Generando slots de medio día...")

    // Mañana: 10:00-15:00
    const morningStart = startMinutes
    const morningEnd = timeToMinutes("15:00")
    const morningOccupied = hasConflict(minutesToTime(morningStart), minutesToTime(morningEnd))
    const morningPast = isPastSlot(morningStart, selectedDate)

    slots.push({
      time: minutesToTime(morningStart),
      available: !morningOccupied && !morningPast,
      type: "morning-half",
      restricted: false,
      restrictionReason: undefined,
      endTime: minutesToTime(morningEnd),
      label: `Mañana (${minutesToTime(morningStart)} - ${minutesToTime(morningEnd)})`,
    })

    // Tarde: 15:00-21:00
    const afternoonStart = timeToMinutes("15:00")
    const afternoonEnd = endMinutes
    const afternoonOccupied = hasConflict(minutesToTime(afternoonStart), minutesToTime(afternoonEnd))
    const afternoonPast = isPastSlot(afternoonStart, selectedDate)

    slots.push({
      time: minutesToTime(afternoonStart),
      available: !afternoonOccupied && !afternoonPast,
      type: "afternoon-half",
      restricted: false,
      restrictionReason: undefined,
      endTime: minutesToTime(afternoonEnd),
      label: `Tarde (${minutesToTime(afternoonStart)} - ${minutesToTime(afternoonEnd)})`,
    })
  }

  // ✅ CORREGIDO: Usar "fullday" que es lo que viene de la BD
  if (durationType === "fullday" || durationType === "día completo" || durationType === "full-day") {
    console.log("🕐 Generando slot de día completo...")

    const fullDayStart = startMinutes
    const fullDayEnd = endMinutes
    const fullDayOccupied = hasConflict(minutesToTime(fullDayStart), minutesToTime(fullDayEnd))
    const fullDayPast = isPastSlot(fullDayStart, selectedDate)

    slots.push({
      time: minutesToTime(fullDayStart),
      available: !fullDayOccupied && !fullDayPast,
      type: "fullday",
      restricted: false,
      restrictionReason: undefined,
      endTime: minutesToTime(fullDayEnd),
      label: `Día completo (${minutesToTime(fullDayStart)} - ${minutesToTime(fullDayEnd)})`,
    })
  }

  // Mostrar resumen
  const availableSlots = slots.filter((s) => s.available)
  const unavailableSlots = slots.filter((s) => !s.available)

  console.log(`✅ Slots generados: ${slots.length}`)
  console.log(`   - Disponibles: ${availableSlots.length}`)
  console.log(`   - No disponibles: ${unavailableSlots.length}`)

  console.log("✅ Slots disponibles:")
  availableSlots.forEach((slot) => {
    console.log(`   - ${slot.label}`)
  })

  console.log("❌ Slots no disponibles:")
  unavailableSlots.forEach((slot) => {
    console.log(`   - ${slot.label}`)
  })

  return slots
}
