import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

export async function POST() {
  try {
    console.log("🔄 Starting pricing data migration...")

    // Verificar y migrar datos con parsing de JSON strings
    console.log("📝 Checking existing vehicles...")
    const vehiclesResult = await db.execute(sql`
      SELECT id, name, pricing 
      FROM vehicles 
      WHERE pricing IS NOT NULL;
    `)

    console.log(`🚗 Found ${vehiclesResult.length} vehicles with pricing data`)

    let migratedCount = 0
    let errorCount = 0

    for (const vehicle of vehiclesResult) {
      try {
        const vehicleId = vehicle.id
        let pricingData = vehicle.pricing

        console.log(`🔄 Processing vehicle ${vehicleId} (${vehicle.name}):`)
        console.log("Raw pricing data:", JSON.stringify(pricingData))

        // Si es un string, parsearlo como JSON
        if (typeof pricingData === "string") {
          try {
            pricingData = JSON.parse(pricingData)
            console.log("✅ Parsed JSON string successfully")
          } catch (parseError) {
            console.error("❌ Failed to parse JSON string:", parseError)
            errorCount++
            continue
          }
        }

        // Verificar si pricing es un array
        if (Array.isArray(pricingData)) {
          console.log(`📋 Found ${pricingData.length} pricing rules for vehicle ${vehicleId}`)

          for (const pricing of pricingData) {
            if (pricing.duration && pricing.price && pricing.label) {
              await db.execute(sql`
                INSERT INTO pricing_rules (vehicle_id, duration, price, label)
                VALUES (${vehicleId}, ${pricing.duration}, ${pricing.price}, ${pricing.label})
                ON CONFLICT DO NOTHING;
              `)
              migratedCount++
              console.log(`✅ Migrated: ${pricing.duration} - ${pricing.label} - €${pricing.price}`)
            } else {
              console.log(`⚠️ Skipping invalid pricing rule:`, pricing)
            }
          }
        } else {
          console.log(`⚠️ Vehicle ${vehicleId} has non-array pricing data:`, typeof pricingData)
          errorCount++
        }
      } catch (vehicleError) {
        console.error(`❌ Error processing vehicle ${vehicle.id}:`, vehicleError)
        errorCount++
      }
    }

    console.log(`✅ Migration completed!`)
    console.log(`📊 Results: ${migratedCount} rules migrated, ${errorCount} errors`)

    return NextResponse.json({
      success: true,
      message: "Pricing data migration completed",
      migratedRules: migratedCount,
      vehiclesProcessed: vehiclesResult.length,
      errors: errorCount,
    })
  } catch (error) {
    console.error("❌ Error in migration:", error)
    return NextResponse.json(
      {
        error: "Failed to migrate pricing data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
