import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const waiverId = Number.parseInt(params.id)
  
  const debugInfo: {
    waiverId: number,
    database_connected: boolean,
    environment: "development" | "production" | "test" | undefined,
    timestamp: string,
    waiver_exists: boolean,
    query_success: boolean,
    error?: string
  } = {
    waiverId,
    database_connected: !!db,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    waiver_exists: false,
    query_success: false
  }

  try {
    const result = await db.execute(sql`SELECT COUNT(*) as count FROM liability_waivers WHERE id = ${waiverId}`) as unknown as { count: number }[]
    debugInfo.waiver_exists = result[0]?.count > 0
    debugInfo.query_success = true
  } catch (error) {
    debugInfo.query_success = false
    debugInfo.error = error instanceof Error ? error.message : "Unknown error"
  }

  return NextResponse.json(debugInfo)
}