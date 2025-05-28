import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

export async function GET() {
  try {
    console.log("🔍 Checking database connection...")

    // Verificar conexión básica
    const result = await db.execute(sql`SELECT 1 as test`)
    console.log("✅ Database connection OK:", result)

    // Verificar si existe la tabla vehicles
    const vehiclesCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'vehicles'
      );
    `)
    console.log("📋 Vehicles table exists:", vehiclesCheck)

    // Verificar si existe la tabla pricing_rules
    const pricingRulesCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'pricing_rules'
      );
    `)
    console.log("📋 Pricing rules table exists:", pricingRulesCheck)

    // Obtener algunos vehículos para ver su estructura
    const vehicles = await db.execute(sql`
      SELECT id, name, pricing FROM vehicles LIMIT 3;
    `)
    console.log("🚗 Sample vehicles:", vehicles)

    return NextResponse.json({
      success: true,
      dbConnection: true,
      vehiclesTable: vehiclesCheck,
      pricingRulesTable: pricingRulesCheck,
      sampleVehicles: vehicles,
    })
  } catch (error) {
    console.error("❌ Database debug error:", error)
    return NextResponse.json(
      {
        error: "Database debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
