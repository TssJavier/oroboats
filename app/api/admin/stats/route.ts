import { NextResponse } from "next/server"
import { getAdminStats } from "@/lib/db/queries"

export async function GET() {
  try {
    const stats = await getAdminStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
