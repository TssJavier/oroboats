import { db } from "./index"
import { vehicles, bookings, settings } from "./schema"
import { eq, and, gte, lte, sql } from "drizzle-orm"
import type { NewVehicle } from "./schema"

// ===== VEHICLES =====
export async function getVehicles() {
  try {
    console.log("🔍 DB: Fetching available vehicles...")
    const result = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.available, true))
      .orderBy(vehicles.type, vehicles.name)
    console.log(`✅ DB: Found ${result.length} available vehicles`)
    return result
  } catch (error) {
    console.error("❌ DB Error fetching vehicles:", error)
    throw error
  }
}

export async function getAllVehicles() {
  try {
    console.log("🔍 DB: Fetching all vehicles...")
    const result = await db.select().from(vehicles).orderBy(vehicles.type, vehicles.name)
    console.log(`✅ DB: Found ${result.length} total vehicles`)
    return result
  } catch (error) {
    console.error("❌ DB Error fetching all vehicles:", error)
    throw error
  }
}

// Función para obtener vehículos por categoría
export async function getVehiclesByCategory(category: string) {
  try {
    console.log(`🔍 DB: Fetching vehicles for category ${category}...`)
    const result = await db
      .select()
      .from(vehicles)
      .where(and(eq(vehicles.category, category), eq(vehicles.available, true)))
      .orderBy(vehicles.name)
    console.log(`✅ DB: Found ${result.length} vehicles for category ${category}`)
    return result
  } catch (error) {
    console.error(`❌ DB Error fetching vehicles for category ${category}:`, error)
    throw error
  }
}

// Función para verificar restricciones horarias
export async function getTimeRestrictions(vehicleCategory: string, date: string) {
  try {
    // Solo motos sin licencia tienen restricciones
    if (vehicleCategory === "jetski_no_license") {
      return {
        blockedHours: { start: "14:00", end: "16:00" },
        reason: "Staff lunch break",
      }
    }
    return null
  } catch (error) {
    console.error("Error getting time restrictions:", error)
    return null
  }
}

export async function getVehicleById(id: number) {
  try {
    console.log(`🔍 DB: Fetching vehicle ${id}...`)
    const result = await db.select().from(vehicles).where(eq(vehicles.id, id))
    console.log(`✅ DB: Vehicle ${id} ${result.length > 0 ? "found" : "not found"}`)
    return result[0]
  } catch (error) {
    console.error(`❌ DB Error fetching vehicle ${id}:`, error)
    throw error
  }
}

export async function createVehicle(vehicle: NewVehicle) {
  try {
    console.log("🔍 DB: Creating vehicle...")
    const result = await db.insert(vehicles).values(vehicle).returning()
    console.log(`✅ DB: Vehicle created with ID ${result[0].id}`)
    return result
  } catch (error) {
    console.error("❌ DB Error creating vehicle:", error)
    throw error
  }
}

export async function updateVehicle(id: number, vehicle: Partial<NewVehicle>) {
  try {
    console.log(`🔍 DB: Updating vehicle ${id}...`)
    const result = await db
      .update(vehicles)
      .set({ ...vehicle, updatedAt: new Date() })
      .where(eq(vehicles.id, id))
      .returning()
    console.log(`✅ DB: Vehicle ${id} updated`)
    return result
  } catch (error) {
    console.error(`❌ DB Error updating vehicle ${id}:`, error)
    throw error
  }
}

export async function deleteVehicle(id: number) {
  try {
    console.log(`🔍 DB: Deleting vehicle ${id}...`)
    const result = await db.delete(vehicles).where(eq(vehicles.id, id)).returning()
    console.log(`✅ DB: Vehicle ${id} deleted`)
    return result
  } catch (error) {
    console.error(`❌ DB Error deleting vehicle ${id}:`, error)
    throw error
  }
}

// ===== BOOKINGS =====
export async function getBookings() {
  try {
    console.log("🔍 DB: Fetching bookings...")
    // ✅ MODIFICADO: Usar SQL directo para asegurar que obtenemos todos los campos
    const result = await db.execute(sql`
      SELECT
        b.*,
        v.name as vehicle_name,
        v.type as vehicle_type
      FROM bookings b
      LEFT JOIN vehicles v ON b.vehicle_id = v.id
      ORDER BY b.created_at DESC
    `)
    // Transformar el resultado al formato esperado por el frontend
    const transformedResult = (result as any[]).map((row: any) => ({
      booking: {
        id: row.id,
        vehicleId: row.vehicle_id,
        customerName: row.customer_name,
        customerEmail: row.customer_email,
        customerPhone: row.customer_phone,
        bookingDate: row.booking_date,
        timeSlot: row.time_slot,
        startTime: row.start_time,
        endTime: row.end_time,
        duration: row.duration,
        totalPrice: row.total_price,
        status: row.status,
        paymentStatus: row.payment_status,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        securityDeposit: row.security_deposit || "0",
        inspectionStatus: row.inspection_status || "pending",
        damageDescription: row.damage_description,
        damageCost: row.damage_cost || "0",
        liabilityWaiverId: row.liability_waiver_id, // ✅ AÑADIDO: Campo crucial
        isTestBooking: row.is_test_booking === true, // ✅ AÑADIDO: Campo crucial
        // ✅ AÑADIDO: Campos de pago parcial
        paymentType: row.payment_type || "full_payment",
        amountPaid: row.amount_paid || row.total_price,
        amountPending: row.amount_pending || "0",
        paymentLocation: row.payment_location || "online",
        hotelCode: row.hotel_code, // ✅ AÑADIDO: Incluir hotelCode
        beachLocationId: row.beach_location_id,
        beachLocationName: row.beach_location_name,
      },
      vehicle: row.vehicle_name
        ? {
            name: row.vehicle_name,
            type: row.vehicle_type,
          }
        : null,
    }))
    console.log(`✅ DB: Found ${transformedResult.length} bookings`)
    // Debug para ver si hay documentos firmados
    const withWaivers = transformedResult.filter((b) => b.booking.liabilityWaiverId).length
    console.log(`✅ DB: ${withWaivers} bookings have signed liability waivers`)
    return transformedResult
  } catch (error) {
    console.error("❌ DB Error fetching bookings:", error)
    throw error
  }
}

export async function getBookingsByDate(date: Date) {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)
  return await db
    .select()
    .from(bookings)
    .where(and(gte(bookings.bookingDate, startOfDay.toISOString()), lte(bookings.bookingDate, endOfDay.toISOString())))
}

// ✅ FUNCIÓN CREATEBOOKING CON DRIZZLE SQL TEMPLATE
export async function createBooking(bookingData: any) {
  try {
    console.log("🔍 DB: Creating booking with data:", JSON.stringify(bookingData, null, 2))
    // ✅ VERIFICAR QUE timeSlot EXISTE
    if (!bookingData.timeSlot) {
      console.log("⚠️ timeSlot missing, generating from start/end times...")
      bookingData.timeSlot = `${bookingData.startTime}-${bookingData.endTime}`
    }
    console.log("🔍 DB: timeSlot value:", bookingData.timeSlot)
    // ✅ VERIFICAR CAMPOS DE PAGO PARCIAL - NORMALIZAR NOMBRES
    const paymentType = bookingData.payment_type || bookingData.paymentType || "full_payment"
    const amountPaid = bookingData.amount_paid || bookingData.amountPaid || bookingData.totalPrice
    const amountPending = bookingData.amount_pending || bookingData.amountPending || "0"
    const paymentLocation = bookingData.payment_location || bookingData.paymentLocation || "online"
    console.log("💰 Payment details for DB:", {
      paymentType,
      amountPaid,
      amountPending,
      paymentLocation,
    })
    // ✅ USAR DIRECT SQL PARA MÁXIMO CONTROL
    const result = await db.execute(sql`
      INSERT INTO bookings (
        vehicle_id, customer_name, customer_email, customer_phone,
        booking_date, time_slot, start_time, end_time, duration,
        total_price, status, payment_status, notes,
        discount_code, discount_amount, original_price, security_deposit,
        created_at, updated_at,
        payment_type, amount_paid, amount_pending, payment_location,
        liability_waiver_id, is_test_booking, hotel_code, beach_location_id, beach_location_name
      ) VALUES (
        ${Number(bookingData.vehicleId)},
        ${bookingData.customerName},
        ${bookingData.customerEmail},
        ${bookingData.customerPhone},
        ${bookingData.bookingDate},
        ${bookingData.timeSlot},
        ${bookingData.startTime},
        ${bookingData.endTime},
        ${bookingData.duration},
        ${String(bookingData.totalPrice)},
        ${bookingData.status || "pending"},
        ${bookingData.paymentStatus || "pending"},
        ${bookingData.notes || null},
        ${bookingData.discountCode || null},
        ${String(bookingData.discountAmount || 0)},
        ${String(bookingData.originalPrice || bookingData.totalPrice)},
        ${String(bookingData.securityDeposit || 0)},
        NOW(),
        NOW(),
        ${paymentType},
        ${String(amountPaid)},
        ${String(amountPending)},
        ${paymentLocation},
        ${bookingData.liability_waiver_id || bookingData.liabilityWaiverId || null},
        ${bookingData.isTestBooking || false},
        ${bookingData.hotelCode || null},
        ${bookingData.beachLocationId || null},
        ${bookingData.beachLocationName || null}
      ) RETURNING *;
    `)
    console.log("✅ DB: Booking created successfully")
    // ✅ VERIFICAR QUE SE GUARDÓ CORRECTAMENTE
    if (result && result.length > 0) {
      console.log("✅ DB: Payment type saved as:", result[0].payment_type)
      console.log("✅ DB: Amount paid saved as:", result[0].amount_paid)
      console.log("✅ DB: Amount pending saved as:", result[0].amount_pending)
      console.log("✅ DB: Hotel Code saved as:", result[0].hotel_code) // ✅ NUEVO: Log para hotel_code
      console.log("✅ DB: Beach Location Name saved as:", result[0].beach_location_name) // ✅ NUEVO: Log para beach_location_name
    }
    return result // ✅ CORREGIDO: Devolver las filas del resultado
  } catch (error) {
    console.error("❌ DB Error creating booking:", error)
    console.error("❌ Original data:", bookingData)
    throw error
  }
}

export async function updateBookingStatus(id: number, status: string) {
  return await db.update(bookings).set({ status, updatedAt: new Date() }).where(eq(bookings.id, id))
}

// ===== SETTINGS =====
export async function getSetting(key: string) {
  const result = await db.select().from(settings).where(eq(settings.key, key))
  return result[0]
}

export async function updateSetting(key: string, value: unknown, description?: string) {
  return await db
    .insert(settings)
    .values({ key, value: value === undefined ? "" : String(value), description })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: value === undefined ? "" : String(value), updatedAt: new Date() },
    })
}

export async function getAllSettings() {
  return await db.select().from(settings).orderBy(settings.key)
}

// ===== ADMIN STATS =====
export async function getAdminStats() {
  try {
    const totalBookings = await db.select().from(bookings)
    const totalRevenue = totalBookings.reduce((sum, booking) => {
      const price = Number.parseFloat(booking.totalPrice) || 0
      return sum + price
    }, 0)
    const pendingBookings = totalBookings.filter((b) => b.status === "pending").length
    const todayBookings = await getBookingsByDate(new Date())
    return {
      totalBookings: totalBookings.length || 0,
      totalRevenue: totalRevenue || 0,
      pendingBookings: pendingBookings || 0,
      todayBookings: todayBookings.length || 0,
      recentBookings: totalBookings.slice(0, 5) || [],
    }
  } catch (error) {
    console.error("Error in getAdminStats:", error)
    return {
      totalBookings: 0,
      totalRevenue: 0,
      pendingBookings: 0,
      todayBookings: 0,
      recentBookings: [],
    }
  }
}

// ===== CLEANUP FUNCTIONS =====
export async function removeDuplicateVehicles() {
  try {
    console.log("🧹 DB: Removing duplicate vehicles...")
    const allVehicles = await db.select().from(vehicles).orderBy(vehicles.id)
    const vehicleGroups = allVehicles.reduce(
      (groups, vehicle) => {
        const key = vehicle.name.toLowerCase().trim()
        if (!groups[key]) {
          groups[key] = []
        }
        groups[key].push(vehicle)
        return groups
      },
      {} as Record<string, typeof allVehicles>,
    )
    let deletedCount = 0
    for (const [name, vehiclesList] of Object.entries(vehicleGroups)) {
      if (vehiclesList.length > 1) {
        console.log(`🔍 Found ${vehiclesList.length} duplicates for "${name}"`)
        for (let i = 1; i < vehiclesList.length; i++) {
          await db.delete(vehicles).where(eq(vehicles.id, vehiclesList[i].id))
          deletedCount++
          console.log(`🗑️ Deleted duplicate vehicle ID ${vehiclesList[i].id}`)
        }
      }
    }
    console.log(`✅ DB: Removed ${deletedCount} duplicate vehicles`)
    return deletedCount
  } catch (error) {
    console.error("❌ DB Error removing duplicates:", error)
    throw error
  }
}
