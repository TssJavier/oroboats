import { type NextRequest, NextResponse } from "next/server"
import { confirmBookingForPaymentIntent } from "@/lib/booking-confirmation"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentIntentId, depositPaymentIntentId, paymentType, liabilityWaiverId } = body

    if (!paymentIntentId) {
      return NextResponse.json({ error: "Missing paymentIntentId" }, { status: 400 })
    }

    console.log("🔍 Confirming booking for payment:", paymentIntentId, {
      depositPaymentIntentId,
      paymentType,
      liabilityWaiverId,
    })

    const result = await confirmBookingForPaymentIntent(paymentIntentId, {
      depositPaymentIntentId,
      paymentType,
      liabilityWaiverId,
    })

    if (result.outcome === "error") {
      return NextResponse.json(result.response, { status: result.status })
    }
    if (result.outcome === "overbooking_refunded") {
      return NextResponse.json(result.response, { status: 409 })
    }
    return NextResponse.json(result.response)
  } catch (error) {
    console.error("❌ Error confirming booking:", error)
    return NextResponse.json(
      {
        error: "Failed to confirm booking",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
