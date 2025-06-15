// 🔍 SCRIPT PARA DEBUGEAR STRIPE EN PRODUCCIÓN

console.log("🚀 DEBUGGING STRIPE IN PRODUCTION")

// 1. Verificar variables de entorno
console.log("📋 Environment Variables Check:")
console.log({
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_ENV: process.env.VERCEL_ENV,
  VERCEL_URL: process.env.VERCEL_URL,
  hasLiveSecret: !!process.env.STRIPE_SECRET_KEY_LIVE,
  hasLivePublishable: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE,
  hasTestSecret: !!process.env.STRIPE_SECRET_KEY,
  hasTestPublishable: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
})

// 2. Verificar formato de claves
if (process.env.STRIPE_SECRET_KEY_LIVE) {
  console.log("🔑 Live Secret Key:", {
    prefix: process.env.STRIPE_SECRET_KEY_LIVE.substring(0, 7),
    length: process.env.STRIPE_SECRET_KEY_LIVE.length,
    isValid: process.env.STRIPE_SECRET_KEY_LIVE.startsWith("sk_live"),
  })
}

if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE) {
  console.log("🔑 Live Publishable Key:", {
    prefix: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE.substring(0, 7),
    length: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE.length,
    isValid: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE.startsWith("pk_live"),
  })
}

// 3. Test de conectividad con Stripe
async function testStripeConnection() {
  try {
    const response = await fetch("https://api.stripe.com/v1/payment_methods", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY_LIVE || process.env.STRIPE_SECRET_KEY}`,
      },
    })

    console.log("🌐 Stripe API Connection:", {
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("❌ Stripe API Error:", error)
    }
  } catch (error) {
    console.error("❌ Network Error connecting to Stripe:", error)
  }
}

testStripeConnection()

// 4. Verificar CSP y headers
console.log("🛡️ Security Headers Check:")
console.log("Make sure your domain allows:")
console.log("- https://js.stripe.com")
console.log("- https://api.stripe.com")
console.log("- https://pay.google.com")
console.log("- https://appleid.apple.com")

console.log("✅ Debug script completed")
