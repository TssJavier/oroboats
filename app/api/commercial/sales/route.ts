import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hotels } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Verify auth
    const token = request.cookies.get("admin-token")?.value
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    // Find hotel codes assigned to this commercial (case-insensitive)
    const assignedHotels = await db
      .select()
      .from(hotels)
      .where(sql`LOWER(${hotels.commercialEmail}) = LOWER(${user.email})`)

    if (assignedHotels.length === 0) {
      return NextResponse.json({
        bookings: [],
        summary: { totalBookings: 0, totalRevenue: 0, totalCommission: 0 },
        hotelCodes: [],
      })
    }

    const hotelCodes = assignedHotels.map((h) => h.code)
    const commissionMap = Object.fromEntries(
      assignedHotels.map((h) => [h.code.toUpperCase(), Number(h.commissionPercent) || 0])
    )

    // Build conditions for all hotel codes
    const codeConditions = hotelCodes.map(
      (code) => sql`LOWER(b.hotel_code) = LOWER(${code})`
    )
    const whereClause = sql`(${sql.join(codeConditions, sql` OR `)})`

    // Get date filters
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    let dateCondition = sql``
    if (dateFrom && dateTo) {
      dateCondition = sql` AND b.booking_date >= ${dateFrom} AND b.booking_date <= ${dateTo}`
    } else if (dateFrom) {
      dateCondition = sql` AND b.booking_date >= ${dateFrom}`
    } else if (dateTo) {
      dateCondition = sql` AND b.booking_date <= ${dateTo}`
    }

    const query = sql`
      SELECT
        b.id,
        b.customer_name,
        b.customer_email,
        b.booking_date,
        b.time_slot,
        b.duration,
        b.total_price,
        b.status,
        b.payment_status,
        b.hotel_code,
        b.created_at,
        COALESCE(b.vehicle_name, v.name) as vehicle_name,
        COALESCE(b.vehicle_type, v.type) as vehicle_type
      FROM bookings b
      LEFT JOIN vehicles v ON b.vehicle_id = v.id
      WHERE ${whereClause}${dateCondition}
      ORDER BY b.created_at DESC
    `

    const bookings = (await db.execute(query)) as any[]

    // Calculate summary
    const paidBookings = bookings.filter(
      (b: any) => (b.payment_status === "paid" || b.payment_status === "completed" || b.payment_status === "free_booking") && b.status !== "cancelled"
    )
    const totalRevenue = paidBookings.reduce(
      (sum: number, b: any) => sum + (Number(b.total_price) || 0),
      0
    )

    let totalCommission = 0
    for (const booking of paidBookings) {
      const code = (booking.hotel_code || "").toUpperCase()
      const percent = commissionMap[code] || 0
      totalCommission += (Number(booking.total_price) || 0) * (percent / 100)
    }

    return NextResponse.json({
      bookings: bookings.map((b: any) => ({
        ...b,
        commission:
          ((Number(b.total_price) || 0) *
            ((commissionMap[(b.hotel_code || "").toUpperCase()] || 0) / 100)),
      })),
      summary: {
        totalBookings: paidBookings.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCommission: Math.round(totalCommission * 100) / 100,
      },
      hotelCodes,
    })
  } catch (error) {
    console.error("Error fetching commercial sales:", error)
    return NextResponse.json(
      { error: "Error al obtener ventas" },
      { status: 500 }
    )
  }
}
