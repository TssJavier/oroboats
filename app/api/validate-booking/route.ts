import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json()

    console.log("🔍 Validating booking data before payment:", {
      customerName: bookingData.customerName,
      customerEmail: bookingData.customerEmail,
      vehicleId: bookingData.vehicleId,
      bookingDate: bookingData.bookingDate,
    })

    // ✅ VALIDAR TODOS LOS CAMPOS REQUERIDOS
    const requiredFields = ["customerName", "customerEmail", "vehicleId", "bookingDate", "startTime", "endTime"]
    const missingFields = requiredFields.filter((field) => !bookingData[field])

    if (missingFields.length > 0) {
      console.error("❌ Missing required fields:", missingFields)
      return NextResponse.json(
        {
          valid: false,
          error: "Missing required booking data",
          missingFields,
        },
        { status: 400 },
      )
    }

    // ✅ VALIDAR QUE EL VEHÍCULO EXISTE
    try {
      const vehicle = await db.query.vehicles.findFirst({
        where: (vehicles, { eq }) => eq(vehicles.id, Number(bookingData.vehicleId)),
      })

      if (!vehicle) {
        return NextResponse.json(
          {
            valid: false,
            error: "Vehicle not found",
          },
          { status: 400 },
        )
      }
    } catch (dbError) {
      console.error("❌ Database error validating vehicle:", dbError)
      return NextResponse.json(
        {
          valid: false,
          error: "Database error validating vehicle",
        },
        { status: 500 },
      )
    }

    // ✅ VALIDAR FORMATO DE FECHA
    const bookingDate = new Date(bookingData.bookingDate)
    if (isNaN(bookingDate.getTime())) {
      return NextResponse.json(
        {
          valid: false,
          error: "Invalid booking date format",
        },
        { status: 400 },
      )
    }

    // ✅ VALIDAR QUE LA FECHA NO SEA EN EL PASADO
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (bookingDate < today) {
      return NextResponse.json(
        {
          valid: false,
          error: "Cannot book for past dates",
        },
        { status: 400 },
      )
    }

    // ✅ VALIDAR HORARIOS
    if (!bookingData.startTime || !bookingData.endTime) {
      return NextResponse.json(
        {
          valid: false,
          error: "Invalid time slots",
        },
        { status: 400 },
      )
    }

    console.log("✅ Booking validation passed")
    return NextResponse.json({
      valid: true,
      message: "Booking data is valid",
    })
  } catch (error) {
    console.error("❌ Error validating booking:", error)
    return NextResponse.json(
      {
        valid: false,
        error: "Validation error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
