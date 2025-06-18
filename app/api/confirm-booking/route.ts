import { type NextRequest, NextResponse } from "next/server"
import stripe from "@/lib/stripe-config"
import { sendAdminNotification, sendCustomerConfirmation } from "@/lib/email"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      paymentIntentId,
      depositPaymentIntentId,
      paymentType = "full_payment",
      amountPaid,
      amountPending,
      liabilityWaiverId,
    } = body

    console.log("🔍 Confirming booking for payment:", paymentIntentId, {
      depositPaymentIntentId,
      paymentType,
      amountPaid,
      amountPending,
      liabilityWaiverId,
    })

    if (!stripe) {
      return NextResponse.json({ error: "Stripe configuration error" }, { status: 500 })
    }

    // ✅ OBTENER DATOS DEL PAYMENT INTENT PRINCIPAL
    const mainPaymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    console.log("💳 Main Payment Intent retrieved:", {
      id: mainPaymentIntent.id,
      amount: mainPaymentIntent.amount / 100,
      status: mainPaymentIntent.status,
      paymentType: mainPaymentIntent.metadata.paymentType,
      chargedAmount: mainPaymentIntent.metadata.chargedAmount,
      totalRentalAmount: mainPaymentIntent.metadata.totalRentalAmount,
      remainingAmount: mainPaymentIntent.metadata.remainingAmount,
    })

    // ✅ VERIFICAR PAGO PRINCIPAL
    if (mainPaymentIntent.status !== "succeeded") {
      return NextResponse.json({ error: "Main payment not completed" }, { status: 400 })
    }

    // ✅ CONFIRMAR DEPOSIT PAYMENT INTENT (solo para pago completo)
    const securityDeposit = Number.parseFloat(mainPaymentIntent.metadata.securityDeposit || "0")

    if (
      depositPaymentIntentId &&
      securityDeposit > 0 &&
      mainPaymentIntent.payment_method &&
      paymentType === "full_payment"
    ) {
      try {
        console.log("🛡️ Confirming deposit authorization:", depositPaymentIntentId)

        const depositIntent = await stripe.paymentIntents.retrieve(depositPaymentIntentId)
        console.log("🔍 Current deposit intent status:", depositIntent.status)

        if (depositIntent.status === "requires_payment_method") {
          const confirmedDepositIntent = await stripe.paymentIntents.confirm(depositPaymentIntentId, {
            payment_method: mainPaymentIntent.payment_method as string,
            return_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://oroboats.com"}/admin/bookings`,
          })

          console.log("✅ Deposit intent confirmed:", {
            id: confirmedDepositIntent.id,
            status: confirmedDepositIntent.status,
            amount: confirmedDepositIntent.amount / 100,
          })
        }
      } catch (depositError: any) {
        console.error("❌ Error confirming deposit authorization:", depositError)
        console.warn("⚠️ Continuing without deposit confirmation")
      }
    }

    // ✅ EXTRAER DATOS DEL METADATA CON MONTOS CORRECTOS
    const metadata = mainPaymentIntent.metadata
    console.log("🔍 Payment metadata:", metadata)

    const finalLiabilityWaiverId = liabilityWaiverId || metadata.liabilityWaiverId || null

    // ✅ ARREGLO CRÍTICO: USAR MONTOS CORRECTOS SEGÚN TIPO DE PAGO
    const totalRentalAmount = metadata.totalRentalAmount || metadata.rentalAmount || "0"
    const actualAmountPaid = metadata.chargedAmount || (mainPaymentIntent.amount / 100).toString()
    const actualAmountPending = metadata.remainingAmount || "0"

    console.log("💰 BOOKING AMOUNTS:", {
      totalRentalAmount,
      actualAmountPaid,
      actualAmountPending,
      paymentType,
      securityDeposit,
    })

    const bookingData = {
      customer_name: metadata.customerName || "Unknown",
      customer_email: metadata.customerEmail || "unknown@email.com",
      customer_phone: metadata.customerPhone || "",
      vehicle_id: Number.parseInt(metadata.vehicleId || "1"),
      vehicle_name: metadata.vehicleName || "Unknown Vehicle",
      booking_date: metadata.bookingDate || new Date().toISOString().split("T")[0],
      time_slot: `${metadata.startTime || "10:00"}-${metadata.endTime || "14:00"}`,
      start_time: metadata.startTime || "10:00",
      end_time: metadata.endTime || "14:00",
      duration: "4 horas",
      total_price: totalRentalAmount, // ✅ PRECIO TOTAL DEL ALQUILER
      security_deposit: metadata.securityDeposit || "0",
      status: "confirmed",
      payment_status: paymentType === "partial_payment" ? "partial_paid" : "completed",
      inspection_status: "pending",
      payment_id: paymentIntentId,
      deposit_payment_intent_id: depositPaymentIntentId,
      payment_type: paymentType,
      amount_paid: actualAmountPaid, // ✅ MONTO REALMENTE PAGADO
      amount_pending: actualAmountPending, // ✅ MONTO PENDIENTE
      liability_waiver_id: finalLiabilityWaiverId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // ✅ VALIDACIÓN DE DATOS CRÍTICOS
    const requiredFields: (keyof typeof bookingData)[] = [
      "customer_name",
      "customer_email",
      "vehicle_id",
      "booking_date",
    ]
    const missingFields = requiredFields.filter((field) => !bookingData[field])

    if (missingFields.length > 0) {
      console.error("❌ Missing required booking data:", missingFields)
      return NextResponse.json(
        {
          error: "Missing required booking data",
          missingFields,
        },
        { status: 400 },
      )
    }

    console.log("💾 Creating booking with CORRECTED amounts:", {
      totalPrice: bookingData.total_price,
      amountPaid: bookingData.amount_paid,
      amountPending: bookingData.amount_pending,
      paymentType: bookingData.payment_type,
      paymentStatus: bookingData.payment_status,
    })

    const { data: newBooking, error: newBookingError } = await supabase
      .from("bookings")
      .insert([bookingData])
      .select()
      .single()

    if (newBookingError) {
      console.error("❌ Error creating booking:", newBookingError)
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
    }

    console.log("✅ Booking created successfully:", {
      id: newBooking.id,
      totalPrice: newBooking.total_price,
      amountPaid: newBooking.amount_paid,
      amountPending: newBooking.amount_pending,
      paymentType: newBooking.payment_type,
    })

    // ✅ ENVIAR EMAILS CON MONTOS CORRECTOS
    try {
      const emailData = {
        bookingId: Number(newBooking.id),
        customerName: bookingData.customer_name,
        customerEmail: bookingData.customer_email,
        customerPhone: bookingData.customer_phone,
        vehicleName: bookingData.vehicle_name,
        bookingDate: bookingData.booking_date,
        startTime: bookingData.start_time,
        endTime: bookingData.end_time,
        totalPrice: Number(bookingData.total_price),
        securityDeposit: Number(bookingData.security_deposit),
        paymentType: paymentType,
        amountPaid: Number(bookingData.amount_paid), // ✅ MONTO CORRECTO
        amountPending: Number(bookingData.amount_pending), // ✅ MONTO CORRECTO
      }

      await sendAdminNotification(emailData)
      await sendCustomerConfirmation(emailData)
      console.log("✅ Booking emails sent with correct amounts")
    } catch (emailError) {
      console.error("⚠️ Error sending emails:", emailError)
    }

    return NextResponse.json({
      success: true,
      bookingId: newBooking.id,
      message: "Reserva confirmada con montos correctos",
      paymentInfo: {
        mainPaymentId: paymentIntentId,
        depositPaymentId: depositPaymentIntentId || null,
        totalRentalAmount: Number(totalRentalAmount),
        amountPaid: Number(actualAmountPaid),
        amountPending: Number(actualAmountPending),
        paymentType: paymentType,
        liabilityWaiverId: finalLiabilityWaiverId,
      },
    })
  } catch (error) {
    console.error("❌ Error confirming booking:", error)
    return NextResponse.json(
      {
        error: "Failed to confirm booking",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
