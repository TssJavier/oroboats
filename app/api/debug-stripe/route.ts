import { NextResponse } from "next/server"
import stripe from "@/lib/stripe-config"

export async function GET() {
  try {
    console.log("🔍 Debug Stripe Configuration")

    // Verificar variables de entorno
    const hasTestSecret = !!process.env.STRIPE_SECRET_KEY
    const hasLiveSecret = !!process.env.STRIPE_SECRET_KEY_LIVE
    const hasTestPublic = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    const hasLivePublic = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE

    const nodeEnv = process.env.NODE_ENV
    const vercelEnv = process.env.VERCEL_ENV
    const publicEnv = process.env.NEXT_PUBLIC_ENVIRONMENT

    console.log("🌍 Environment variables:", {
      NODE_ENV: nodeEnv,
      VERCEL_ENV: vercelEnv,
      NEXT_PUBLIC_ENVIRONMENT: publicEnv,
      hasTestSecret,
      hasLiveSecret,
      hasTestPublic,
      hasLivePublic,
    })

    // Determinar qué claves debería usar
    const shouldUseLive = nodeEnv === "production" && publicEnv === "production"

    const currentSecretKey = shouldUseLive ? process.env.STRIPE_SECRET_KEY_LIVE : process.env.STRIPE_SECRET_KEY
    const currentPublicKey = shouldUseLive
      ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE
      : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

    if (!stripe) {
      return NextResponse.json(
        {
          error: "Stripe not initialized",
          config: {
            nodeEnv,
            vercelEnv,
            publicEnv,
            shouldUseLive,
            hasCurrentSecret: !!currentSecretKey,
            hasCurrentPublic: !!currentPublicKey,
          },
        },
        { status: 500 },
      )
    }

    // Test simple de Stripe
    const testIntent = await stripe.paymentIntents.create({
      amount: 100, // €1.00
      currency: "eur",
      metadata: {
        test: "debug",
      },
    })

    return NextResponse.json({
      success: true,
      config: {
        nodeEnv,
        vercelEnv,
        publicEnv,
        shouldUseLive,
        secretKeyPrefix: currentSecretKey?.substring(0, 7),
        publicKeyPrefix: currentPublicKey?.substring(0, 7),
        stripeInitialized: !!stripe,
      },
      testPaymentIntent: {
        id: testIntent.id,
        status: testIntent.status,
        amount: testIntent.amount,
      },
    })
  } catch (error) {
    console.error("❌ Stripe debug error:", error)

    return NextResponse.json(
      {
        error: "Stripe debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
        config: {
          NODE_ENV: process.env.NODE_ENV,
          VERCEL_ENV: process.env.VERCEL_ENV,
          NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
        },
      },
      { status: 500 },
    )
  }
}
