import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

export async function POST() {
  try {
    console.log("🔄 Aplicando migración para custom_duration_enabled...")

    // Añadir la columna si no existe
    await db.execute(sql`
      ALTER TABLE vehicles 
      ADD COLUMN IF NOT EXISTS custom_duration_enabled BOOLEAN DEFAULT true
    `)

    // Actualizar vehículos existentes
    await db.execute(sql`
      UPDATE vehicles 
      SET custom_duration_enabled = true 
      WHERE custom_duration_enabled IS NULL
    `)

    console.log("✅ Migración completada")

    return NextResponse.json({
      success: true,
      message: "Migración aplicada correctamente",
    })
  } catch (error) {
    console.error("❌ Error en migración:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error aplicando migración",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
