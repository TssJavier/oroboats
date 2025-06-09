import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { vehicles, vehicleAvailability, bookings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { sql } from "drizzle-orm"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const id = params.id
    console.log("🔍 GET vehicle with ID:", id)

    const vehicle = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, Number.parseInt(id)))
      .limit(1)

    if (vehicle.length === 0) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
    }

    console.log("✅ Vehicle found:", vehicle[0])
    return NextResponse.json(vehicle[0])
  } catch (error) {
    console.error("❌ Error fetching vehicle:", error)
    return NextResponse.json({ error: "Failed to fetch vehicle" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const id = Number.parseInt(params.id)
    console.log("🔄 PUT vehicle with ID:", id)

    const existingVehicle = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1)

    if (existingVehicle.length === 0) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
    }

    let body
    try {
      body = await request.json()
      console.log("📝 Data received:", body)
    } catch (error) {
      console.error("❌ Error parsing request body:", error)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const {
      name,
      type,
      category,
      requiresLicense,
      capacity,
      pricing,
      availableDurations,
      includes,
      fuelIncluded,
      description,
      image,
      available,
      customDurationEnabled,
      extraFeatures,
      securityDeposit,
      stock, // ✅ AÑADIDO: Campo stock
    } = body

    console.log("🔧 Processing data:", {
      extraFeatures: extraFeatures ? "present" : "missing",
      securityDeposit: securityDeposit || 0,
      stock: stock || 1, // ✅ AÑADIDO: Log del stock
    })

    // ✅ USAR SQL DIRECTO PARA ASEGURAR QUE EL STOCK SE GUARDA
    const result = await db.execute(sql`
      UPDATE vehicles 
      SET 
        name = ${name},
        type = ${type},
        category = ${category},
        requires_license = ${requiresLicense},
        capacity = ${capacity},
        pricing = ${JSON.stringify(pricing)},
        available_durations = ${JSON.stringify(availableDurations)},
        includes = ${JSON.stringify(includes)},
        fuel_included = ${fuelIncluded},
        description = ${description},
        image = ${image},
        available = ${available},
        custom_duration_enabled = ${customDurationEnabled},
        extra_features = ${JSON.stringify(extraFeatures || [])},
        security_deposit = ${Number(securityDeposit) || 0},
        stock = ${Number(stock) || 1},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `)

    // Drizzle returns the result as an array, not as .rows
    const updatedVehicle = Array.isArray(result) ? result[0] : result;
    console.log("✅ Vehicle updated successfully with stock:", updatedVehicle?.stock)
    return NextResponse.json(updatedVehicle)
  } catch (error) {
    console.error("❌ Error updating vehicle:", error)
    return NextResponse.json(
      {
        error: "Failed to update vehicle",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const id = Number.parseInt(params.id)
    console.log("🗑️ DELETE vehicle with ID:", id)

    // Verificar que el vehículo existe
    const existingVehicle = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1)

    if (existingVehicle.length === 0) {
      console.log("❌ Vehicle not found for deletion")
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
    }

    console.log("✅ Vehicle exists, proceeding with cascade deletion...")

    // PASO 1: Borrar referencias en vehicle_availability
    console.log("🔄 Step 1: Deleting vehicle_availability references...")
    const deletedAvailability = await db
      .delete(vehicleAvailability)
      .where(eq(vehicleAvailability.vehicleId, id))
      .returning()

    console.log(`✅ Deleted ${deletedAvailability.length} availability records`)

    // PASO 2: Borrar referencias en bookings
    console.log("🔄 Step 2: Deleting booking references...")
    const deletedBookings = await db.delete(bookings).where(eq(bookings.vehicleId, id)).returning()

    console.log(`✅ Deleted ${deletedBookings.length} booking records`)

    // PASO 3: Borrar el vehículo
    console.log("🔄 Step 3: Deleting vehicle...")
    const deletedVehicle = await db.delete(vehicles).where(eq(vehicles.id, id)).returning()

    console.log("✅ Vehicle deleted successfully:", deletedVehicle[0])

    return NextResponse.json({
      message: "Vehicle deleted successfully",
      id: deletedVehicle[0]?.id,
      deletedReferences: {
        availability: deletedAvailability.length,
        bookings: deletedBookings.length,
      },
    })
  } catch (error) {
    console.error("❌ Error deleting vehicle:", error)
    return NextResponse.json(
      {
        error: "Failed to delete vehicle",
        details: error instanceof Error ? error.message : "Unknown error",
        hint: "Check foreign key constraints and database connection",
      },
      { status: 500 },
    )
  }
}
