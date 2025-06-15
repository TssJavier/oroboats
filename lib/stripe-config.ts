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

    // ✅ AÑADIDO: Logging detallado para debugging en producción
    console.log("🔍 Production keys check:", {
      hasSecretKey: !!secretKey,
      hasPublishableKey: !!publishableKey,
      secretKeyPrefix: secretKey?.substring(0, 7),
      publishableKeyPrefix: publishableKey?.substring(0, 7),
      secretKeyLength: secretKey?.length,
      publishableKeyLength: publishableKey?.length,
    })

    if (!secretKey || !publishableKey) {
      console.warn("⚠️ Production Stripe keys not configured, falling back to test")
      // Fallback a test si no hay claves de producción
      return getTestConfig()
    }

    // ✅ AÑADIDO: Verificación de formato de claves
    if (!secretKey.startsWith("sk_live")) {
      console.error("❌ STRIPE_SECRET_KEY_LIVE should start with 'sk_live', got:", secretKey.substring(0, 7))
      console.error("❌ This will cause Stripe to fail in production!")
    }

    if (!publishableKey.startsWith("pk_live")) {
      console.error(
        "❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE should start with 'pk_live', got:",
        publishableKey.substring(0, 7),
      )
      console.error("❌ This will cause Stripe Elements to fail in production!")
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

  // ✅ AÑADIDO: Logging detallado para debugging en desarrollo
  console.log("🔍 Test keys check:", {
    hasSecretKey: !!secretKey,
    hasPublishableKey: !!publishableKey,
    secretKeyPrefix: secretKey?.substring(0, 8),
    publishableKeyPrefix: publishableKey?.substring(0, 8),
    secretKeyLength: secretKey?.length,
    publishableKeyLength: publishableKey?.length,
  })

  if (!secretKey || !publishableKey) {
    console.error("❌ Test Stripe keys not configured")
    return null
  }

  // ✅ AÑADIDO: Verificación de formato de claves de test
  if (!secretKey.startsWith("sk_test")) {
    console.error("❌ Test secret key should start with 'sk_test', got:", secretKey.substring(0, 8))
  }

  if (!publishableKey.startsWith("pk_test")) {
    console.error("❌ Test publishable key should start with 'pk_test', got:", publishableKey.substring(0, 8))
  }

  console.log("🧪 Using TEST Stripe keys")
  return {
    secretKey,
    publishableKey,
    environment: "test" as const,
  }
}

const stripeConfig = getStripeConfig()

// 🛡️ INICIALIZAR STRIPE CON SEGURIDAD - ✅ VERSIÓN MÁS NUEVA
const stripe = stripeConfig
  ? new Stripe(stripeConfig.secretKey, {
      apiVersion: "2025-05-28.basil", // ✅ RESTAURADO: Versión más nueva como sugieres
    })
  : null

// 🚨 VERIFICACIONES DE SEGURIDAD (MEJORADAS)
if (stripeConfig) {
  // Verificar que las claves coinciden con el entorno
  const keyPrefix = stripeConfig.secretKey.substring(0, 7)
  const expectedPrefix = isProduction ? "sk_live" : "sk_test"

  if (!keyPrefix.startsWith(expectedPrefix)) {
    console.warn(`⚠️ Key type mismatch! Expected ${expectedPrefix}, got ${keyPrefix}`)
  }

  // ✅ AÑADIDO: Verificación adicional para Stripe Elements
  console.log("🔍 Stripe Elements configuration:", {
    environment: stripeConfig.environment,
    publishableKeyValid: stripeConfig.publishableKey.length > 20,
    secretKeyValid: stripeConfig.secretKey.length > 20,
    apiVersion: "2025-05-28.basil",
  })

  console.log(`✅ Stripe initialized for ${stripeConfig.environment} environment`)
} else {
  console.error("❌ Stripe not initialized - missing configuration")
  console.error("❌ This will cause payment forms to show blank!")
}

// ✅ AÑADIDO: Logging específico para debugging de Stripe Elements
if (typeof window !== "undefined") {
  console.log("🔍 Client-side Stripe config:", {
    hasStripeConfig: !!stripeConfig,
    environment: stripeConfig?.environment,
    publishableKeyPrefix: stripeConfig?.publishableKey?.substring(0, 7),
  })
}

// 📊 CONFIGURACIÓN DE MÉTODOS DE PAGO (SIMPLIFICADA PARA DEBUG)
export const PAYMENT_METHODS = {
  card: {
    enabled: true,
    name: "Tarjeta de Crédito/Débito",
    description: "Visa, Mastercard, American Express",
    icon: "💳",
  },
  // ✅ TEMPORALMENTE DESHABILITADOS PARA DEBUG
  // paypal: {
  //   enabled: !isDevelopment,
  //   name: "PayPal",
  //   description: "Paga con tu cuenta PayPal",
  //   icon: "🅿️",
  // },
  // apple_pay: {
  //   enabled: true,
  //   name: "Apple Pay",
  //   description: "Pago rápido con Touch ID",
  //   icon: "🍎",
  // },
  // google_pay: {
  //   enabled: true,
  //   name: "Google Pay",
  //   description: "Pago rápido con Google",
  //   icon: "🔵",
  // },
}

// 🎯 FUNCIÓN PARA CREAR PAYMENT INTENT (MANTENIDA)
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

// 🔍 EXPORTAR INFORMACIÓN DEL ENTORNO (MEJORADA)
export const stripeEnvironment = {
  isProduction,
  isDevelopment,
  environment: stripeConfig?.environment || "not_configured",
  hasValidConfig: !!stripeConfig,
  configDetails: {
    hasTestKeys: !!(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    hasLiveKeys: !!(process.env.STRIPE_SECRET_KEY_LIVE && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE),
  },
  // ✅ AÑADIDO: Información adicional para debugging
  debugInfo: {
    publishableKeyPrefix: stripeConfig?.publishableKey?.substring(0, 7),
    secretKeyPrefix: stripeConfig?.secretKey?.substring(0, 7),
    configExists: !!stripeConfig,
    stripeInitialized: !!stripe,
  },
}

export default stripe
