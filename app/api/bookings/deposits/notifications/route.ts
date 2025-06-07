import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

export async function POST() {
  try {
    // Consulta SQL directa para debug
    const result = await db.execute(sql`
      SELECT 
        id,
        customer_name,
        customer_email,
        booking_date,
        security_deposit,
        inspection_status,
        created_at,
        EXTRACT(DAY FROM (NOW() - created_at::timestamp)) as days_old
      FROM bookings 
      WHERE security_deposit::numeric > 0 
      AND inspection_status = 'pending'
      ORDER BY created_at DESC
    `)

    const deposits = (result as any[]).map((row: any) => ({
      id: row.id,
      customer: row.customer_name,
      email: row.customer_email,
      date: new Date(row.booking_date).toLocaleDateString("es-ES"),
      amount: row.security_deposit,
      daysOld: Math.floor(Number(row.days_old)),
      createdAt: row.created_at,
    }))

    console.log("Deposits found:", deposits.length, deposits)

    return NextResponse.json({
      success: true,
      deposits,
      count: deposits.length,
      debug: {
        totalRows: (result as any[]).length,
        query: "SELECT with security_deposit > 0 AND inspection_status = 'pending'",
      },
    })
  } catch (error) {
    console.error("Error checking notifications:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
