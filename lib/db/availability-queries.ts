import { db } from "./index"
import { vehicles, bookings, vehicleAvailability, blockedDates } from "./schema"
import { eq, and, gte, lte, or, ne, isNull } from "drizzle-orm"
import type { NewVehicleAvailability } from "./schema"

// ===== AVAILABILITY QUERIES =====

// Obtener horarios de un vehículo por día de la semana
export async function getVehicleSchedule(vehicleId: number) {
  try {
    const schedule = await db
      .select()
      .from(vehicleAvailability)
      .where(eq(vehicleAvailability.vehicleId, vehicleId))
      .orderBy(vehicleAvailability.dayOfWeek)

    // Si no hay horarios configurados, usar horarios por defecto
    if (schedule.length === 0) {
      return getDefaultSchedule()
    }

    return schedule
  } catch (error) {
    console.error("Error fetching vehicle schedule:", error)
    throw error
  }
}

// Horarios por defecto (9:00 - 21:00 todos los días)
export function getDefaultSchedule() {
  return Array.from({ length: 7 }, (_, i) => ({
    id: 0,
    vehicleId: 0,
    dayOfWeek: i,
    startTime: "09:00",
    endTime: "21:00",
    isAvailable: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }))
}

// Verificar si una fecha está bloqueada
export async function isDateBlocked(date: string, vehicleId?: number) {
  try {
    const blocked = await db
      .select()
      .from(blockedDates)
      .where(
        and(
          eq(blockedDates.date, date),
          vehicleId ? or(eq(blockedDates.vehicleId, vehicleId), isNull(blockedDates.vehicleId)) : undefined,
        ),
      )

    return blocked.length > 0
  } catch (error) {
    console.error("Error checking blocked date:", error)
    throw error
  }
}

// Obtener reservas existentes para una fecha y vehículo
export async function getBookingsForDate(vehicleId: number, date: string) {
  try {
    return await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.vehicleId, vehicleId),
          eq(bookings.bookingDate, date),
          or(eq(bookings.status, "confirmed"), eq(bookings.status, "pending")),
        ),
      )
      .orderBy(bookings.startTime)
  } catch (error) {
    console.error("Error fetching bookings for date:", error)
    throw error
  }
}

// Verificar conflicto de horarios
export async function checkTimeConflict(
  vehicleId: number,
  date: string,
  startTime: string,
  endTime: string,
  excludeBookingId?: number,
) {
  try {
    const whereConditions = [
      eq(bookings.vehicleId, vehicleId),
      eq(bookings.bookingDate, date),
      or(eq(bookings.status, "confirmed"), eq(bookings.status, "pending")),
      or(
        // El nuevo horario empieza durante una reserva existente
        and(gte(bookings.startTime, startTime), lte(bookings.startTime, endTime)),
        // El nuevo horario termina durante una reserva existente
        and(gte(bookings.endTime, startTime), lte(bookings.endTime, endTime)),
        // El nuevo horario engloba una reserva existente
        and(lte(bookings.startTime, startTime), gte(bookings.endTime, endTime)),
      ),
    ]

    // Agregar exclusión de booking si se proporciona
    if (excludeBookingId) {
      whereConditions.push(ne(bookings.id, excludeBookingId))
    }

    const conflicts = await db
      .select()
      .from(bookings)
      .where(and(...whereConditions))

    return conflicts.length > 0
  } catch (error) {
    console.error("Error checking time conflict:", error)
    throw error
  }
}

// Obtener slots de tiempo disponibles para una fecha
export async function getAvailableTimeSlots(vehicleId: number, date: string) {
  try {
    // 1. Verificar si la fecha está bloqueada
    const isBlocked = await isDateBlocked(date, vehicleId)
    if (isBlocked) {
      return []
    }

    // 2. Obtener horarios del vehículo para el día de la semana
    const dayOfWeek = new Date(date).getDay()
    const schedule = await getVehicleSchedule(vehicleId)
    const daySchedule = schedule.find((s) => s.dayOfWeek === dayOfWeek)

    if (!daySchedule || !daySchedule.isAvailable) {
      return []
    }

    // 3. Obtener reservas existentes
    const existingBookings = await getBookingsForDate(vehicleId, date)

    // 4. Generar slots de 30 minutos
    const slots = []
    const startHour = Number.parseInt(daySchedule.startTime.split(":")[0])
    const startMinute = Number.parseInt(daySchedule.startTime.split(":")[1])
    const endHour = Number.parseInt(daySchedule.endTime.split(":")[0])
    const endMinute = Number.parseInt(daySchedule.endTime.split(":")[1])

    let currentTime = startHour * 60 + startMinute // minutos desde medianoche

    const endTimeMinutes = endHour * 60 + endMinute

    while (currentTime < endTimeMinutes) {
      const hours = Math.floor(currentTime / 60)
      const minutes = currentTime % 60
      const timeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`

      // Verificar si este slot está ocupado
      const isOccupied = existingBookings.some((booking) => {
        const bookingStart = booking.startTime
        const bookingEnd = booking.endTime
        return timeString >= bookingStart && timeString < bookingEnd
      })

      slots.push({
        time: timeString,
        available: !isOccupied,
      })

      currentTime += 30 // Incrementar 30 minutos
    }

    return slots
  } catch (error) {
    console.error("Error getting available time slots:", error)
    throw error
  }
}

// ===== MANAGEMENT FUNCTIONS =====

// Configurar horarios de un vehículo
export async function setVehicleSchedule(vehicleId: number, schedule: NewVehicleAvailability[]) {
  try {
    // Eliminar horarios existentes
    await db.delete(vehicleAvailability).where(eq(vehicleAvailability.vehicleId, vehicleId))

    // Insertar nuevos horarios
    if (schedule.length > 0) {
      await db.insert(vehicleAvailability).values(schedule)
    }

    return true
  } catch (error) {
    console.error("Error setting vehicle schedule:", error)
    throw error
  }
}

// Bloquear una fecha
export async function blockDate(date: string, reason: string, description?: string, vehicleId?: number) {
  try {
    await db.insert(blockedDates).values({
      date,
      reason,
      description,
      vehicleId: vehicleId || null,
    })
    return true
  } catch (error) {
    console.error("Error blocking date:", error)
    throw error
  }
}

// Desbloquear una fecha
export async function unblockDate(id: number) {
  try {
    await db.delete(blockedDates).where(eq(blockedDates.id, id))
    return true
  } catch (error) {
    console.error("Error unblocking date:", error)
    throw error
  }
}

// Obtener todas las fechas bloqueadas
export async function getBlockedDates() {
  try {
    return await db
      .select({
        blockedDate: blockedDates,
        vehicle: vehicles,
      })
      .from(blockedDates)
      .leftJoin(vehicles, eq(blockedDates.vehicleId, vehicles.id))
      .orderBy(blockedDates.date)
  } catch (error) {
    console.error("Error fetching blocked dates:", error)
    throw error
  }
}

// Añadir esta función para cancelar una reserva y liberar los slots
export async function cancelBooking(bookingId: number) {
  try {
    // 1. Obtener la información de la reserva
    const booking = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1)

    if (booking.length === 0) {
      throw new Error("Booking not found")
    }

    // 2. Actualizar el estado de la reserva a "cancelled"
    await db
      .update(bookings)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId))

    return true
  } catch (error) {
    console.error("Error cancelling booking:", error)
    throw error
  }
}
