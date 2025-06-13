import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    // Verificar autenticación
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener parámetros de la URL
    const url = new URL(request.url)
    const startDate = url.searchParams.get("startDate")
    const endDate = url.searchParams.get("endDate")
    const excludeTest = url.searchParams.get("excludeTest") === "true"

    console.log("🔍 Filtros de estadísticas:", { startDate, endDate, excludeTest })

    // ✅ SIEMPRE excluir reservas de prueba por defecto
    const whereConditions = ["1=1"]

    // ✅ CONDICIÓN PRINCIPAL: Excluir reservas de prueba
    whereConditions.push("(is_test_booking IS NULL OR is_test_booking = false)")

    // Añadir filtros de fecha si están presentes
    if (startDate && endDate) {
      whereConditions.push(`booking_date BETWEEN '${startDate}' AND '${endDate}'`)
    } else if (startDate) {
      whereConditions.push(`booking_date >= '${startDate}'`)
    } else if (endDate) {
      whereConditions.push(`booking_date <= '${endDate}'`)
    }

    const whereClause = whereConditions.join(" AND ")

    // ✅ CONSULTA CORREGIDA: Solo reservas reales
    const statsQuery = `
      SELECT 
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
        SUM(CASE WHEN booking_date = CURRENT_DATE THEN 1 ELSE 0 END) as today_bookings,
        SUM(CASE WHEN is_manual_booking = true THEN 1 ELSE 0 END) as manual_bookings,
        SUM(CASE WHEN (is_manual_booking IS NULL OR is_manual_booking = false) THEN 1 ELSE 0 END) as online_bookings,
        COALESCE(SUM(CASE WHEN status IN ('confirmed', 'completed') THEN total_price::numeric ELSE 0 END), 0) as total_revenue
      FROM bookings
      WHERE ${whereClause}
    `

    console.log("📊 Ejecutando consulta de estadísticas (SIN PRUEBAS):", statsQuery)
    const statsResult = await db.execute(sql.raw(statsQuery))

    if (!statsResult || statsResult.length === 0) {
      throw new Error("No se pudieron obtener estadísticas")
    }

    const stats = statsResult[0]

    // ✅ CONSULTA SEPARADA: Contar reservas de prueba para información
    const testStatsQuery = `
      SELECT COUNT(*) as test_bookings
      FROM bookings
      WHERE is_test_booking = true
    `

    const testStatsResult = await db.execute(sql.raw(testStatsQuery))
    const testBookings = testStatsResult[0]?.test_bookings || 0

    // ✅ RESERVAS RECIENTES: Solo reales
    const recentBookingsQuery = `
      SELECT 
        id, 
        customer_name, 
        customer_email, 
        total_price, 
        status, 
        created_at,
        is_test_booking,
        is_manual_booking,
        sales_person
      FROM bookings
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT 10
    `

    console.log("📊 Ejecutando consulta de reservas recientes (SIN PRUEBAS):", recentBookingsQuery)
    const recentBookingsResult = await db.execute(sql.raw(recentBookingsQuery))

    // Transformar datos para el frontend
    const recentBookings = recentBookingsResult.map((booking) => ({
      id: booking.id,
      customerName: booking.customer_name,
      customerEmail: booking.customer_email,
      totalPrice: booking.total_price,
      status: booking.status,
      createdAt: booking.created_at,
      isTestBooking: booking.is_test_booking,
      isManualBooking: booking.is_manual_booking,
      salesPerson: booking.sales_person,
    }))

    console.log(`✅ Estadísticas REALES obtenidas:`)
    console.log(`   - Reservas reales: ${stats.total_bookings}`)
    console.log(`   - Ingresos reales: €${stats.total_revenue}`)
    console.log(`   - Reservas de prueba (excluidas): ${testBookings}`)
    console.log(`   - Reservas manuales: ${stats.manual_bookings}`)
    console.log(`   - Reservas online: ${stats.online_bookings}`)

    return NextResponse.json({
      totalBookings: Number(stats.total_bookings) || 0,
      totalRevenue: Number(stats.total_revenue) || 0,
      pendingBookings: Number(stats.pending_bookings) || 0,
      todayBookings: Number(stats.today_bookings) || 0,
      testBookingsCount: Number(testBookings) || 0, // Solo para información
      manualBookingsCount: Number(stats.manual_bookings) || 0,
      onlineBookingsCount: Number(stats.online_bookings) || 0,
      recentBookings,
    })
  } catch (error) {
    console.error("❌ Error obteniendo estadísticas:", error)
    return NextResponse.json(
      { error: "Error al obtener estadísticas", details: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    )
  }
}
