import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { getCurrentUser } from "@/lib/auth"

// Reservas futuras y activas cuyo vehicle_id quedó desvinculado (NULL), normalmente porque
// se borró el vehículo desde el admin. Al no tener vehicle_id, estas reservas son invisibles
// para las comprobaciones de disponibilidad/solapamiento de cualquier vehículo (incluido uno
// nuevo creado con el mismo nombre), lo que puede provocar dobles reservas silenciosas.
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const rows = await db.execute(sql`
      SELECT id, customer_name, vehicle_name, booking_date::text AS booking_date, time_slot, status
      FROM bookings
      WHERE vehicle_id IS NULL
        AND booking_date >= CURRENT_DATE
        AND (status IS NULL OR status <> 'cancelled')
        AND (payment_status IS NULL OR payment_status <> 'hold')
      ORDER BY booking_date ASC
    `)

    return NextResponse.json({ bookings: rows })
  } catch (error) {
    console.error("❌ Error fetching orphaned bookings:", error)
    return NextResponse.json({ error: "Failed to fetch orphaned bookings" }, { status: 500 })
  }
}
