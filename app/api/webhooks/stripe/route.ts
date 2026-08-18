import { type NextRequest, NextResponse } from "next/server"
import stripe from "@/lib/stripe-config"
import { confirmBookingForPaymentIntent } from "@/lib/booking-confirmation"

// ✅ Red de seguridad para pagos con métodos asíncronos/redirect (Bizum, Klarna, Link...).
//
// El flujo normal crea la reserva cuando el navegador del cliente confirma el pago y
// vuelve a /booking-success. Con Bizum ese viaje de ida y vuelta al banco es frágil en
// móvil: si el navegador no vuelve bien (pestaña cerrada, la app del banco no devuelve
// el control, red inestable...), el pago queda cobrado en Stripe pero nadie más lo intenta
// de nuevo y la reserva nunca se crea.
//
// Este webhook escucha directamente a Stripe: en cuanto el PaymentIntent del alquiler
// pasa a "succeeded", confirma la reserva en el servidor, sin depender de que el
// navegador del cliente haga nada. Es idempotente (ver confirmBookingForPaymentIntent),
// así que si el navegador ya la creó, este webhook no hace nada.

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  if (!stripe) {
    console.error("❌ Stripe webhook: Stripe no está configurado")
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("❌ Stripe webhook: falta STRIPE_WEBHOOK_SECRET")
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }

  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  const rawBody = await request.text()

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    console.error("❌ Stripe webhook: firma inválida:", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as { id: string; metadata: Record<string, string> }
      const type = paymentIntent.metadata?.type || ""

      // Las fianzas (DEPOSIT_AUTHORIZATION) no crean reserva, solo autorizan una tarjeta.
      if (type === "FULL_RENTAL_PAYMENT" || type === "PARTIAL_RENTAL_PAYMENT") {
        console.log("🪝 Webhook: payment_intent.succeeded para alquiler:", paymentIntent.id)
        const result = await confirmBookingForPaymentIntent(paymentIntent.id)
        console.log("🪝 Webhook: resultado ->", result.outcome)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    // ✅ Devolver 500 para que Stripe reintente la entrega del evento más tarde
    console.error("❌ Stripe webhook: error procesando evento:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}
