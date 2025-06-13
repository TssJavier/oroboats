import { type NextRequest, NextResponse } from "next/server"
import stripe, { stripeEnvironment } from "@/lib/stripe-config"
import { db } from "@/lib/db"
import { bookings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    // 🛡️ VERIFICAR CONFIGURACIÓN
    if (!stripe) {
      console.error("❌ Stripe not configured:", stripeEnvironment)
      return NextResponse.json(
        {
          error: "Stripe not configured",
          environment: stripeEnvironment.environment,
          details: "Please configure Stripe keys for this environment",
          debug: stripeEnvironment,
        },
        { status: 500 },
      )
    }

    const body = await request.json()

    // ✅ VERIFICAR Y NORMALIZAR DATOS DE PAGO PARCIAL
    const paymentType = body.paymentType || body.bookingData?.paymentType || "full_payment"
    const amountPaid = body.amountPaid || body.bookingData?.amountPaid || body.amount
    const amountPending = body.amountPending || body.bookingData?.amountPending || 0

    console.log(`💳 Creating payment intent (${stripeEnvironment.environment}):`, {
      amount: body.amount,
      environment: stripeEnvironment.environment,
      hasValidConfig: stripeEnvironment.hasValidConfig,
      // ✅ DATOS DE PAGO PARCIAL NORMALIZADOS
      paymentType,
      amountPaid,
      amountPending,
    })

    const { amount, currency = "eur", metadata = {} } = body

    // 🚨 VERIFICACIÓN DE SEGURIDAD EN PRODUCCIÓN
    if (stripeEnvironment.isProduction && amount < 0.5) {
      return NextResponse.json(
        {
          error: "Invalid amount for production",
          details: "Minimum amount in production is €0.50",
          environment: stripeEnvironment.environment,
        },
        { status: 400 },
      )
    }

    // ✅ PREPARAR DATOS DE BOOKING PARA METADATA
    const bookingDataWithPaymentInfo = {
      ...body.bookingData,
      paymentType,
      amountPaid,
      amountPending,
    }

    // ✅ CREAR PAYMENT INTENT CON DATOS DE PAGO PARCIAL EXPLÍCITOS
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        ...metadata,
        environment: stripeEnvironment.environment,
        bookingData: JSON.stringify(bookingDataWithPaymentInfo),
        isTestMode: stripeEnvironment.isDevelopment ? "true" : "false",
        // ✅ DATOS DE PAGO PARCIAL EXPLÍCITOS
        paymentType,
        amountPaid: String(amountPaid),
        amountPending: String(amountPending),
      },
    })

    console.log(`✅ Payment Intent created (${stripeEnvironment.environment}):`, {
      id: paymentIntent.id,
      paymentType,
      amountPaid,
      amountPending,
    })

    // ✅ NUEVA FUNCIONALIDAD: Actualizar reserva con paymentId y marcar si es de prueba
    if (body.bookingData?.bookingId) {
      try {
        await db
          .update(bookings)
          .set({
            paymentId: paymentIntent.id,
            isTestBooking: stripeEnvironment.isDevelopment,
            // ✅ DATOS DE PAGO PARCIAL
            paymentType,
            amountPaid: amountPaid || null,
            amountPending: amountPending || 0,
            paymentLocation: amountPending > 0 ? "mixed" : "online",
          })
          .where(eq(bookings.id, body.bookingData.bookingId))

        console.log(`📝 Booking updated with payment ID and test flag:`, {
          bookingId: body.bookingData.bookingId,
          paymentId: paymentIntent.id,
          isTest: stripeEnvironment.isDevelopment,
          paymentType,
        })
      } catch (dbError) {
        console.error("⚠️ Error updating booking:", dbError)
        // No fallar el payment intent por un error de DB
      }
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      environment: stripeEnvironment.environment,
      debug: {
        isProduction: stripeEnvironment.isProduction,
        isDevelopment: stripeEnvironment.isDevelopment,
        hasValidConfig: stripeEnvironment.hasValidConfig,
        paymentType,
      },
    })
  } catch (error) {
    console.error("❌ Error creating payment intent:", error)

    return NextResponse.json(
      {
        error: "Failed to create payment intent",
        environment: stripeEnvironment.environment,
        details: error instanceof Error ? error.message : "Unknown error",
        debug: stripeEnvironment,
      },
      { status: 500 },
    )
  }
}
