import { type NextRequest, NextResponse } from "next/server"
import { updateBookingStatus } from "@/lib/db/queries"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const bookingId = Number(params.id)

    if (isNaN(bookingId)) {
      return NextResponse.json({ error: "Invalid Booking ID" }, { status: 400 })
    }

    await updateBookingStatus(bookingId, "cancelled")

    return NextResponse.json({
      success: true,
      message: "Booking cancelled successfully",
    })
  } catch (error) {
    console.error("Error cancelling booking:", error)
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 })
  }
}
