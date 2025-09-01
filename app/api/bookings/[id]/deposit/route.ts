import { type NextRequest, NextResponse } from "next/server"
import stripe from "@/lib/stripe-config"
import { supabaseAdmin } from "@/lib/db-supabase"

const supabase = supabaseAdmin

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const bookingId = params.id
    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID required" }, { status: 400 })
    }

    let requestData
    try {
      requestData = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON data" }, { status: 400 })
    }

    const { action, damageDescription, damageCost } = requestData

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
    if (damageCost && isNaN(Number(damageCost))) {
      return NextResponse.json({ error: "Invalid damage cost" }, { status: 400 })
    }

    // Obtener datos de la reserva
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single()

    if (bookingError || !booking) {
      console.error("❌ Booking not found:", bookingError)
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    console.log("🔍 Booking found:", {
      id: booking.id,
      depositPaymentIntentId: booking.deposit_payment_intent_id,
      securityDeposit: booking.security_deposit,
      inspectionStatus: booking.inspection_status,
      paymentId: booking.payment_id,
    })

    const depositAmount = Number.parseFloat(booking.security_deposit || "0")

    if (action === "approve") {
      // ✅ DEVOLVER FIANZA
      let stripeOperationSuccess = false

      if (booking.deposit_payment_intent_id && stripe) {
        try {
          console.log(`💰 Processing deposit return: ${booking.deposit_payment_intent_id}`)

          // ✅ PASO 1: VERIFICAR ESTADO ACTUAL
          const paymentIntent = await stripe.paymentIntents.retrieve(booking.deposit_payment_intent_id)
          console.log("🔍 Current deposit payment intent status:", paymentIntent.status)

          if (paymentIntent.status === "requires_payment_method") {
            // ✅ PASO 2: CONFIRMAR PRIMERO CON EL PAYMENT METHOD DEL PAGO PRINCIPAL
            console.log("🔄 Deposit was never authorized, confirming first...")

            // Obtener el payment method del pago principal
            const mainPaymentIntent = await stripe.paymentIntents.retrieve(booking.payment_id)
            console.log("🔍 Main payment method:", mainPaymentIntent.payment_method)

            if (mainPaymentIntent.payment_method) {
              try {
                const confirmedIntent = await stripe.paymentIntents.confirm(booking.deposit_payment_intent_id, {
                  payment_method: mainPaymentIntent.payment_method as string,
                  return_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://oroboats.com"}/admin/bookings`,
                })

                console.log("✅ Deposit intent confirmed:", {
                  id: confirmedIntent.id,
                  status: confirmedIntent.status,
                  amount: confirmedIntent.amount / 100,
                })

                // ✅ PASO 3: CANCELAR DESPUÉS DE CONFIRMAR
                if (confirmedIntent.status === "requires_capture") {
                  const cancelledIntent = await stripe.paymentIntents.cancel(booking.deposit_payment_intent_id)
                  console.log("✅ Deposit authorization canceled after confirmation:", {
                    id: cancelledIntent.id,
                    status: cancelledIntent.status,
                  })
                  stripeOperationSuccess = true
                } else if (confirmedIntent.status === "succeeded") {
                  // Si ya se capturó, crear un refund
                  const refund = await stripe.refunds.create({
                    payment_intent: booking.deposit_payment_intent_id,
                    amount: Math.round(depositAmount * 100),
                  })
                  console.log("✅ Deposit refunded:", refund.id)
                  stripeOperationSuccess = true
                } else {
                  console.warn(`⚠️ Unexpected status after confirmation: ${confirmedIntent.status}`)
                }
              } catch (confirmError: any) {
                console.error("❌ Error confirming deposit intent:", confirmError)
                console.warn("⚠️ Will mark as returned in database only")
              }
            } else {
              console.warn("⚠️ No payment method found in main payment intent")
            }
          } else if (paymentIntent.status === "requires_capture") {
            // ✅ CASO NORMAL: CANCELAR AUTORIZACIÓN
            const cancelledIntent = await stripe.paymentIntents.cancel(booking.deposit_payment_intent_id)
            console.log("✅ Deposit authorization canceled:", {
              id: cancelledIntent.id,
              status: cancelledIntent.status,
            })
            stripeOperationSuccess = true
          } else if (paymentIntent.status === "succeeded") {
            // ✅ YA SE CAPTURÓ: CREAR REFUND
            const refund = await stripe.refunds.create({
              payment_intent: booking.deposit_payment_intent_id,
              amount: Math.round(depositAmount * 100),
            })
            console.log("✅ Deposit refunded:", refund.id)
            stripeOperationSuccess = true
          } else if (paymentIntent.status === "canceled") {
            console.log("✅ Deposit already canceled")
            stripeOperationSuccess = true
          } else {
            console.warn(`⚠️ Cannot process deposit in status: ${paymentIntent.status}`)
          }
        } catch (stripeError: any) {
          console.error("❌ Stripe error:", stripeError)
          console.warn("⚠️ Continuing with database update only")
        }
      } else {
        console.warn("⚠️ No deposit payment intent ID or Stripe not configured")
      }

      // ✅ ACTUALIZAR BASE DE DATOS
      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          inspection_status: "approved",
          deposit_status: "refunded",
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId)

      if (updateError) {
        console.error("❌ Database update error:", updateError)
        return NextResponse.json(
          {
            error: "Error updating booking",
            details: updateError.message,
          },
          { status: 500 },
        )
      }

      return NextResponse.json({
        success: true,
        message: stripeOperationSuccess
          ? "Fianza devuelta correctamente en Stripe y base de datos"
          : "Fianza marcada como devuelta en base de datos (Stripe no procesado)",
        amount: depositAmount,
        stripeProcessed: stripeOperationSuccess,
      })
    } else if (action === "reject") {
      // ✅ RETENER FIANZA
      const cost = damageCost ? Number.parseFloat(damageCost) : depositAmount

      if (!damageDescription?.trim()) {
        return NextResponse.json({ error: "Descripción de daños requerida" }, { status: 400 })
      }

      let stripeOperationSuccess = false

      if (booking.deposit_payment_intent_id && stripe) {
        try {
          console.log(`💰 Processing deposit capture for damages...`)

          // ✅ VERIFICAR ESTADO ACTUAL
          const paymentIntent = await stripe.paymentIntents.retrieve(booking.deposit_payment_intent_id)
          console.log("🔍 Current deposit payment intent status:", paymentIntent.status)

          if (paymentIntent.status === "requires_payment_method") {
            // ✅ CONFIRMAR PRIMERO
            console.log("🔄 Confirming deposit intent first...")

            const mainPaymentIntent = await stripe.paymentIntents.retrieve(booking.payment_id)

            if (mainPaymentIntent.payment_method) {
              const confirmedIntent = await stripe.paymentIntents.confirm(booking.deposit_payment_intent_id, {
                payment_method: mainPaymentIntent.payment_method as string,
                return_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://oroboats.com"}/admin/bookings`,
              })

              console.log("✅ Deposit intent confirmed for capture:", confirmedIntent.status)

              // ✅ CAPTURAR DESPUÉS DE CONFIRMAR
              if (confirmedIntent.status === "requires_capture") {
                const captureAmount = Math.min(cost, depositAmount)
                const captureAmountCents = Math.round(captureAmount * 100)

                const capturedIntent = await stripe.paymentIntents.capture(booking.deposit_payment_intent_id, {
                  amount_to_capture: captureAmountCents,
                })

                console.log("✅ Deposit captured successfully:", {
                  id: capturedIntent.id,
                  status: capturedIntent.status,
                  captured: captureAmount,
                })
                stripeOperationSuccess = true
              }
            }
          } else if (paymentIntent.status === "requires_capture") {
            // ✅ CASO NORMAL: CAPTURAR DIRECTAMENTE
            const captureAmount = Math.min(cost, depositAmount)
            const captureAmountCents = Math.round(captureAmount * 100)

            const capturedIntent = await stripe.paymentIntents.capture(booking.deposit_payment_intent_id, {
              amount_to_capture: captureAmountCents,
            })

            console.log("✅ Deposit captured successfully:", {
              id: capturedIntent.id,
              status: capturedIntent.status,
              captured: captureAmount,
            })
            stripeOperationSuccess = true
          } else if (paymentIntent.status === "succeeded") {
            console.log("✅ Deposit already captured")
            stripeOperationSuccess = true
          } else {
            console.warn(`⚠️ Cannot capture deposit in status: ${paymentIntent.status}`)
          }
        } catch (stripeError: any) {
          console.error("❌ Stripe capture error:", stripeError)
          console.warn("⚠️ Continuing with database update only")
        }
      }

      // ✅ ACTUALIZAR BASE DE DATOS
      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          inspection_status: "damaged",
          deposit_status: "retained",
          damage_description: damageDescription,
          damage_cost: cost.toString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId)

      if (updateError) {
        console.error("❌ Database update error:", updateError)
        return NextResponse.json(
          {
            error: "Error updating booking",
            details: updateError.message,
          },
          { status: 500 },
        )
      }

      return NextResponse.json({
        success: true,
        message: stripeOperationSuccess
          ? "Fianza retenida correctamente en Stripe y base de datos"
          : "Fianza marcada como retenida en base de datos (Stripe no procesado)",
        captured: Math.min(cost, depositAmount),
        refunded: Math.max(0, depositAmount - cost),
        stripeProcessed: stripeOperationSuccess,
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("❌ Error processing deposit:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
