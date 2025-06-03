// Configuración de horarios de negocio
export const BUSINESS_HOURS = {
  START: "10:00",
  END: "21:00",
  // Restricciones para TODOS los vehículos sin licencia (motos Y barcos)
  NO_LICENSE_RESTRICTED_START: "14:00",
  NO_LICENSE_RESTRICTED_END: "16:00",
}

// Slots de medio día para barcos (4 horas cada uno)
export const BOAT_HALFDAY_SLOTS = [
  { start: "10:00", end: "14:00", label: "10:00 - 14:00" }, // ✅ OK - termina antes de restricción
  { start: "11:00", end: "15:00", label: "11:00 - 15:00" }, // ❌ Se solapa con 14:00-16:00
  { start: "12:00", end: "16:00", label: "12:00 - 16:00" }, // ❌ Se solapa con 14:00-16:00
  { start: "16:00", end: "20:00", label: "16:00 - 20:00" }, // ✅ OK - empieza después de restricción
  { start: "17:00", end: "21:00", label: "17:00 - 21:00" }, // ✅ OK - empieza después de restricción
]

export interface BookingSlot {
  time: string
  available: boolean
  type?: "regular" | "boat-halfday" | "fullday"
  restricted?: boolean
  restrictionReason?: string
  endTime?: string
  label?: string
}

export interface ExistingBooking {
  startTime: string
  endTime: string
  duration: string
}

export interface Schedule {
  startTime: string
  endTime: string
}

export function generateSlotsForVehicle(
  vehicleType: string,
  schedule: Schedule,
  existingBookings: ExistingBooking[],
  requestedDuration = "regular",
  vehicleCategory?: string,
): BookingSlot[] {
  const startTime = BUSINESS_HOURS.START
  const endTime = BUSINESS_HOURS.END

  console.log(`🚤 Generando slots para ${vehicleType} (${vehicleCategory})`)
  console.log(`📋 Duración solicitada: ${requestedDuration}`)
  console.log(`📋 Reservas existentes: ${existingBookings.length}`)

  if (vehicleType === "boat") {
    return generateBoatSlots(startTime, endTime, existingBookings, requestedDuration, vehicleCategory)
  } else {
    return generateJetskiSlots(startTime, endTime, existingBookings, requestedDuration, vehicleCategory)
  }
}

function generateBoatSlots(
  startTime: string,
  endTime: string,
  existingBookings: ExistingBooking[],
  requestedDuration: string,
  vehicleCategory?: string,
): BookingSlot[] {
  const slots: BookingSlot[] = []

  // Verificar si es barco sin licencia
  const isBoatNoLicense = vehicleCategory === "boat_no_license"

  console.log(`⛵ Generando slots para barco:`)
  console.log(`   - Categoría: ${vehicleCategory}`)
  console.log(`   - Sin licencia: ${isBoatNoLicense}`)
  console.log(`   - Duración: ${requestedDuration}`)

  const hasConflict = (checkStart: string, checkEnd: string): boolean => {
    return existingBookings.some((booking) => {
      return (
        (checkStart >= booking.startTime && checkStart < booking.endTime) ||
        (checkEnd > booking.startTime && checkEnd <= booking.endTime) ||
        (checkStart <= booking.startTime && checkEnd >= booking.endTime)
      )
    })
  }

  // Función para verificar si un slot se solapa con horario restringido
  const overlapsWith14to16 = (slotStart: string, slotEnd: string): boolean => {
    if (!isBoatNoLicense) return false

    const slotStartMinutes = timeToMinutes(slotStart)
    const slotEndMinutes = timeToMinutes(slotEnd)
    const restrictedStart = timeToMinutes(BUSINESS_HOURS.NO_LICENSE_RESTRICTED_START)
    const restrictedEnd = timeToMinutes(BUSINESS_HOURS.NO_LICENSE_RESTRICTED_END)

    return (
      (slotStartMinutes >= restrictedStart && slotStartMinutes < restrictedEnd) ||
      (slotEndMinutes > restrictedStart && slotEndMinutes <= restrictedEnd) ||
      (slotStartMinutes <= restrictedStart && slotEndMinutes >= restrictedEnd)
    )
  }

  if (requestedDuration === "halfday") {
    console.log(`📋 Generando slots de medio día...`)
    // Slots de medio día para barcos
    BOAT_HALFDAY_SLOTS.forEach((slot, index) => {
      const hasBookingConflict = hasConflict(slot.start, slot.end)
      const hasRestrictionConflict = overlapsWith14to16(slot.start, slot.end)

      console.log(`   Slot ${index + 1}: ${slot.start}-${slot.end}`)
      console.log(`     - Conflicto reserva: ${hasBookingConflict}`)
      console.log(`     - Conflicto restricción: ${hasRestrictionConflict}`)

      if (!hasBookingConflict && !hasRestrictionConflict) {
        slots.push({
          time: slot.start,
          available: true,
          type: "boat-halfday",
          endTime: slot.end,
          label: slot.label,
        })
        console.log(`     ✅ Slot agregado`)
      } else {
        console.log(`     ❌ Slot rechazado`)
      }
    })
  } else if (requestedDuration === "fullday") {
    console.log(`📋 Generando slot de día completo...`)
    // 🚨 IMPORTANTE: Barcos sin licencia NO pueden alquilarse todo el día
    if (isBoatNoLicense) {
      console.log(`❌ Barcos sin licencia NO pueden alquilarse todo el día (restricción 14:00-16:00)`)
      // No agregar ningún slot de día completo para barcos sin licencia
    } else {
      // Solo barcos CON licencia pueden alquilarse todo el día
      const hasBookingConflict = hasConflict(BUSINESS_HOURS.START, BUSINESS_HOURS.END)

      console.log(`   Día completo: ${BUSINESS_HOURS.START}-${BUSINESS_HOURS.END}`)
      console.log(`     - Conflicto reserva: ${hasBookingConflict}`)

      if (!hasBookingConflict) {
        slots.push({
          time: BUSINESS_HOURS.START,
          available: true,
          type: "fullday",
          endTime: BUSINESS_HOURS.END,
          label: `${BUSINESS_HOURS.START} - ${BUSINESS_HOURS.END}`,
        })
        console.log(`     ✅ Slot de día completo agregado`)
      } else {
        console.log(`     ❌ Slot de día completo rechazado`)
      }
    }
  }

  console.log(`⛵ Total slots generados: ${slots.length}`)
  console.log(
    `📋 Slots:`,
    slots.map((s) => `${s.time}-${s.endTime}`),
  )

  return slots
}

function generateJetskiSlots(
  startTime: string,
  endTime: string,
  existingBookings: ExistingBooking[],
  requestedDuration: string,
  vehicleCategory?: string,
): BookingSlot[] {
  const slots: BookingSlot[] = []

  // Configurar restricciones para motos sin licencia
  const isJetskiNoLicense = vehicleCategory === "jetski_no_license"
  const restrictedStartMinutes = isJetskiNoLicense ? timeToMinutes(BUSINESS_HOURS.NO_LICENSE_RESTRICTED_START) : null
  const restrictedEndMinutes = isJetskiNoLicense ? timeToMinutes(BUSINESS_HOURS.NO_LICENSE_RESTRICTED_END) : null

  console.log(`🏍️ Generando slots para moto:`)
  console.log(`   - Categoría: ${vehicleCategory}`)
  console.log(`   - Sin licencia: ${isJetskiNoLicense}`)
  console.log(`   - Duración: ${requestedDuration}`)

  const hasConflict = (checkStart: string, checkEnd: string): boolean => {
    return existingBookings.some((booking) => {
      return (
        (checkStart >= booking.startTime && checkStart < booking.endTime) ||
        (checkEnd > booking.startTime && checkEnd <= booking.endTime) ||
        (checkStart <= booking.startTime && checkEnd >= booking.endTime)
      )
    })
  }

  // CORRECCIÓN: Motos CON licencia pueden alquilarse medio día y día completo
  if (!isJetskiNoLicense) {
    // Para motos CON licencia
    if (requestedDuration === "halfday") {
      console.log(`📋 Generando slots de medio día para moto CON licencia...`)

      BOAT_HALFDAY_SLOTS.forEach((slot, index) => {
        const hasBookingConflict = hasConflict(slot.start, slot.end)

        console.log(`   Slot ${index + 1}: ${slot.start}-${slot.end}`)
        console.log(`     - Conflicto reserva: ${hasBookingConflict}`)

        if (!hasBookingConflict) {
          slots.push({
            time: slot.start,
            available: true,
            type: "boat-halfday",
            endTime: slot.end,
            label: slot.label,
          })
          console.log(`     ✅ Slot agregado`)
        } else {
          console.log(`     ❌ Slot rechazado`)
        }
      })

      return slots
    } else if (requestedDuration === "fullday") {
      console.log(`📋 Generando slot de día completo para moto CON licencia...`)

      const hasBookingConflict = hasConflict(BUSINESS_HOURS.START, BUSINESS_HOURS.END)

      console.log(`   Día completo: ${BUSINESS_HOURS.START}-${BUSINESS_HOURS.END}`)
      console.log(`     - Conflicto reserva: ${hasBookingConflict}`)

      if (!hasBookingConflict) {
        slots.push({
          time: BUSINESS_HOURS.START,
          available: true,
          type: "fullday",
          endTime: BUSINESS_HOURS.END,
          label: `${BUSINESS_HOURS.START} - ${BUSINESS_HOURS.END}`,
        })
        console.log(`     ✅ Slot de día completo agregado`)
      } else {
        console.log(`     ❌ Slot de día completo rechazado`)
      }

      return slots
    }
  }

  // Para duraciones cortas (30min, 1h, 2h), generar slots cada 30 minutos
  const getDurationMinutes = (duration: string): number => {
    switch (duration) {
      case "30min":
        return 30
      case "1hour":
        return 60
      case "2hour":
        return 120
      default:
        return 60
    }
  }

  const durationMinutes = getDurationMinutes(requestedDuration)

  const [startHour, startMinute] = startTime.split(":").map(Number)
  const [endHour, endMinute] = endTime.split(":").map(Number)

  let currentTime = startHour * 60 + startMinute
  const endTimeMinutes = endHour * 60 + endMinute

  while (currentTime + durationMinutes <= endTimeMinutes) {
    const hours = Math.floor(currentTime / 60)
    const minutes = currentTime % 60
    const timeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`

    // Calcular hora de fin para este slot
    const endSlotMinutes = currentTime + durationMinutes
    const endHours = Math.floor(endSlotMinutes / 60)
    const endMins = endSlotMinutes % 60
    const endTimeString = `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`

    // Verificar si hay conflicto con reservas existentes
    const isOccupied = existingBookings.some((booking) => {
      return (
        (timeString >= booking.startTime && timeString < booking.endTime) ||
        (endTimeString > booking.startTime && endTimeString <= booking.endTime) ||
        (timeString <= booking.startTime && endTimeString >= booking.endTime)
      )
    })

    // Verificar restricciones para motos sin licencia
    let isRestricted = false
    let restrictionReason = ""

    if (isJetskiNoLicense && restrictedStartMinutes && restrictedEndMinutes) {
      // Verificar si el slot se solapa con el horario restringido
      const slotStart = currentTime
      const slotEnd = currentTime + durationMinutes

      if (
        (slotStart >= restrictedStartMinutes && slotStart < restrictedEndMinutes) ||
        (slotEnd > restrictedStartMinutes && slotEnd <= restrictedEndMinutes) ||
        (slotStart <= restrictedStartMinutes && slotEnd >= restrictedEndMinutes)
      ) {
        isRestricted = true
        restrictionReason = "Descanso del personal (14:00 - 16:00)"
      }
    }

    slots.push({
      time: timeString,
      available: !isOccupied && !isRestricted,
      type: "regular",
      restricted: isRestricted,
      restrictionReason: isRestricted ? restrictionReason : undefined,
      endTime: endTimeString,
      label: `${timeString} - ${endTimeString}`,
    })

    currentTime += 30 // Incrementar cada 30 minutos
  }

  console.log(`🏍️ Total slots generados: ${slots.length}`)
  return slots
}

// Función auxiliar para convertir tiempo a minutos
function timeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(":").map(Number)
  return hours * 60 + minutes
}

// Función auxiliar para verificar si un slot está en horario restringido
export function isTimeRestricted(time: string, vehicleCategory: string): boolean {
  const isNoLicense = vehicleCategory === "jetski_no_license" || vehicleCategory === "boat_no_license"
  if (!isNoLicense) return false

  const timeMinutes = timeToMinutes(time)
  const restrictedStart = timeToMinutes(BUSINESS_HOURS.NO_LICENSE_RESTRICTED_START)
  const restrictedEnd = timeToMinutes(BUSINESS_HOURS.NO_LICENSE_RESTRICTED_END)

  return timeMinutes >= restrictedStart && timeMinutes < restrictedEnd
}

// Función para obtener el mensaje de restricción
export function getRestrictionMessage(vehicleCategory: string, language: "es" | "en" = "es"): string | null {
  const isNoLicense = vehicleCategory === "jetski_no_license" || vehicleCategory === "boat_no_license"
  if (!isNoLicense) return null

  const messages = {
    es: "Horario restringido de 14:00 a 16:00 (descanso del personal)",
    en: "Restricted hours from 14:00 to 16:00 (staff break)",
  }

  return messages[language]
}
