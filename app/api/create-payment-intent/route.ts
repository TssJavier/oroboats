import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("💳 Creating payment intent for:", body)

    const { amount, currency = "eur", metadata = {} } = body

    // Verificar que tenemos la clave de Stripe
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      console.error("❌ STRIPE_SECRET_KEY not found in environment variables")
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
    }

    console.log("✅ STRIPE_SECRET_KEY found, first 4 chars:", stripeSecretKey.substring(0, 4))

    // Inicializar Stripe con la versión más estable
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-05-28.basil", // Versión más estable como mencionaste
    })

    console.log("✅ Stripe initialized successfully")

    // Crear Payment Intent - CORREGIDO: Solo usar automatic_payment_methods
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convertir a centavos
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      // ❌ ELIMINADO: payment_method_types (conflicto con automatic_payment_methods)
      metadata: {
        ...metadata,
        bookingData: JSON.stringify(body.bookingData), // Guardar datos de reserva
      },
    })

    console.log("✅ Payment Intent created:", paymentIntent.id)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    console.error("❌ Error creating payment intent:", error)

    // Log más detallado del error
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }

    return NextResponse.json(
      {
        error: "Failed to create payment intent",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
