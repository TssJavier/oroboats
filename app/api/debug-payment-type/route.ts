import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

export async function GET() {
  try {
    // Verificar la estructura de la tabla
    const tableStructure = await db.execute(sql`
      SELECT column_name, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'bookings' AND column_name IN ('payment_type', 'amount_paid', 'amount_pending')
    `)

    // Obtener las últimas 5 reservas
    const recentBookings = await db.execute(sql`
      SELECT 
        id, 
        customer_name, 
        payment_type, 
        amount_paid, 
        amount_pending, 
        total_price,
        created_at
      FROM bookings
      ORDER BY created_at DESC
      LIMIT 5
    `)

    // Contar por tipo de pago
    const paymentTypeCounts = await db.execute(sql`
      SELECT 
        payment_type, 
        COUNT(*) as count
      FROM bookings
      GROUP BY payment_type
    `)

    return NextResponse.json({
      tableStructure: tableStructure,
      recentBookings: recentBookings,
      paymentTypeCounts: paymentTypeCounts,
      message: "Datos de diagnóstico de tipos de pago",
    })
  } catch (error) {
    console.error("Error en diagnóstico de tipos de pago:", error)
    return NextResponse.json({ error: "Error en diagnóstico" }, { status: 500 })
  }
}