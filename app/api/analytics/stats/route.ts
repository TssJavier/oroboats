import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // ✅ ESTADÍSTICAS BÁSICAS
    const stats = await sql`
      SELECT 
        page_type,
        COUNT(*) as total_visits,
        COUNT(DISTINCT visitor_ip) as unique_visitors
      FROM page_analytics 
      WHERE visited_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY page_type
    `

    // ✅ ACTIVIDAD DIARIA ÚLTIMOS 7 DÍAS
    const dailyStats = await sql`
      SELECT 
        DATE(visited_at) as date,
        page_type,
        COUNT(*) as visits,
        COUNT(DISTINCT visitor_ip) as unique_visitors
      FROM page_analytics 
      WHERE visited_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(visited_at), page_type
      ORDER BY date DESC, page_type
    `

    // ✅ CALCULAR CONVERSIÓN
    const homeVisitors = stats.find((s) => s.page_type === "home")?.unique_visitors || 0
    const reservarVisitors = stats.find((s) => s.page_type === "reservar")?.unique_visitors || 0
    const conversionRate = homeVisitors > 0 ? ((reservarVisitors / homeVisitors) * 100).toFixed(1) : "0"

    return NextResponse.json({
      stats,
      dailyStats,
      conversionRate,
      summary: {
        homeVisits: stats.find((s) => s.page_type === "home")?.total_visits || 0,
        homeUnique: homeVisitors,
        reservarVisits: stats.find((s) => s.page_type === "reservar")?.total_visits || 0,
        reservarUnique: reservarVisitors,
        conversion: `${conversionRate}%`,
      },
    })
  } catch (error) {
    console.error("Analytics stats error:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
