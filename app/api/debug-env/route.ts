import { NextResponse } from "next/server"

export async function GET() {
  // Verificar variables de entorno (ocultando parte de las claves por seguridad)
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "no encontrada"
  const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "no encontrada"

  // Mostrar solo los primeros y últimos caracteres
  const maskKey = (key: string) => {
    if (key === "no encontrada") return key
    return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`
  }

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    stripeSecretKey: maskKey(stripeSecretKey),
    stripePublishableKey: maskKey(stripePublishableKey),
    timestamp: new Date().toISOString(),
  })
}
