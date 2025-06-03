// Configuración de horarios de negocio
export const BUSINESS_HOURS = {
  START: "09:00",
  END: "21:00",
  MORNING_HALF_START: "09:00",
  MORNING_HALF_END: "15:00",
  AFTERNOON_HALF_START: "15:00",
  AFTERNOON_HALF_END: "21:00",
}

export interface BookingSlot {
  time: string
  available: boolean
  type?: "regular" | "morning-half" | "afternoon-half" | "fullday"
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
): BookingSlot[] {
  // Usar horarios de negocio fijos
  const startTime = BUSINESS_HOURS.START
  const endTime = BUSINESS_HOURS.END

  console.log(`🚤 Generando slots para ${vehicleType} de ${startTime} a ${endTime}`)

  if (vehicleType === "boat") {
    return generateBoatSlots(startTime, endTime, existingBookings, requestedDuration)
  } else {
    return generateRegularSlots(startTime, endTime, existingBookings)
  }
}

function generateBoatSlots(
  startTime: string,
  endTime: string,
  existingBookings: ExistingBooking[],
  requestedDuration: string,
): BookingSlot[] {
  const slots: BookingSlot[] = []

  // Verificar si hay conflictos con reservas existentes
  const hasConflict = (checkStart: string, checkEnd: string): boolean => {
    return existingBookings.some((booking) => {
      return (
        (checkStart >= booking.startTime && checkStart < booking.endTime) ||
        (checkEnd > booking.startTime && checkEnd <= booking.endTime) ||
        (checkStart <= booking.startTime && checkEnd >= booking.endTime)
      )
    })
  }

  if (requestedDuration === "halfday") {
    // Solo mostrar slots de medio día
    const morningAvailable = !hasConflict(BUSINESS_HOURS.MORNING_HALF_START, BUSINESS_HOURS.MORNING_HALF_END)
    const afternoonAvailable = !hasConflict(BUSINESS_HOURS.AFTERNOON_HALF_START, BUSINESS_HOURS.AFTERNOON_HALF_END)

    if (morningAvailable) {
      slots.push({
        time: BUSINESS_HOURS.MORNING_HALF_START,
        available: true,
        type: "morning-half",
      })
    }

    if (afternoonAvailable) {
      slots.push({
        time: BUSINESS_HOURS.AFTERNOON_HALF_START,
        available: true,
        type: "afternoon-half",
      })
    }
  } else if (requestedDuration === "fullday") {
    // Solo mostrar slot de día completo
    const fulldayAvailable = !hasConflict(BUSINESS_HOURS.START, BUSINESS_HOURS.END)

    if (fulldayAvailable) {
      slots.push({
        time: BUSINESS_HOURS.START,
        available: true,
        type: "fullday",
      })
    }
  } else {
    // Mostrar slots regulares de 30 minutos
    return generateRegularSlots(startTime, endTime, existingBookings)
  }

  console.log(`⛵ Slots de barco generados: ${slots.length}`)
  return slots
}

function generateRegularSlots(startTime: string, endTime: string, existingBookings: ExistingBooking[]): BookingSlot[] {
  const slots: BookingSlot[] = []
  const [startHour, startMinute] = startTime.split(":").map(Number)
  const [endHour, endMinute] = endTime.split(":").map(Number)

  let currentTime = startHour * 60 + startMinute
  const endTimeMinutes = endHour * 60 + endMinute

  while (currentTime < endTimeMinutes) {
    const hours = Math.floor(currentTime / 60)
    const minutes = currentTime % 60
    const timeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`

    // Verificar si este slot está ocupado
    const isOccupied = existingBookings.some((booking) => {
      return timeString >= booking.startTime && timeString < booking.endTime
    })

    slots.push({
      time: timeString,
      available: !isOccupied,
      type: "regular",
    })

    currentTime += 30
  }

  console.log(`🏍️ Slots regulares generados: ${slots.length}`)
  return slots
}
