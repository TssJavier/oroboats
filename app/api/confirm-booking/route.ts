import { type NextRequest, NextResponse } from "next/server"
import stripe from "@/lib/stripe-config" // Asumo que este es tu cliente Stripe configurado
import { sendAdminNotification, sendCustomerConfirmation } from "@/lib/email"
import { supabaseAdmin } from "@/lib/db-supabase"

const supabase = supabaseAdmin

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
      console.error("❌ Stripe configuration error: Stripe client is not initialized.")
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
      console.error("❌ Main payment not completed. Status:", mainPaymentIntent.status)
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

    // --- NUEVA LÓGICA PARA OBTENER BEACH_LOCATION_ID Y NAME CON SUPABASE ---
    let beachLocationId: string | null = null
    let beachLocationName: string | null = null

    const vehicleId = Number(metadata.vehicleId || "0") // Asegúrate de que vehicleId sea un número
    console.log("🔍 Attempting to get beach location for vehicleId from metadata:", vehicleId)

    if (vehicleId && vehicleId > 0) {
      const { data: vehicleData, error: vehicleError } = await supabase
        .from("vehicles")
        .select("beach_location_id")
        .eq("id", vehicleId)
        .single()

      console.log("🔍 Supabase vehicle lookup result:", vehicleData)
      if (vehicleError) {
        console.error("❌ Supabase error fetching vehicle:", vehicleError.message)
      }

      if (vehicleData && vehicleData.beach_location_id) {
        beachLocationId = vehicleData.beach_location_id
        console.log("🏖️ Found beachLocationId from vehicle:", beachLocationId)

        const { data: locationData, error: locationError } = await supabase
          .from("locations")
          .select("name")
          .eq("id", beachLocationId)
          .single()

        console.log("🔍 Supabase location lookup result:", locationData)
        if (locationError) {
          console.error("❌ Supabase error fetching location:", locationError.message)
        }

        if (locationData && locationData.name) {
          beachLocationName = locationData.name
          console.log("🏖️ Found beach location name:", beachLocationName)
        } else {
          console.warn("⚠️ Beach location name not found in 'locations' for ID:", beachLocationId)
        }
      } else {
        console.warn("⚠️ Vehicle not found or beach_location_id is null for vehicleId:", vehicleId)
      }
    } else {
      console.warn("⚠️ No valid vehicleId provided in payment metadata. Cannot fetch beach location.")
    }
    // --- FIN NUEVA LÓGICA ---

    const bookingData = {
      customer_name: metadata.customerName || "Unknown",
      customer_email: metadata.customerEmail || "unknown@email.com",
      customer_phone: metadata.customerPhone || "",
      customer_dni: metadata.customerDni || null, // Asegúrate de que DNI se pase si existe
      vehicle_id: vehicleId, // Usar el vehicleId numérico
      vehicle_name: metadata.vehicleName || "Unknown Vehicle",
      vehicle_type: metadata.vehicleType || null, // Asegúrate de que vehicleType se pase si existe
      booking_date: metadata.bookingDate || new Date().toISOString().split("T")[0],
      time_slot: `${metadata.startTime || "10:00"}-${metadata.endTime || "14:00"}`,
      start_time: metadata.startTime || "10:00",
      end_time: metadata.endTime || "14:00",
      duration: metadata.duration || "4 horas", // Asegúrate de que duration se pase si existe
      total_price: totalRentalAmount, // ✅ PRECIO TOTAL DEL ALQUILER
      security_deposit: metadata.securityDeposit || "0",
      status: "confirmed", // O el estado que corresponda
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
      hotel_code: metadata.hotelCode || null, // Asegúrate de que hotelCode se pase si existe
      beach_location_id: beachLocationId, // ✅ AÑADIDO
      beach_location_name: beachLocationName, // ✅ AÑADIDO
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

    console.log("💾 Creating booking with CORRECTED amounts and beach info:", {
      totalPrice: bookingData.total_price,
      amountPaid: bookingData.amount_paid,
      amountPending: bookingData.amount_pending,
      paymentType: bookingData.payment_type,
      paymentStatus: bookingData.payment_status,
      beachLocationId: bookingData.beach_location_id, // Log para verificar
      beachLocationName: bookingData.beach_location_name, // Log para verificar
    })

    const { data: newBooking, error: newBookingError } = await supabase
      .from("bookings")
      .insert([bookingData])
      .select()
      .single()

    if (newBookingError) {
      console.error("❌ Error creating booking:", newBookingError.message)
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
    }

    console.log("✅ Booking created successfully:", {
      id: newBooking.id,
      totalPrice: newBooking.total_price,
      amountPaid: newBooking.amount_paid,
      amountPending: newBooking.amount_pending,
      paymentType: newBooking.payment_type,
      beachLocationId: newBooking.beach_location_id, // Log para verificar
      beachLocationName: newBooking.beach_location_name, // Log para verificar
    })

    // ✅ ENVIAR EMAILS CON MONTOS CORRECTOS Y DATOS DE PLAYA
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
        hotelCode: bookingData.hotel_code, // Incluir hotelCode
        beachLocationName: bookingData.beach_location_name, // ✅ AÑADIDO
      }
      console.log("📧 Sending booking confirmation emails...")
      await sendAdminNotification(emailData)
      console.log("✅ Admin notification sent")
      await sendCustomerConfirmation(emailData)
      console.log("✅ Customer confirmation sent")
    } catch (emailError) {
      console.error("⚠️ Error sending emails:", emailError)
    }

    return NextResponse.json({
      success: true,
      bookingId: newBooking.id,
      message: "Reserva confirmada con montos correctos y ubicación de playa",
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
