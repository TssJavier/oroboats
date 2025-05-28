import { type NextRequest, NextResponse } from "next/server"
import { checkTimeConflict } from "@/lib/db/availability-queries"

export async function POST(request: NextRequest) {
  try {
    const { vehicleId, date, startTime, endTime, excludeBookingId } = await request.json()

    if (!vehicleId || !date || !startTime || !endTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const hasConflict = await checkTimeConflict(vehicleId, date, startTime, endTime, excludeBookingId)

    return NextResponse.json({
      hasConflict,
      vehicleId,
      date,
      startTime,
      endTime,
    })
  } catch (error) {
    console.error("Error checking conflict:", error)
    return NextResponse.json({ error: "Failed to check conflict" }, { status: 500 })
  }
}
