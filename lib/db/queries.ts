import { db } from "./index"
import { vehicles, bookings, settings } from "./schema"
import { eq, desc, and, gte, lte } from "drizzle-orm"
import type { NewVehicle, NewBooking } from "./schema"

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
    const result = await db
      .select({
        booking: bookings,
        vehicle: vehicles,
      })
      .from(bookings)
      .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .orderBy(desc(bookings.createdAt))
    console.log(`✅ DB: Found ${result.length} bookings`)
    return result
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
    .where(and(gte(bookings.bookingDate, startOfDay), lte(bookings.bookingDate, endOfDay)))
}

export async function createBooking(booking: NewBooking) {
  return await db.insert(bookings).values(booking).returning()
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
    .values({ key, value, description })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value, updatedAt: new Date() },
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
