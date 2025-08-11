import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { NextResponse, type NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { pageType, pageUrl } = await request.json()
    const visitorIp = request.ip || request.headers.get("x-forwarded-for") || "unknown"

    if (!pageType || !pageUrl) {
      console.warn("⚠️ Tracking: Missing pageType or pageUrl in request body.")
      return NextResponse.json({ error: "Missing pageType or pageUrl" }, { status: 400 })
    }

    console.log(`🔍 Tracking: pageType=${pageType}, pageUrl=${pageUrl}, visitorIp=${visitorIp}`)

    const insertResult = await db.execute(sql`
      INSERT INTO page_analytics (page_type, page_url, visitor_ip, visited_at)
      VALUES (${pageType}, ${pageUrl}, ${visitorIp}, NOW())
      RETURNING id;
    `)

    const insertedId = insertResult[0]?.id
    if (insertedId) {
      console.log(`✅ Analytics tracked successfully. Inserted ID: ${insertedId}`)
      return NextResponse.json({ success: true, id: insertedId }, { status: 200 })
    } else {
      console.error("❌ Analytics tracking failed: No ID returned after insert.")
      return NextResponse.json({ error: "Failed to track analytics" }, { status: 500 })
    }
  } catch (error) {
    console.error("❌ Analytics tracking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
