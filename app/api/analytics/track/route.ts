import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { pageType, pageUrl } = await request.json()

    // ✅ OBTENER DATOS DEL REQUEST
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const userAgent = request.headers.get("user-agent") || ""
    const referrer = request.headers.get("referer") || ""

    // ✅ CREAR SESSION ID SIMPLE (IP + USER AGENT HASH)
    const sessionId = Buffer.from(ip + userAgent)
      .toString("base64")
      .slice(0, 20)

    // ✅ VERIFICAR SI YA EXISTE UNA VISITA RECIENTE DE LA MISMA IP
    const recentVisit = await sql`
      SELECT id FROM page_analytics 
      WHERE visitor_ip = ${ip} 
      AND page_type = ${pageType}
      AND visited_at > NOW() - INTERVAL '30 minutes'
      LIMIT 1
    `

    // ✅ SI NO HAY VISITA RECIENTE, GUARDAR NUEVA
    if (recentVisit.length === 0) {
      await sql`
        INSERT INTO page_analytics (page_type, page_url, visitor_ip, user_agent, referrer, session_id)
        VALUES (${pageType}, ${pageUrl}, ${ip}, ${userAgent}, ${referrer}, ${sessionId})
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Analytics tracking error:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
