import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { bookings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import stripe from "@/lib/stripe-config"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const bookingId = Number.parseInt(params.id)
    const formData = await request.formData()

    const action = formData.get("action") as string
    const damageDescription = formData.get("damageDescription") as string
    const damageCost = formData.get("damageCost") as string

    // Obtener la reserva actual para acceder al ID de pago de la fianza
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
    })

    if (!booking) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
    }

    if (action === "approve") {
      // DEVOLUCIÓN AUTOMÁTICA CON STRIPE
      if (booking.depositPaymentIntentId && stripe) {
        try {
          console.log(`Procesando devolución para fianza: ${booking.depositPaymentIntentId}`)

          // 1. Cancelar la autorización de pago (para fianzas que solo están autorizadas)
          const paymentIntent = await stripe.paymentIntents.cancel(booking.depositPaymentIntentId, {
            cancellation_reason: "requested_by_customer",
          })

          console.log("Autorización de fianza cancelada:", paymentIntent.id)

          // 2. Alternativa: Si la fianza ya fue capturada, crear un reembolso
          // const refund = await stripe.refunds.create({
          //   payment_intent: booking.depositPaymentIntentId,
          //   amount: Math.round(Number(booking.securityDeposit) * 100)
          // })
          // console.log("Reembolso creado:", refund.id)
        } catch (stripeError) {
          console.error("Error al procesar la devolución con Stripe:", stripeError)
          return NextResponse.json({ error: "Error al procesar la devolución con Stripe" }, { status: 500 })
        }
      } else {
        console.log("No hay ID de pago de fianza o Stripe no está configurado")
      }

      // Actualizar estado en la base de datos
      await db
        .update(bookings)
        .set({
          inspectionStatus: "approved",
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, bookingId))

      return NextResponse.json({
        success: true,
        message: "Fianza aprobada y devuelta al cliente",
      })
    } else if (action === "reject") {
      // CAPTURAR PAGO DE FIANZA CON STRIPE
      const cost = damageCost ? Number.parseFloat(damageCost) : 0

      if (booking.depositPaymentIntentId && stripe) {
        try {
          console.log(`Capturando fianza por daños: ${booking.depositPaymentIntentId}`)

          // Capturar el pago de la fianza (convertir la autorización en cargo)
          const captureAmount = Math.min(Math.round(cost * 100), Math.round(Number(booking.securityDeposit) * 100))

          if (captureAmount > 0) {
            const paymentIntent = await stripe.paymentIntents.capture(booking.depositPaymentIntentId, {
              amount_to_capture: captureAmount,
            })

            console.log("Fianza capturada por daños:", paymentIntent.id, "Monto:", captureAmount / 100)

            // Si el coste de daños es menor que la fianza, devolver la diferencia
            const remainingAmount = Math.round(Number(booking.securityDeposit) * 100) - captureAmount

            if (remainingAmount > 0) {
              // Crear un reembolso parcial por la diferencia
              const refund = await stripe.refunds.create({
                payment_intent: booking.depositPaymentIntentId,
                amount: remainingAmount,
              })

              console.log("Reembolso parcial creado:", refund.id, "Monto:", remainingAmount / 100)
            }
          } else {
            // Si no hay coste, cancelar la autorización
            await stripe.paymentIntents.cancel(booking.depositPaymentIntentId)
            console.log("Autorización cancelada (sin daños que cobrar)")
          }
        } catch (stripeError) {
          console.error("Error al procesar el cobro de fianza con Stripe:", stripeError)
          return NextResponse.json({ error: "Error al procesar el cobro de fianza con Stripe" }, { status: 500 })
        }
      }

      // Actualizar estado en la base de datos
      await db
        .update(bookings)
        .set({
          inspectionStatus: "damaged",
          damageDescription: damageDescription,
          damageCost: cost.toString(),
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, bookingId))

      return NextResponse.json({
        success: true,
        message: "Fianza procesada y daños registrados",
      })
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
  } catch (error) {
    console.error("Error processing deposit:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
