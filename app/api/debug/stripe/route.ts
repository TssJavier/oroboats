import { NextResponse } from "next/server"

export async function GET() {
  console.log("🚀 DEBUGGING STRIPE IN PRODUCTION")

  // 1. Verificar variables de entorno
  const envCheck = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
    hasLiveSecret: !!process.env.STRIPE_SECRET_KEY_LIVE,
    hasLivePublishable: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE,
    hasTestSecret: !!process.env.STRIPE_SECRET_KEY,
    hasTestPublishable: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  }

  console.log("📋 Environment Variables Check:", envCheck)

  // 2. Verificar formato de claves
  let keyCheck = {}

  if (process.env.STRIPE_SECRET_KEY_LIVE) {
    keyCheck = {
      ...keyCheck,
      liveSecret: {
        prefix: process.env.STRIPE_SECRET_KEY_LIVE.substring(0, 7),
        length: process.env.STRIPE_SECRET_KEY_LIVE.length,
        isValid: process.env.STRIPE_SECRET_KEY_LIVE.startsWith("sk_live"),
      },
    }
  }

  if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE) {
    keyCheck = {
      ...keyCheck,
      livePublishable: {
        prefix: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE.substring(0, 7),
        length: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE.length,
        isValid: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE.startsWith("pk_live"),
      },
    }
  }

  console.log("🔑 Key Check:", keyCheck)

  // 3. Test de conectividad con Stripe
  let stripeTest = {}
  try {
    const response = await fetch("https://api.stripe.com/v1/payment_methods", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY_LIVE || process.env.STRIPE_SECRET_KEY}`,
      },
    })

    stripeTest = {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
    }

    console.log("🌐 Stripe API Connection:", stripeTest)

    if (!response.ok) {
      const error = await response.text()
      console.error("❌ Stripe API Error:", error)
      stripeTest = { ...stripeTest, error }
    }
  } catch (error) {
    console.error("❌ Network Error connecting to Stripe:", error)
    stripeTest = { error: error instanceof Error ? error.message : String(error) }
  }

  // 4. Verificar dominio actual
  const currentDomain = process.env.VERCEL_URL || "localhost"

  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: envCheck,
    keys: keyCheck,
    stripeConnection: stripeTest,
    currentDomain,
    recommendations: [
      "1. Verify domain is authorized in Stripe Dashboard",
      "2. Check Payment Methods settings in Stripe",
      "3. Ensure CSP headers allow Stripe domains",
      "4. Test with only card payments first",
    ],
  }

  console.log("✅ Debug completed:", debugInfo)

  return NextResponse.json(debugInfo, { status: 200 })
}
