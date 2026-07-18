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

    // Convert id to number for comparison if your 'id' column in 'vehicles' is numeric
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
      console.log("📝 Data received for update (full body):", body) // ✅ AÑADIDO: Log completo del body
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
      manualDeposit, // ✅ AÑADIDO: Desestructurar manualDeposit
      stock, // ✅ CAMPO STOCK INCLUIDO
      beachLocationId, // ✅ AÑADIDO: Desestructurar beachLocationId
    } = body

    console.log("🔧 Processing data with deposits:", { securityDeposit, manualDeposit }) // ✅ AÑADIDO: Log de fianzas

    // Basic validation for required fields
    if (!name || !type || !beachLocationId) {
      console.error("❌ Missing required fields for update:", {
        name: !!name,
        type: !!type,
        beachLocationId: !!beachLocationId,
      })
      return NextResponse.json(
        {
          error: "Missing required fields: name, type, and beachLocationId are required for update",
          received: { name: !!name, type: !!type, beachLocationId: !!beachLocationId },
        },
        { status: 400 },
      )
    }

    console.log("🔧 Processing data with STOCK and BEACH:", {
      name,
      stock: stock || 1,
      extraFeatures: extraFeatures ? "present" : "missing",
      securityDeposit: securityDeposit || 0,
      manualDeposit: manualDeposit || 0,
      beachLocationId,
    })

    // ✅ ARREGLADO: Usar SQL directo para asegurar que el stock y beach_location_id se guardan
    // ✅ CORREGIDO: Guardar null si el valor es undefined o null, de lo contrario, el número
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
        security_deposit = ${securityDeposit === undefined || securityDeposit === null ? null : securityDeposit},
        manual_deposit = ${manualDeposit === undefined || manualDeposit === null ? null : manualDeposit}, -- ✅ CORREGIDO: Usar manualDeposit desestructurado
        stock = ${Number(stock) || 1},
        beach_location_id = ${beachLocationId} -- ✅ AÑADIDO: Actualizar beach_location_id
      WHERE id = ${id}
      RETURNING *
    `)

    // ✅ ARREGLADO: Manejo correcto del resultado de Drizzle
    const updatedVehicle = Array.isArray(result) ? result[0] : result
    console.log("✅ Vehicle updated successfully!")
    console.log("📦 Stock saved as:", updatedVehicle?.stock)
    console.log("🏖️ Beach location saved as:", updatedVehicle?.beachLocationId)
    console.log("✅ Security Deposit saved as:", updatedVehicle?.securityDeposit) // ✅ AÑADIDO: Log de fianza guardada
    console.log("✅ Manual Deposit saved as:", updatedVehicle?.manualDeposit) // ✅ AÑADIDO: Log de fianza manual guardada
    console.log("🔍 Full updated vehicle:", updatedVehicle)

    return NextResponse.json(updatedVehicle)
  } catch (error) {
    console.error("❌ Error updating vehicle:", error)
    console.error("❌ Error details:", error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      {
        error: "Failed to update vehicle",
        details: error instanceof Error ? error.message : "Unknown error",
        hint: "Check foreign key constraints and database connection",
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

    const vehicle = existingVehicle[0]
    const force = new URL(request.url).searchParams.get("force") === "true"

    // ⚠️ AVISO: ¿tiene reservas FUTURAS (de hoy en adelante, no canceladas)?
    const futureRows = (await db.execute(sql`
      SELECT COUNT(*)::int AS n, MIN(booking_date)::text AS proxima
      FROM bookings
      WHERE vehicle_id = ${id}
        AND booking_date >= CURRENT_DATE
        AND (status IS NULL OR status <> 'cancelled')
    `)) as any[]
    const futureCount = Number(futureRows?.[0]?.n || 0)
    const nextDate = futureRows?.[0]?.proxima || null

    if (futureCount > 0 && !force) {
      console.log(`⚠️ Vehicle ${id} has ${futureCount} future booking(s). Confirmation required.`)
      return NextResponse.json(
        {
          requiresConfirmation: true,
          futureBookings: futureCount,
          nextBookingDate: nextDate,
          message:
            `¿Estás seguro? Vas a borrar "${vehicle.name}", que tiene ${futureCount} reserva(s) próximas` +
            (nextDate ? ` (la primera el ${nextDate})` : "") +
            `. Las reservas NO se borrarán, pero el producto dejará de estar disponible.`,
        },
        { status: 409 },
      )
    }

    console.log("✅ Vehicle exists, proceeding with SAFE deletion (bookings are preserved)...")

    // PASO 1: Borrar la disponibilidad (es solo configuración, no histórico)
    const deletedAvailability = await db
      .delete(vehicleAvailability)
      .where(eq(vehicleAvailability.vehicleId, id))
      .returning()
    console.log(`✅ Deleted ${deletedAvailability.length} availability records`)

    // PASO 2: ✅ NUNCA se borran las reservas. Se conserva el histórico:
    //   - se guarda el nombre/tipo del vehículo en la propia reserva (por si faltaba)
    //   - se desvincula el vehículo (vehicle_id = NULL) para poder borrarlo sin perder datos
    const preserved = (await db.execute(sql`
      UPDATE bookings
      SET vehicle_name = COALESCE(vehicle_name, ${vehicle.name}),
          vehicle_type = COALESCE(vehicle_type, ${vehicle.type}),
          vehicle_id   = NULL,
          updated_at   = now()
      WHERE vehicle_id = ${id}
      RETURNING id
    `)) as any[]
    console.log(`🛟 Preserved ${preserved.length} booking(s) (unlinked, NOT deleted)`)

    // PASO 3: Borrar el vehículo
    const deletedVehicle = await db.delete(vehicles).where(eq(vehicles.id, id)).returning()
    console.log("✅ Vehicle deleted successfully:", deletedVehicle[0])

    return NextResponse.json({
      message: "Vehicle deleted successfully",
      id: deletedVehicle[0]?.id,
      preservedBookings: preserved.length,
      deletedReferences: {
        availability: deletedAvailability.length,
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
