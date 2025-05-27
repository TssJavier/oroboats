import { type NextRequest, NextResponse } from "next/server"
import { getBookings, createBooking } from "@/lib/db/queries"

export async function GET() {
  try {
    console.log("📅 API: Fetching bookings...")
    const bookings = await getBookings()
    console.log(`✅ API: Found ${bookings.length} bookings`)

    return NextResponse.json(bookings)
  } catch (error) {
    console.error("❌ API Error fetching bookings:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch bookings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("📅 API: Creating booking...")
    const body = await request.json()
    const booking = await createBooking(body)
    console.log("✅ API: Booking created successfully")

    return NextResponse.json(booking[0], { status: 201 })
  } catch (error) {
    console.error("❌ API Error creating booking:", error)
    return NextResponse.json(
      {
        error: "Failed to create booking",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
