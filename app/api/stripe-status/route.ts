import { NextResponse } from "next/server"
import { stripeEnvironment } from "@/lib/stripe-config"

export async function GET() {
  // 🔍 INFORMACIÓN COMPLETA DEL ENTORNO
  const envInfo = {
    // Variables de entorno de Node.js
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,

    // Detección de entorno
    isProduction: stripeEnvironment.isProduction,
    isDevelopment: stripeEnvironment.isDevelopment,
    environment: stripeEnvironment.environment,
    hasValidConfig: stripeEnvironment.hasValidConfig,

    // Verificación de claves (solo primeros caracteres por seguridad)
    stripeKeys: {
      test_secret: process.env.STRIPE_SECRET_KEY
        ? process.env.STRIPE_SECRET_KEY.substring(0, 7) + "..."
        : "❌ No encontrada",
      test_publishable: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.substring(0, 7) + "..."
        : "❌ No encontrada",
      live_secret: process.env.STRIPE_SECRET_KEY_LIVE
        ? process.env.STRIPE_SECRET_KEY_LIVE.substring(0, 7) + "..."
        : "❌ No encontrada",
      live_publishable: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE
        ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE.substring(0, 7) + "..."
        : "❌ No encontrada",
    },

    // URL actual
    currentUrl: process.env.VERCEL_URL || "localhost",

    // Timestamp
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(envInfo, {
    headers: {
      "Content-Type": "application/json",
    },
  })
}
