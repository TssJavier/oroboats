import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { discountCodes } from "@/lib/db/schema"

export async function GET() {
  try {
    console.log("🔍 DEBUG: Fetching all discount codes...")

    const allCodes = await db.select().from(discountCodes).limit(10)

    console.log("📋 All discount codes:", allCodes)

    return NextResponse.json({
      success: true,
      totalCodes: allCodes.length,
      codes: allCodes,
      schema: {
        expectedFields: [
          "id",
          "code",
          "description",
          "discountType",
          "discountValue",
          "minAmount",
          "maxUses",
          "usedCount",
          "validFrom",
          "validUntil",
          "active",
        ],
      },
    })
  } catch (error) {
    console.error("❌ Error fetching codes:", error)
    return NextResponse.json(
      {
        error: "Error fetching codes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
