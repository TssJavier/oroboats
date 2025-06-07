import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

export async function GET() {
  try {
    // Consulta para ver todas las reservas con sus campos de fianza
    const allBookings = await db.execute(sql`
      SELECT 
        id, 
        customer_name, 
        security_deposit, 
        inspection_status,
        CASE 
          WHEN security_deposit IS NULL THEN 'null'
          WHEN security_deposit = '' THEN 'empty_string'
          WHEN security_deposit = '0' THEN 'zero_string'
          WHEN security_deposit = '0.00' THEN 'zero_decimal_string'
          WHEN security_deposit::numeric = 0 THEN 'numeric_zero'
          ELSE 'has_value'
        END AS deposit_type
      FROM bookings
      ORDER BY id DESC
      LIMIT 20
    `)

    // Consulta específica para ver reservas con fianza > 0
    const withDeposit = await db.execute(sql`
      SELECT 
        id, 
        customer_name, 
        security_deposit, 
        inspection_status
      FROM bookings
      WHERE CAST(security_deposit AS DECIMAL) > 0
      ORDER BY id DESC
    `)

    return NextResponse.json({
      success: true,
      allBookings: allBookings,
      withDeposit: withDeposit,
      counts: {
        total: allBookings.length,
        withDeposit: withDeposit.length,
      },
    })
  } catch (error) {
    console.error("Error in debug endpoint:", error)
    return NextResponse.json({ error: "Error interno del servidor", details: String(error) }, { status: 500 })
  }
}
