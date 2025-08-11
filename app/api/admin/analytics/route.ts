import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { jwtVerify } from "jose"

// Desactiva el almacenamiento en caché para esta ruta API
export const revalidate = 0

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "tu-secreto-super-seguro-cambiar-en-produccion")

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 API: Fetching comprehensive page analytics stats...")

    // Verificar autenticación de admin
    const token = request.cookies.get("admin-token")?.value

    if (!token) {
      console.log("❌ No token provided for analytics API.")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    try {
      await jwtVerify(token, JWT_SECRET)
      console.log("✅ Admin token verified for analytics API.")
    } catch (error) {
      console.log("❌ Invalid token for analytics API:", error)
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    // 1. Estadísticas generales (total de visitas y visitantes únicos por tipo de página)
    // ✅ CORREGIDO: Usar NOW() - INTERVAL '30 days' para una comparación de fecha/hora más robusta
    const generalStats = await db.execute(sql`
      SELECT
        page_type,
        COUNT(*) AS total_visits,
        COUNT(DISTINCT visitor_ip) AS unique_visitors
      FROM page_analytics
      WHERE visited_at >= NOW() - INTERVAL '30 days'
      GROUP BY page_type
      ORDER BY page_type;
    `)
    console.log("📊 Raw generalStats result (page analytics):", generalStats)

    // 2. Estadísticas diarias (visitas y visitantes únicos por día)
    // ✅ CORREGIDO: Usar NOW() - INTERVAL '30 days' para una comparación de fecha/hora más robusta
    const dailyStats = await db.execute(sql`
      SELECT
        DATE(visited_at) AS date,
        page_type,
        COUNT(*) AS visits,
        COUNT(DISTINCT visitor_ip) AS unique_visitors
      FROM page_analytics
      WHERE visited_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(visited_at), page_type
      ORDER BY date ASC, page_type;
    `)
    console.log("📈 Raw dailyStats result (page analytics):", dailyStats)

    // 3. Páginas más visitadas (URL completa)
    // ✅ CORREGIDO: Usar NOW() - INTERVAL '30 days' para una comparación de fecha/hora más robusta
    const topPages = await db.execute(sql`
      SELECT
        page_url,
        COUNT(*) AS total_visits,
        COUNT(DISTINCT visitor_ip) AS unique_visitors
      FROM page_analytics
      WHERE visited_at >= NOW() - INTERVAL '30 days'
      GROUP BY page_url
      ORDER BY total_visits DESC
      LIMIT 5;
    `)
    console.log("⭐ Raw topPages result (page analytics):", topPages)

    // 4. Estadísticas por hora (para el día actual)
    // ✅ CORREGIDO: Usar CURRENT_DATE para obtener la fecha actual de la base de datos
    const hourlyStats = await db.execute(sql`
      SELECT
        EXTRACT(HOUR FROM visited_at AT TIME ZONE 'UTC') AS hour,
        COUNT(*) AS total_visits,
        COUNT(DISTINCT visitor_ip) AS unique_visitors
      FROM page_analytics
      WHERE DATE(visited_at) = CURRENT_DATE
      GROUP BY EXTRACT(HOUR FROM visited_at AT TIME ZONE 'UTC')
      ORDER BY hour ASC;
    `)
    console.log("⏰ Raw hourlyStats result (page analytics):", hourlyStats)

    return NextResponse.json({
      generalStats,
      dailyStats,
      topPages,
      hourlyStats,
    })
  } catch (error) {
    console.error("❌ Error fetching analytics data:", error)
    return NextResponse.json(
      {
        error: "Error al obtener datos de analíticas",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
