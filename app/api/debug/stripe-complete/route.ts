import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_LIVE || process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-05-28.basil",
})

export async function GET() {
  try {
    console.log("🔍 Starting complete Stripe account diagnosis...")

    const diagnosis: any = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
        VERCEL_URL: process.env.VERCEL_URL,
        hasLiveSecret: !!process.env.STRIPE_SECRET_KEY_LIVE,
        hasLivePublishable: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE,
        hasTestSecret: !!process.env.STRIPE_SECRET_KEY_TEST,
        hasTestPublishable: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST,
      },
      tests: {},
      recommendations: [],
    }

    // 1. 🏢 TEST: Información de la cuenta
    try {
      const account = await stripe.accounts.retrieve()
      diagnosis.tests.accountInfo = {
        success: true,
        data: {
          id: account.id,
          type: account.type,
          country: account.country,
          default_currency: account.default_currency,
          email: account.email,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
        },
      }
    } catch (error: any) {
      diagnosis.tests.accountInfo = {
        success: false,
        error: error.message,
      }
    }

    // 2. 💳 TEST: Crear Payment Intent
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 100,
        currency: "eur",
        payment_method_types: ["card"],
        metadata: {
          test: "diagnostic",
        },
      })

      diagnosis.tests.paymentIntent = {
        success: true,
        data: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          client_secret_exists: !!paymentIntent.client_secret,
        },
      }
    } catch (error: any) {
      diagnosis.tests.paymentIntent = {
        success: false,
        error: error.message,
        code: error.code,
        type: error.type,
      }
    }

    // 3. 🌍 TEST: Configuración de país
    try {
      const countryCode = diagnosis.tests.accountInfo?.data?.country || "ES"
      const countrySpecs = await stripe.countrySpecs.retrieve(countryCode)

      diagnosis.tests.countrySpecs = {
        success: true,
        data: {
          country: countryCode,
          default_currency: countrySpecs.default_currency,
          supported_payment_currencies: countrySpecs.supported_payment_currencies,
          supported_payment_methods: countrySpecs.supported_payment_methods,
        },
      }
    } catch (error: any) {
      diagnosis.tests.countrySpecs = {
        success: false,
        error: error.message,
      }
    }

    // 4. 🔧 TEST: Webhooks
    try {
      const webhooks = await stripe.webhookEndpoints.list({ limit: 10 })
      diagnosis.tests.webhooks = {
        success: true,
        data: {
          count: webhooks.data.length,
          endpoints: webhooks.data.map((wh) => ({
            id: wh.id,
            url: wh.url,
            status: wh.status,
            enabled_events_count: wh.enabled_events.length,
          })),
        },
      }
    } catch (error: any) {
      diagnosis.tests.webhooks = {
        success: false,
        error: error.message,
      }
    }

    // 5. 💰 TEST: Balance
    try {
      const balance = await stripe.balance.retrieve()
      diagnosis.tests.balance = {
        success: true,
        data: {
          available: balance.available,
          pending: balance.pending,
        },
      }
    } catch (error: any) {
      diagnosis.tests.balance = {
        success: false,
        error: error.message,
      }
    }

    // 6. 📊 ANÁLISIS AUTOMÁTICO
    const accountOk =
      diagnosis.tests.accountInfo?.success &&
      diagnosis.tests.accountInfo?.data?.charges_enabled &&
      diagnosis.tests.accountInfo?.data?.details_submitted

    const paymentIntentOk = diagnosis.tests.paymentIntent?.success

    const overallHealth = [
      diagnosis.tests.accountInfo?.success,
      diagnosis.tests.paymentIntent?.success,
      diagnosis.tests.countrySpecs?.success,
      accountOk,
    ].filter(Boolean).length

    diagnosis.summary = {
      overall_health: `${overallHealth}/4 tests passed`,
      account_status: accountOk ? "✅ Active" : "❌ Issues detected",
      payment_intents: paymentIntentOk ? "✅ Working" : "❌ Failed",
      api_connection: diagnosis.tests.accountInfo?.success ? "✅ Connected" : "❌ Failed",
    }

    // 7. 💡 RECOMENDACIONES
    if (!diagnosis.tests.accountInfo?.success) {
      diagnosis.recommendations.push("❌ Cannot connect to Stripe API - check API keys")
    }

    if (!accountOk) {
      diagnosis.recommendations.push("❌ Account not fully activated - complete setup in Stripe Dashboard")
    }

    if (!paymentIntentOk) {
      diagnosis.recommendations.push("❌ Cannot create Payment Intents - check account restrictions")
    }

    if (diagnosis.tests.accountInfo?.data?.country !== "ES") {
      diagnosis.recommendations.push("⚠️ Account country is not Spain - may affect payment methods")
    }

    if (diagnosis.recommendations.length === 0) {
      diagnosis.recommendations.push("✅ Stripe account appears healthy")
      diagnosis.recommendations.push("🔍 Issue likely client-side or domain-related")
    }

    console.log("✅ Stripe diagnosis completed")

    return NextResponse.json(diagnosis, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })
  } catch (error: any) {
    console.error("❌ Error in Stripe diagnosis:", error)

    return NextResponse.json(
      {
        error: "Failed to diagnose Stripe account",
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
