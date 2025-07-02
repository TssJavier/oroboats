import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    console.log("🚗 API: Fetching vehicles...")
    const { searchParams } = new URL(request.url)
    const includeUnavailable = searchParams.get("all") === "true"

    console.log("🔍 DB: Fetching vehicles with STOCK field...")
    
    // ✅ ARREGLADO: Usar SQL directo para incluir stock
    const vehicles = await db.execute(sql`
      SELECT 
        id, 
        name, 
        type, 
        category, 
        requires_license as "requiresLicense", 
        capacity, 
        pricing, 
        available_durations as "availableDurations", 
        includes, 
        fuel_included as "fuelIncluded", 
        description, 
        image, 
        available, 
        created_at as "createdAt", 
        updated_at as "updatedAt", 
        custom_duration_enabled as "customDurationEnabled",
        extra_features as "extraFeatures",
        security_deposit as "securityDeposit",
        manualDeposit as "manualdeposit",
        stock  -- ✅ CAMPO STOCK INCLUIDO
      FROM vehicles
      ${!includeUnavailable ? sql`WHERE available = true` : sql``}
      ORDER BY created_at DESC
    `)

    console.log(`✅ DB: Found ${vehicles.length} vehicles`)

    // ✅ ARREGLADO: Procesar datos incluyendo stock
    const processedVehicles = vehicles.map(vehicle => {
      try {
        const processedVehicle = {
          ...vehicle,
          // Ensure name is always present
          name: vehicle.name ?? "Unknown",
          // Parsear campos JSON
          pricing: typeof vehicle.pricing === 'string' ? JSON.parse(vehicle.pricing) : (vehicle.pricing || []),
          availableDurations: typeof vehicle.availableDurations === 'string' ? JSON.parse(vehicle.availableDurations) : (vehicle.availableDurations || []),
          includes: typeof vehicle.includes === 'string' ? JSON.parse(vehicle.includes) : (vehicle.includes || []),
          extraFeatures: typeof vehicle.extraFeatures === 'string' ? JSON.parse(vehicle.extraFeatures) : (vehicle.extraFeatures || []),
          // ✅ CRÍTICO: Asegurar que stock es un número
          stock: vehicle.stock !== undefined && vehicle.stock !== null ? Number(vehicle.stock) : 1
        }
        
        return {
          ...processedVehicle,
          id: vehicle.id // Ensure id is always present
        }
      } catch (error) {
        console.error(`❌ Error processing vehicle ${vehicle.id}:`, error)
        // En caso de error, devolver el vehículo con stock por defecto
        return {
          ...vehicle,
          id: vehicle.id, // Ensure id is always present
          name: vehicle.name ?? "Unknown", // Ensure name is present
          stock: 1,
          pricing: [],
          availableDurations: [],
          includes: [],
          extraFeatures: []
        }
      }
    })

    console.log(`✅ API: Found ${processedVehicles.length} vehicles`)
    
    // ✅ NUEVO: Log para verificar que stock se incluye
    if (processedVehicles.length > 0) {
      console.log("📦 Sample vehicles with stock:")
      processedVehicles.slice(0, 3).forEach(v => {
        console.log(`   - ${v.name} (ID: ${v.id}): Stock = ${v.stock}`)
      })
    }

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
    
    let body
    try {
      body = await request.json()
      console.log("📝 Data received for creation:", body)
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
      manualDeposit,

      stock  // ✅ AÑADIDO: Campo stock
    } = body

    console.log("🔧 Creating vehicle with STOCK:", {
      name,
      stock: stock || 1,
      type,
      category
    })

    // ✅ ARREGLADO: Incluir stock en la creación
    const result = await db.execute(sql`
      INSERT INTO vehicles (
        name, 
        type, 
        category, 
        requires_license, 
        capacity, 
        pricing, 
        available_durations, 
        includes, 
        fuel_included, 
        description, 
        image, 
        available, 
        custom_duration_enabled,
        extra_features,
        security_deposit,
        manualDeposit,
        stock,
        created_at,
        updated_at
      ) 
      VALUES (
        ${name}, 
        ${type}, 
        ${category}, 
        ${requiresLicense}, 
        ${capacity}, 
        ${JSON.stringify(pricing || [])}, 
        ${JSON.stringify(availableDurations || [])}, 
        ${JSON.stringify(includes || [])}, 
        ${fuelIncluded}, 
        ${description}, 
        ${image}, 
        ${available !== undefined ? available : true}, 
        ${customDurationEnabled || false},
        ${JSON.stringify(extraFeatures || [])},
        ${Number(securityDeposit) || 0},
        ${Number(manualDeposit) || 0},
        ${Number(stock) || 1},
        NOW(),
        NOW()
      )
      RETURNING *
    `)

    const newVehicle = Array.isArray(result) ? result[0] : result
    console.log("✅ Vehicle created successfully:", newVehicle?.id)
    console.log("📦 Stock saved as:", newVehicle?.stock)
    
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