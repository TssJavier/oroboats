import { type NextRequest, NextResponse } from "next/server"
import stripe from "@/lib/stripe-config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, securityDeposit = 0, paymentType, bookingData } = body

    console.log("🔄 PAYMENT INTENT - Input data:", {
      totalRentalAmount: amount,
      securityDeposit,
      paymentType,
      strategy: "AMOUNT_BASED_ON_PAYMENT_TYPE",
    })

    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
    }

    // ✅ ARREGLO CRÍTICO: CALCULAR MONTO CORRECTO SEGÚN TIPO DE PAGO
    let actualChargeAmount = amount // Por defecto, pago completo

    if (paymentType === "partial_payment") {
      // Detectar tipo de vehículo para determinar el pago parcial
      const isJetski =
        bookingData?.vehicleType === "jetski" ||
        bookingData?.vehicleCategory?.toLowerCase().includes("jetski") ||
        bookingData?.vehicleName?.toLowerCase().includes("jetski") ||
        bookingData?.vehicleName?.toLowerCase().includes("moto")

      const vehicleType = isJetski ? "jetski" : "boat"
      actualChargeAmount = vehicleType === "jetski" ? 50 : 100

      console.log("💰 PARTIAL PAYMENT DETECTED:", {
        vehicleType,
        totalAmount: amount,
        chargeNow: actualChargeAmount,
        remainingAmount: amount - actualChargeAmount,
      })
    }

    // ✅ PAYMENT INTENT 1: MONTO CORRECTO SEGÚN TIPO DE PAGO
    console.log("💳 Creating RENTAL payment intent for:", actualChargeAmount)
    const rentalPaymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(actualChargeAmount * 100), // ✅ USAR MONTO CORRECTO
      currency: "eur",
      payment_method_types: ["card"],
      metadata: {
        bookingId: bookingData?.id || "debug",
        type: paymentType === "partial_payment" ? "PARTIAL_RENTAL_PAYMENT" : "FULL_RENTAL_PAYMENT",
        customerName: bookingData?.customerName || "Debug User",
        customerEmail: bookingData?.customerEmail || "debug@test.com",
        customerPhone: bookingData?.customerPhone || "",
        vehicleId: bookingData?.vehicleId?.toString() || "1",
        vehicleName: bookingData?.vehicleName || "Unknown Vehicle",
        bookingDate: bookingData?.bookingDate || new Date().toISOString().split("T")[0],
        startTime: bookingData?.startTime || "10:00",
        endTime: bookingData?.endTime || "14:00",
        totalRentalAmount: amount.toString(), // ✅ PRECIO TOTAL DEL ALQUILER
        chargedAmount: actualChargeAmount.toString(), // ✅ MONTO COBRADO AHORA
        remainingAmount: (amount - actualChargeAmount).toString(), // ✅ MONTO PENDIENTE
        securityDeposit: securityDeposit.toString(),
        paymentType: paymentType,
        liabilityWaiverId: bookingData?.liabilityWaiverId?.toString() || "",
        debug: paymentType === "partial_payment" ? "PARTIAL_PAYMENT_INTENT" : "FULL_PAYMENT_INTENT",
      },
    })

    // ✅ PAYMENT INTENT 2: FIANZA (solo si es pago completo)
    let depositAuthIntent = null
    if (securityDeposit > 0 && paymentType === "full_payment") {
      console.log("🛡️ Creating DEPOSIT authorization:", securityDeposit)
      depositAuthIntent = await stripe.paymentIntents.create({
        amount: Math.round(securityDeposit * 100),
        currency: "eur",
        payment_method_types: ["card"],
        capture_method: "manual", // ✅ SOLO AUTORIZAR, NO CAPTURAR
        metadata: {
          bookingId: bookingData?.id || "debug",
          type: "DEPOSIT_AUTHORIZATION",
          customerName: bookingData?.customerName || "Debug User",
          customerEmail: bookingData?.customerEmail || "debug@test.com",
          depositAmount: securityDeposit.toString(),
          relatedRentalIntent: rentalPaymentIntent.id,
          paymentType: paymentType,
          liabilityWaiverId: bookingData?.liabilityWaiverId?.toString() || "",
          debug: "DEPOSIT_AUTH_INTENT",
        },
      })
    }

    console.log("✅ PAYMENT INTENTS CREATED:", {
      rental: {
        id: rentalPaymentIntent.id,
        chargedAmount: actualChargeAmount,
        totalRentalAmount: amount,
        remainingAmount: amount - actualChargeAmount,
        paymentType: paymentType,
        status: rentalPaymentIntent.status,
      },
      deposit: depositAuthIntent
        ? {
            id: depositAuthIntent.id,
            amount: depositAuthIntent.amount / 100,
            status: depositAuthIntent.status,
            captureMethod: depositAuthIntent.capture_method,
          }
        : null,
    })

    return NextResponse.json({
      // ✅ DEVOLVER CLIENT SECRETS
      clientSecret: rentalPaymentIntent.client_secret,
      paymentIntentId: rentalPaymentIntent.id,

      // ✅ INFO DE FIANZA (solo para pago completo)
      depositClientSecret: depositAuthIntent?.client_secret || null,
      depositPaymentIntentId: depositAuthIntent?.id || null,

      // ✅ DEBUG INFO ACTUALIZADO
      debug: {
        strategy: "AMOUNT_BASED_ON_PAYMENT_TYPE",
        paymentType: paymentType,
        totalRentalAmount: amount,
        chargedNow: actualChargeAmount,
        remainingAmount: amount - actualChargeAmount,
        depositAmount: securityDeposit,
        depositHandling: paymentType === "full_payment" ? "online_authorization" : "on_site_cash",
        liabilityWaiverId: bookingData?.liabilityWaiverId || null,
      },

      environment: process.env.NODE_ENV === "production" ? "production" : "development",
    })
  } catch (error) {
    console.error("❌ Error creating payment intents:", error)
    return NextResponse.json(
      {
        error: "Payment intent creation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
