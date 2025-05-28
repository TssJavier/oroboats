import { type NextRequest, NextResponse } from "next/server"
import { cancelBooking } from "@/lib/db/availability-queries"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params
    const bookingId = Number.parseInt(id)

    if (isNaN(bookingId)) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 })
    }

    await cancelBooking(bookingId)

    return NextResponse.json({
      success: true,
      message: "Booking cancelled successfully",
    })
  } catch (error) {
    console.error("Error cancelling booking:", error)
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 })
  }
}
