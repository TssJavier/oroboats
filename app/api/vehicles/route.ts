import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { vehicles } from "@/lib/db/schema"
import { eq, and, sql } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    console.log("🚗 API: Fetching vehicles...")
    const { searchParams } = new URL(request.url)
    const includeUnavailable = searchParams.get("all") === "true"
    const beachLocationId = searchParams.get("beachLocationId")

    console.log("🔍 Filters applied:", { includeUnavailable, beachLocationId })

    // ✅ Build conditions array properly
    const conditions = []

    // Add availability condition if not including all
    if (!includeUnavailable) {
      conditions.push(eq(vehicles.available, true))
    }

    // Add beach location condition if specified
    if (beachLocationId) {
      console.log("🏖️ Filtering by beach:", beachLocationId)
      conditions.push(eq(vehicles.beachLocationId, beachLocationId))
    }

    // ✅ Use Drizzle ORM with proper condition combining
    let query = db.select().from(vehicles)

    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions))
    }

    const vehicleResults = await query.orderBy(vehicles.createdAt)

    console.log(`✅ DB: Found ${vehicleResults.length} vehicles`)

    // ✅ Para el panel de admin: qué vehículos tienen reservas futuras activas.
    //    Se usa para bloquear/ocultar el borrado (borrar desvincularía esas reservas y
    //    las dejaría invisibles para las comprobaciones de disponibilidad).
    let futureBookingVehicleIds = new Set<number>()
    if (includeUnavailable) {
      const futureRows = (await db.execute(sql`
        SELECT DISTINCT vehicle_id
        FROM bookings
        WHERE vehicle_id IS NOT NULL
          AND booking_date >= CURRENT_DATE
          AND (status IS NULL OR status <> 'cancelled')
      `)) as any[]
      futureBookingVehicleIds = new Set(futureRows.map((r) => Number(r.vehicle_id)))
    }

    // Process the results
    const processedVehicles = vehicleResults.map((vehicle) => {
      try {
        return {
          ...vehicle,
          name: vehicle.name ?? "Unknown",
          pricing: typeof vehicle.pricing === "string" ? JSON.parse(vehicle.pricing) : vehicle.pricing || [],
          availableDurations:
            typeof vehicle.availableDurations === "string"
              ? JSON.parse(vehicle.availableDurations)
              : vehicle.availableDurations || [],
          includes: typeof vehicle.includes === "string" ? JSON.parse(vehicle.includes) : vehicle.includes || [],
          extraFeatures:
            typeof vehicle.extraFeatures === "string" ? JSON.parse(vehicle.extraFeatures) : vehicle.extraFeatures || [],
          stock: vehicle.stock !== undefined && vehicle.stock !== null ? Number(vehicle.stock) : 1,
          // ✅ CORREGIDO: Asegurar que securityDeposit y manualDeposit se parsean correctamente
          securityDeposit: vehicle.securityDeposit !== null ? Number(vehicle.securityDeposit) : null,
          manualDeposit: vehicle.manualDeposit !== null ? Number(vehicle.manualDeposit) : null,
          hasFutureBookings: futureBookingVehicleIds.has(vehicle.id),
        }
      } catch (error) {
        console.error(`❌ Error processing vehicle ${vehicle.id}:`, error)
        return {
          ...vehicle,
          name: vehicle.name ?? "Unknown",
          stock: 1,
          pricing: [],
          availableDurations: [],
          includes: [],
          extraFeatures: [],
          securityDeposit: null, // Default to null on error
          manualDeposit: null, // Default to null on error
          hasFutureBookings: futureBookingVehicleIds.has(vehicle.id),
        }
      }
    })

    console.log(`✅ API: Returning ${processedVehicles.length} vehicles`)

    return NextResponse.json(processedVehicles)
  } catch (error) {
    console.error("❌ API Error fetching vehicles:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch vehicles",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🚗 API: Creating vehicle...")

    const body = await request.json()
    console.log("📝 Data received for creation (full body):", body) // ✅ AÑADIDO: Log completo del body

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
      manualDeposit,
      stock,
      beachLocationId,
    } = body

    console.log("📝 Data received for creation (deposits):", { securityDeposit, manualDeposit }) // ✅ AÑADIDO: Log de fianzas

    // ✅ VALIDATION: Ensure required fields are present
    if (!name || !type || !beachLocationId) {
      console.error("❌ Missing required fields:", {
        name: !!name,
        type: !!type,
        beachLocationId: !!beachLocationId,
      })
      return NextResponse.json(
        {
          error: "Missing required fields: name, type, and beachLocationId are required",
          received: { name: !!name, type: !!type, beachLocationId: !!beachLocationId },
        },
        { status: 400 },
      )
    }

    console.log("🔧 Creating vehicle with beach location:", beachLocationId)

    // ✅ Use Drizzle ORM insert
    const result = await db
      .insert(vehicles)
      .values({
        name,
        type,
        category,
        requiresLicense: requiresLicense || false,
        capacity: capacity || 2,
        pricing: JSON.stringify(pricing || []),
        availableDurations: JSON.stringify(availableDurations || []),
        includes: JSON.stringify(includes || []),
        fuelIncluded: fuelIncluded !== undefined ? fuelIncluded : true,
        description: description || "",
        image: image || "",
        available: available !== undefined ? available : true,
        customDurationEnabled: customDurationEnabled || false,
        extraFeatures: JSON.stringify(extraFeatures || []),
        // ✅ CORREGIDO: Guardar null si el valor es undefined o null, de lo contrario, el número
        securityDeposit: securityDeposit === undefined || securityDeposit === null ? null : Number(securityDeposit),
        manualDeposit: manualDeposit === undefined || manualDeposit === null ? null : Number(manualDeposit),
        stock: Number(stock) || 1,
        beachLocationId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    const newVehicle = result[0]
    console.log("✅ Vehicle created successfully with beach:", newVehicle?.beachLocationId)
    console.log("✅ Security Deposit saved as:", newVehicle?.securityDeposit) // ✅ AÑADIDO: Log de fianza guardada
    console.log("✅ Manual Deposit saved as:", newVehicle?.manualDeposit) // ✅ AÑADIDO: Log de fianza manual guardada

    return NextResponse.json(newVehicle, { status: 201 })
  } catch (error) {
    console.error("❌ API Error creating vehicle:", error)
    return NextResponse.json(
      {
        error: "Failed to create vehicle",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
