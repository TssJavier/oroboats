import { NextResponse } from "next/server"
import { removeDuplicateVehicles } from "@/lib/db/queries"

export async function POST() {
  try {
    console.log("🧹 API: Starting cleanup of duplicate vehicles...")
    const deletedCount = await removeDuplicateVehicles()

    return NextResponse.json({
      success: true,
      message: `Removed ${deletedCount} duplicate vehicles`,
      deletedCount,
    })
  } catch (error) {
    console.error("❌ API Error during cleanup:", error)
    return NextResponse.json(
      {
        error: "Failed to cleanup vehicles",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
