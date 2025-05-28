import { NextResponse } from "next/server"
import { migratePricingData } from "@/lib/db/migrate-pricing"

export async function POST() {
  try {
    await migratePricingData()
    return NextResponse.json({ success: true, message: "Pricing data migrated successfully" })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json(
      { error: "Migration failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
