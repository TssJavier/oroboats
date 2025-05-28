import { type NextRequest, NextResponse } from "next/server"
import { createBooking } from "@/lib/db/queries"

export async function POST(request: NextRequest) {
  try {
    console.log("📅 API: Creating booking...")
    const body = await request.json()

    // Verificar si la fecha y hora son válidas
    const bookingDate = new Date(body.bookingDate)
    const startTime = body.startTime
    const [hours, minutes] = startTime.split(":").map(Number)
    bookingDate.setHours(hours)
    bookingDate.setMinutes(minutes)

    if (bookingDate < new Date()) {
      console.log("❌ Booking in the past")
      return NextResponse.json({ error: "No puedes reservar en el pasado" }, { status: 400 })
    }

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
