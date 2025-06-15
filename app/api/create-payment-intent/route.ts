import { type NextRequest, NextResponse } from "next/server"
import stripe from "@/lib/stripe-config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, paymentType, bookingData } = body

    console.log("🔄 Creating payment intent:", {
      amount,
      paymentType,
      hasBookingData: !!bookingData,
    })

    console.log("🧪 Stripe keys at runtime:", {
  env: process.env.NODE_ENV,
  secretKey: process.env.STRIPE_SECRET_KEY_LIVE?.substring(0, 8),
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE?.substring(0, 8),
})

    // Validar datos básicos
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount", details: "Amount must be greater than 0" }, { status: 400 })
    }

    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe not configured", details: "Stripe configuration missing" },
        { status: 500 },
      )
    }

    // Crear Payment Intent con configuración mínima
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convertir a centavos
      currency: "eur",
      payment_method_types: ["card"], // ✅ SOLO TARJETAS
      metadata: {
        bookingId: bookingData?.id || "unknown",
        vehicleName: bookingData?.vehicleName || "unknown",
        paymentType: paymentType || "full_payment",
        environment: process.env.NODE_ENV || "unknown",
      },
    })

    {/*console.log("🔍 Stripe BACKEND DEBUG:")
    console.log("- Entorno:", process.env.NODE_ENV)
    console.log("- Clave secreta usada (inicio):", process.env.STRIPE_SECRET_KEY_LIVE?.substring(0, 10))
    console.log("- client_secret generado:", paymentIntent.client_secret)
    console.log("- ID paymentIntent:", paymentIntent.id)*/}

    console.log("✅ Payment intent created:", {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      environment: process.env.NODE_ENV === "production" ? "production" : "development",
    })
  } catch (error) {
    console.error("❌ Error creating payment intent:", error)

    // Error específico de Stripe
    if (error instanceof Error && "type" in error) {
      const stripeError = error as any
      return NextResponse.json(
        {
          error: "Stripe error",
          details: stripeError.message,
          type: stripeError.type,
          code: stripeError.code,
        },
        { status: 400 },
      )
    }

    // Error genérico
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
