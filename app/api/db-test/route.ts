import { NextResponse } from "next/server"
import { db } from "@/lib/db/index"
import { vehicles } from "@/lib/db/schema"
import { sql } from "drizzle-orm"

export async function GET() {
  const tests = []
  
  try {
    // Test 1: Conexión básica
    console.log("🔍 Test 1: Basic connection...")
    await db.execute(sql`SELECT 1 as test`)
    tests.push({ test: "Basic Connection", status: "✅ PASS" })
    
    // Test 2: Verificar que la tabla vehicles existe
    console.log("🔍 Test 2: Vehicles table exists...")
    const tableCheck = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'vehicles'
    `)
    tests.push({ 
      test: "Vehicles Table Exists", 
      status: tableCheck.length > 0 ? "✅ PASS" : "❌ FAIL",
      details: `Found ${tableCheck.length} table(s)`
    })
    
    // Test 3: Contar registros en vehicles
    console.log("🔍 Test 3: Count vehicles...")
    const vehicleCount = await db.select().from(vehicles)
    tests.push({ 
      test: "Vehicle Count", 
      status: "✅ PASS",
      details: `Found ${vehicleCount.length} vehicles`
    })
    
    // Test 4: Verificar estructura de un vehículo
    if (vehicleCount.length > 0) {
      console.log("🔍 Test 4: Vehicle structure...")
      const firstVehicle = vehicleCount[0]
      tests.push({ 
        test: "Vehicle Structure", 
        status: "✅ PASS",
        details: {
          id: firstVehicle.id,
          name: firstVehicle.name,
          type: firstVehicle.type,
          hasImage: !!firstVehicle.image,
          hasPricing: !!firstVehicle.pricing,
          available: firstVehicle.available
        }
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Database diagnostics completed",
      tests,
      totalVehicles: vehicleCount.length
    })
    
  } catch (error) {
    console.error("❌ DB Test Error:", error)
    
    tests.push({ 
      test: "Error Details", 
      status: "❌ FAIL",
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json({ 
      success: false, 
      message: "Database connection failed",
      tests,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}