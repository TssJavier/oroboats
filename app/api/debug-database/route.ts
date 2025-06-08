import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔍 Database Debug Started")

    // Verificar variables de entorno
    const hasDbUrl = !!process.env.DATABASE_URL
    const dbUrlLength = process.env.DATABASE_URL?.length || 0
    const dbUrlStart = process.env.DATABASE_URL?.substring(0, 20) || "Not set"

    console.log("📊 Environment check:")
    console.log("  - DATABASE_URL exists:", hasDbUrl)
    console.log("  - DATABASE_URL length:", dbUrlLength)
    console.log("  - DATABASE_URL start:", dbUrlStart)

    if (!hasDbUrl) {
      return NextResponse.json({
        error: "DATABASE_URL not configured",
        hasDbUrl,
        dbUrlLength,
        suggestion: "Add DATABASE_URL to environment variables",
      })
    }

    // Intentar conexión
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(process.env.DATABASE_URL!)

    console.log("🧪 Testing connection...")
    const testResult = await sql`SELECT NOW() as current_time, 'Connection OK' as status`

    console.log("✅ Connection successful:", testResult)

    // Verificar tablas
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `

    console.log(
      "📋 Available tables:",
      tables.map((t) => t.table_name),
    )

    // Verificar reservas recientes
    const recentBookings = await sql`
      SELECT 
        id,
        customer_name,
        vehicle_id,
        booking_date,
        time_slot,
        status,
        created_at
      FROM bookings 
      WHERE booking_date >= CURRENT_DATE - INTERVAL '1 day'
      ORDER BY created_at DESC
      LIMIT 10
    `

    console.log("📅 Recent bookings:", recentBookings.length)

    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        currentTime: testResult[0]?.current_time,
        tablesCount: tables.length,
        tables: tables.map((t) => t.table_name),
      },
      bookings: {
        recentCount: recentBookings.length,
        recent: recentBookings.map((b) => ({
          id: b.id,
          customer: b.customer_name,
          vehicle: b.vehicle_id,
          date: b.booking_date,
          timeSlot: b.time_slot,
          status: b.status,
          created: b.created_at,
        })),
      },
    })
  } catch (error) {
    console.error("❌ Database debug error:", error)

    return NextResponse.json(
      {
        error: "Database connection failed",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        hasDbUrl: !!process.env.DATABASE_URL,
        dbUrlLength: process.env.DATABASE_URL?.length || 0,
      },
      { status: 500 },
    )
  }
}
