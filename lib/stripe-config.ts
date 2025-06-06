import Stripe from "stripe"

// 🔍 DETECTAR ENTORNO AUTOMÁTICAMENTE (MEJORADO)
const isProduction =
  process.env.NODE_ENV === "production" &&
  (process.env.VERCEL_ENV === "production" || process.env.VERCEL_URL?.includes("vercel.app"))

const isDevelopment =
  process.env.NODE_ENV === "development" || process.env.VERCEL_URL?.includes("localhost") || !process.env.VERCEL_ENV

console.log("🌍 Environment detection:", {
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_ENV: process.env.VERCEL_ENV,
  VERCEL_URL: process.env.VERCEL_URL,
  isProduction,
  isDevelopment,
})

// 🔑 CONFIGURACIÓN DE CLAVES POR ENTORNO
const getStripeConfig = () => {
  if (isProduction) {
    // 🔴 PRODUCCIÓN - Claves reales
    const secretKey = process.env.STRIPE_SECRET_KEY_LIVE
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE

    if (!secretKey || !publishableKey) {
      console.warn("⚠️ Production Stripe keys not configured, falling back to test")
      // Fallback a test si no hay claves de producción
      return getTestConfig()
    }

    console.log("🔴 Using PRODUCTION Stripe keys")
    return {
      secretKey,
      publishableKey,
      environment: "production" as const,
    }
  } else {
    // 🧪 DESARROLLO/TEST - Claves de prueba
    return getTestConfig()
  }
}

const getTestConfig = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY_TEST
  const publishableKey =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST

  if (!secretKey || !publishableKey) {
    console.error("❌ Test Stripe keys not configured")
    return null
  }

  console.log("🧪 Using TEST Stripe keys")
  return {
    secretKey,
    publishableKey,
    environment: "test" as const,
  }
}

const stripeConfig = getStripeConfig()

// 🛡️ INICIALIZAR STRIPE CON SEGURIDAD
const stripe = stripeConfig
  ? new Stripe(stripeConfig.secretKey, {
      apiVersion: "2025-05-28.basil",
    })
  : null

// 🚨 VERIFICACIONES DE SEGURIDAD
if (stripeConfig) {
  // Verificar que las claves coinciden con el entorno
  const keyPrefix = stripeConfig.secretKey.substring(0, 7)
  const expectedPrefix = isProduction ? "sk_live" : "sk_test"

  if (!keyPrefix.startsWith(expectedPrefix)) {
    console.warn(`⚠️ Key type mismatch! Expected ${expectedPrefix}, got ${keyPrefix}`)
  }

  console.log(`✅ Stripe initialized for ${stripeConfig.environment} environment`)
} else {
  console.error("❌ Stripe not initialized - missing configuration")
}

// 📊 CONFIGURACIÓN DE MÉTODOS DE PAGO
export const PAYMENT_METHODS = {
  card: {
    enabled: true,
    name: "Tarjeta de Crédito/Débito",
    description: "Visa, Mastercard, American Express",
    icon: "💳",
  },
  paypal: {
    enabled: !isDevelopment, // PayPal solo en producción
    name: "PayPal",
    description: "Paga con tu cuenta PayPal",
    icon: "🅿️",
  },
  apple_pay: {
    enabled: true,
    name: "Apple Pay",
    description: "Pago rápido con Touch ID",
    icon: "🍎",
  },
  google_pay: {
    enabled: true,
    name: "Google Pay",
    description: "Pago rápido con Google",
    icon: "🔵",
  },
}

// 🎯 FUNCIÓN PARA CREAR PAYMENT INTENT
export async function createPaymentWithDeposit({
  amount,
  depositAmount,
  currency = "eur",
  metadata = {},
}: {
  amount: number
  depositAmount: number
  currency?: string
  metadata?: Record<string, string>
}) {
  if (!stripe) {
    throw new Error("Stripe not configured")
  }

  try {
    // 1. Payment Intent para el alquiler
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
      metadata: {
        ...metadata,
        type: "rental_payment",
        environment: stripeConfig?.environment || "unknown",
      },
    })

    // 2. Payment Intent para la fianza
    const depositIntent = await stripe.paymentIntents.create({
      amount: Math.round(depositAmount * 100),
      currency,
      capture_method: "manual",
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
      metadata: {
        ...metadata,
        type: "security_deposit",
        environment: stripeConfig?.environment || "unknown",
      },
    })

    return {
      paymentIntent,
      depositIntent,
      totalAuthorized: amount + depositAmount,
    }
  } catch (error) {
    console.error("Error creating payment intents:", error)
    throw error
  }
}

// 🔍 EXPORTAR INFORMACIÓN DEL ENTORNO
export const stripeEnvironment = {
  isProduction,
  isDevelopment,
  environment: stripeConfig?.environment || "not_configured",
  hasValidConfig: !!stripeConfig,
  configDetails: {
    hasTestKeys: !!(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    hasLiveKeys: !!(process.env.STRIPE_SECRET_KEY_LIVE && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE),
  },
}

export default stripe
