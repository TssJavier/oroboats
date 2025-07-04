import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/db-supabase"

export async function GET() {
  try {
    console.log("🔍 Testing Supabase connection...")

    // Test de conexión simple
    const { data, error } = await supabaseAdmin.from("vehicles").select("count").limit(1)

    if (error) {
      console.error("❌ Supabase query error:", error)
      return NextResponse.json(
        {
          error: "Supabase query failed",
          details: error.message,
          code: error.code,
          env: process.env.NODE_ENV,
        },
        { status: 500 },
      )
    }

    console.log("✅ Supabase connection successful")

    return NextResponse.json({
      success: true,
      message: "Supabase connection working",
      env: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Supabase connection error:", error)

    return NextResponse.json(
      {
        error: "Supabase connection failed",
        details: error instanceof Error ? error.message : "Unknown error",
        env: process.env.NODE_ENV,
      },
      { status: 500 },
    )
  }
}
