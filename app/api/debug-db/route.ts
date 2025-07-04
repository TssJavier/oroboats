import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET() {
  try {
    console.log("🔍 Debug DB Connection API")

    const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING

    if (!databaseUrl) {
      return NextResponse.json(
        {
          error: "No database URL configured",
          env: process.env.NODE_ENV,
        },
        { status: 500 },
      )
    }

    // Extraer host sin mostrar credenciales
    const urlParts = databaseUrl.match(/postgresql:\/\/.*@([^/]+)\//)
    const host = urlParts ? urlParts[1] : "unknown"

    console.log("🔗 Database host:", host)

    // Verificar que no sea Supabase
    if (host.includes("supabase.com")) {
      return NextResponse.json(
        {
          error: "Using Supabase URL instead of Neon",
          host: host,
          fix: "Change DATABASE_URL to your Neon database URL",
        },
        { status: 500 },
      )
    }

    // Intentar conexión
    const sql = neon(databaseUrl)
    const result = await sql`SELECT NOW() as current_time, 'connection_ok' as status`

    return NextResponse.json({
      success: true,
      host: host,
      timestamp: result[0].current_time,
      status: result[0].status,
      env: process.env.NODE_ENV,
    })
  } catch (error) {
    console.error("❌ DB Debug Error:", error)

    return NextResponse.json(
      {
        error: "Database connection failed",
        details: error instanceof Error ? error.message : "Unknown error",
        env: process.env.NODE_ENV,
      },
      { status: 500 },
    )
  }
}
