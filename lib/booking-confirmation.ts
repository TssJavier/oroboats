import stripe from "@/lib/stripe-config"
import { sendAdminNotification, sendCustomerConfirmation, sendCommercialNotification } from "@/lib/email"
import { supabaseAdmin } from "@/lib/db-supabase"
import { verifyHoldToken, releaseHoldById } from "@/lib/holds"
import { sendBookingPushNotification } from "@/lib/ntfy"

const supabase = supabaseAdmin

// Convierte "HH:MM" o "HH:MM:SS" a minutos desde medianoche
function toMin(t?: string | null): number {
  if (!t) return 0
  const [h, m] = String(t).split(":")
  return (Number.parseInt(h) || 0) * 60 + (Number.parseInt(m) || 0)
}

export type ConfirmBookingResult =
  | { outcome: "already_existed"; bookingId: number; response: Record<string, any> }
  | { outcome: "created"; bookingId: number; response: Record<string, any> }
  | { outcome: "overbooking_refunded"; response: Record<string, any> }
  | { outcome: "error"; status: number; response: Record<string, any> }

/**
 * Confirma (crea) la reserva a partir de un PaymentIntent de Stripe ya cobrado con éxito.
 *
 * Se usa desde DOS sitios:
 *  1. El flujo del navegador tras el pago (`/api/confirm-booking`, llamado por
 *     stripe-payment.tsx o por /booking-success tras una redirección de Bizum/Klarna).
 *  2. El webhook de Stripe (`/api/webhooks/stripe`), que actúa de red de seguridad: si el
 *     navegador del cliente nunca completa el paso 1 (pestaña cerrada, la app del banco no
 *     devuelve el control, red inestable...) el pago ya cobrado por Stripe igualmente
 *     termina creando la reserva y enviando los emails.
 *
 * Es idempotente: si ya existe una reserva con este payment_id, la devuelve tal cual en vez
 * de duplicarla (protegido también a nivel de BD con un índice único parcial sobre
 * bookings.payment_id, por si el navegador y el webhook llegan casi a la vez).
 */
export async function confirmBookingForPaymentIntent(
  paymentIntentId: string,
  overrides: {
    depositPaymentIntentId?: string | null
    paymentType?: "full_payment" | "partial_payment"
    liabilityWaiverId?: string | number | null
  } = {},
): Promise<ConfirmBookingResult> {
  if (!stripe) {
    return { outcome: "error", status: 500, response: { error: "Stripe configuration error" } }
  }

  // ✅ IDEMPOTENCIA: si ya existe una reserva para este payment_intent, devolverla
  const { data: existing } = await supabase.from("bookings").select("*").eq("payment_id", paymentIntentId).maybeSingle()

  if (existing) {
    console.log("ℹ️ Booking already exists for this payment_intent, returning existing:", existing.id)
    return {
      outcome: "already_existed",
      bookingId: existing.id,
      response: {
        success: true,
        bookingId: existing.id,
        alreadyExisted: true,
        message: "Reserva ya confirmada previamente",
        paymentInfo: {
          mainPaymentId: paymentIntentId,
          depositPaymentId: existing.deposit_payment_intent_id || null,
          totalRentalAmount: Number(existing.total_price),
          amountPaid: Number(existing.amount_paid),
          amountPending: Number(existing.amount_pending),
          paymentType: existing.payment_type,
          liabilityWaiverId: existing.liability_waiver_id,
        },
        bookingDetails: {
          customerEmail: existing.customer_email,
          bookingDate: existing.booking_date,
          startTime: existing.start_time,
          endTime: existing.end_time,
          vehicleName: existing.vehicle_name,
          totalPrice: Number(existing.total_price),
          securityDeposit: Number(existing.security_deposit || 0),
          paymentType: existing.payment_type,
          amountPaid: Number(existing.amount_paid),
          amountPending: Number(existing.amount_pending),
        },
      },
    }
  }

  // ✅ OBTENER DATOS DEL PAYMENT INTENT PRINCIPAL
  const mainPaymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
  console.log("💳 Main Payment Intent retrieved:", {
    id: mainPaymentIntent.id,
    amount: mainPaymentIntent.amount / 100,
    status: mainPaymentIntent.status,
  })

  // ✅ VERIFICAR PAGO PRINCIPAL
  if (mainPaymentIntent.status !== "succeeded") {
    console.error("❌ Main payment not completed. Status:", mainPaymentIntent.status)
    return { outcome: "error", status: 400, response: { error: "Main payment not completed" } }
  }

  const metadata = mainPaymentIntent.metadata
  const paymentType = overrides.paymentType || (metadata.paymentType as "full_payment" | "partial_payment") || "full_payment"
  const depositPaymentIntentId = overrides.depositPaymentIntentId ?? null

  // ✅ CONFIRMAR DEPOSIT PAYMENT INTENT (solo para pago completo, solo si nos lo pasan explícitamente)
  const securityDeposit = Number.parseFloat(metadata.securityDeposit || "0")
  if (depositPaymentIntentId && securityDeposit > 0 && mainPaymentIntent.payment_method && paymentType === "full_payment") {
    try {
      console.log("🛡️ Confirming deposit authorization:", depositPaymentIntentId)
      const depositIntent = await stripe.paymentIntents.retrieve(depositPaymentIntentId)
      if (depositIntent.status === "requires_payment_method") {
        const confirmedDepositIntent = await stripe.paymentIntents.confirm(depositPaymentIntentId, {
          payment_method: mainPaymentIntent.payment_method as string,
          return_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://oroboats.com"}/admin/bookings`,
        })
        console.log("✅ Deposit intent confirmed:", confirmedDepositIntent.id, confirmedDepositIntent.status)
      }
    } catch (depositError) {
      console.error("❌ Error confirming deposit authorization:", depositError)
      console.warn("⚠️ Continuing without deposit confirmation")
    }
  }

  const finalLiabilityWaiverId = overrides.liabilityWaiverId || metadata.liabilityWaiverId || null

  // ✅ MONTOS CORRECTOS SEGÚN TIPO DE PAGO (siempre desde el metadata del PaymentIntent)
  const totalRentalAmount = metadata.totalRentalAmount || metadata.rentalAmount || "0"
  const actualAmountPaid = metadata.chargedAmount || (mainPaymentIntent.amount / 100).toString()
  const actualAmountPending = metadata.remainingAmount || "0"

  // --- BEACH_LOCATION_ID Y NAME ---
  let beachLocationId: string | null = null
  let beachLocationName: string | null = null
  let vehicleStock = 1

  const vehicleId = Number(metadata.vehicleId || "0")

  if (vehicleId && vehicleId > 0) {
    const { data: vehicleData } = await supabase.from("vehicles").select("beach_location_id, stock").eq("id", vehicleId).single()

    if (vehicleData && vehicleData.stock != null) {
      vehicleStock = Number(vehicleData.stock) || 1
    }

    if (vehicleData && vehicleData.beach_location_id) {
      beachLocationId = vehicleData.beach_location_id

      const { data: locationData } = await supabase.from("locations").select("name").eq("id", beachLocationId).single()

      if (locationData && locationData.name) {
        beachLocationName = locationData.name
      }
    }
  }

  // ✅ COMPROBACIÓN FINAL DE DISPONIBILIDAD antes de crear la reserva (anti-overbooking).
  if (vehicleId && vehicleId > 0 && metadata.bookingDate && metadata.startTime && metadata.endTime) {
    const startMin = toMin(metadata.startTime)
    const endMin = toMin(metadata.endTime)

    const { data: sameDay } = await supabase
      .from("bookings")
      .select("id, start_time, end_time, status, payment_status")
      .eq("vehicle_id", vehicleId)
      .eq("booking_date", metadata.bookingDate)

    const overlapping = (sameDay || []).filter((b: any) => {
      if (b.status === "cancelled") return false
      if (b.payment_status === "hold") return false
      const s = toMin(b.start_time)
      const e = toMin(b.end_time)
      return startMin < e && endMin > s
    })

    if (overlapping.length >= vehicleStock) {
      console.error(
        `🚫 OVERBOOKING evitado: vehículo ${vehicleId} ya ocupado el ${metadata.bookingDate} ${metadata.startTime}-${metadata.endTime}. Solapadas: ${overlapping.length}/${vehicleStock}. Devolviendo el pago ${paymentIntentId}.`,
      )
      try {
        await stripe.refunds.create({ payment_intent: paymentIntentId })
        console.log("💸 Pago del alquiler devuelto automáticamente por overbooking")
      } catch (refErr) {
        console.error("❌ No se pudo devolver el pago automáticamente (revisar manualmente):", refErr)
      }
      if (depositPaymentIntentId) {
        try {
          const dep = await stripe.paymentIntents.retrieve(depositPaymentIntentId)
          if (dep.status === "requires_capture") await stripe.paymentIntents.cancel(depositPaymentIntentId)
          else if (dep.status === "succeeded") await stripe.refunds.create({ payment_intent: depositPaymentIntentId })
        } catch (e) {
          console.error("⚠️ No se pudo liberar la fianza tras overbooking:", e)
        }
      }
      return {
        outcome: "overbooking_refunded",
        response: {
          error: "overbooking",
          message:
            "Lo sentimos, ese horario acaba de ser reservado por otro cliente. Tu pago se ha devuelto automáticamente. Por favor, elige otro horario o contacta con nosotros.",
          refunded: true,
        },
      }
    }
  }

  const bookingData = {
    customer_name: metadata.customerName || "Unknown",
    customer_email: metadata.customerEmail || "unknown@email.com",
    customer_phone: metadata.customerPhone || "",
    customer_dni: metadata.customerDni || null,
    vehicle_id: vehicleId,
    vehicle_name: metadata.vehicleName || "Unknown Vehicle",
    vehicle_type: metadata.vehicleType || null,
    booking_date: metadata.bookingDate || new Date().toISOString().split("T")[0],
    time_slot: `${metadata.startTime || "10:00"}-${metadata.endTime || "14:00"}`,
    start_time: metadata.startTime || "10:00",
    end_time: metadata.endTime || "14:00",
    duration: metadata.duration || "4 horas",
    total_price: totalRentalAmount,
    security_deposit: metadata.securityDeposit || "0",
    status: "confirmed",
    payment_status: paymentType === "partial_payment" ? "partial_paid" : "completed",
    inspection_status: "pending",
    payment_id: paymentIntentId,
    deposit_payment_intent_id: depositPaymentIntentId,
    payment_type: paymentType,
    amount_paid: actualAmountPaid,
    amount_pending: actualAmountPending,
    liability_waiver_id: finalLiabilityWaiverId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    hotel_code: metadata.hotelCode || null,
    beach_location_id: beachLocationId,
    beach_location_name: beachLocationName,
  }

  const requiredFields: (keyof typeof bookingData)[] = ["customer_name", "customer_email", "vehicle_id", "booking_date"]
  const missingFields = requiredFields.filter((field) => !bookingData[field])
  if (missingFields.length > 0) {
    console.error("❌ Missing required booking data:", missingFields)
    return { outcome: "error", status: 400, response: { error: "Missing required booking data", missingFields } }
  }

  const { data: newBooking, error: newBookingError } = await supabase.from("bookings").insert([bookingData]).select().single()

  if (newBookingError) {
    // ✅ Protegido por índice único parcial en bookings.payment_id: si el navegador y el
    // webhook llegan casi a la vez, el segundo insert falla por violación de unicidad en vez
    // de crear una reserva duplicada. Nos recuperamos devolviendo la que ya se creó.
    if ((newBookingError as any).code === "23505") {
      console.log("ℹ️ Race detectada al insertar (payment_id duplicado), recuperando la reserva ya creada...")
      const { data: raceExisting } = await supabase.from("bookings").select("*").eq("payment_id", paymentIntentId).maybeSingle()
      if (raceExisting) {
        return {
          outcome: "already_existed",
          bookingId: raceExisting.id,
          response: {
            success: true,
            bookingId: raceExisting.id,
            alreadyExisted: true,
            message: "Reserva ya confirmada previamente",
            paymentInfo: {
              mainPaymentId: paymentIntentId,
              depositPaymentId: raceExisting.deposit_payment_intent_id || null,
              totalRentalAmount: Number(raceExisting.total_price),
              amountPaid: Number(raceExisting.amount_paid),
              amountPending: Number(raceExisting.amount_pending),
              paymentType: raceExisting.payment_type,
              liabilityWaiverId: raceExisting.liability_waiver_id,
            },
            bookingDetails: {
              customerEmail: raceExisting.customer_email,
              bookingDate: raceExisting.booking_date,
              startTime: raceExisting.start_time,
              endTime: raceExisting.end_time,
              vehicleName: raceExisting.vehicle_name,
              totalPrice: Number(raceExisting.total_price),
              securityDeposit: Number(raceExisting.security_deposit || 0),
              paymentType: raceExisting.payment_type,
              amountPaid: Number(raceExisting.amount_paid),
              amountPending: Number(raceExisting.amount_pending),
            },
          },
        }
      }
    }
    console.error("❌ Error creating booking:", newBookingError.message)
    return { outcome: "error", status: 500, response: { error: "Failed to create booking" } }
  }

  console.log("✅ Booking created successfully:", newBooking.id)

  // ✅ Si esta reserva viene de una URL de bloqueo comercial, liberar el bloqueo
  try {
    const holdId = verifyHoldToken(metadata.holdToken)
    if (holdId) {
      await releaseHoldById(holdId)
      console.log("🔓 Bloqueo comercial liberado tras el pago:", holdId)
    }
  } catch (holdError) {
    console.error("⚠️ Error liberando el bloqueo comercial (no crítico):", holdError)
  }

  // ✅ ENVIAR EMAILS
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
      amountPaid: Number(bookingData.amount_paid),
      amountPending: Number(bookingData.amount_pending),
      hotelCode: bookingData.hotel_code,
      beachLocationName: bookingData.beach_location_name,
    }
    console.log("📧 Sending booking confirmation emails...")
    await sendAdminNotification(emailData)
    await sendCustomerConfirmation(emailData)

    if (bookingData.hotel_code) {
      try {
        const { data: hotel } = await supabase
          .from("hotels")
          .select("name, commercial_email, notification_email")
          .eq("code", bookingData.hotel_code)
          .single()

        const notifyEmail = hotel?.notification_email || hotel?.commercial_email
        if (notifyEmail) {
          await sendCommercialNotification(emailData, notifyEmail, hotel.name)
        }
      } catch (commercialError) {
        console.error("⚠️ Error sending commercial notification:", commercialError)
      }
    }
  } catch (emailError) {
    console.error("⚠️ Error sending emails:", emailError)
  }

  // ✅ NOTIFICACIÓN PUSH AL EQUIPO
  await sendBookingPushNotification({
    bookingId: Number(newBooking.id),
    vehicleName: bookingData.vehicle_name,
    beachLocationName: bookingData.beach_location_name,
    bookingDate: bookingData.booking_date,
    timeRange: `${bookingData.start_time || ""}-${bookingData.end_time || ""}`.replace(/^-|-$/g, ""),
    customerName: bookingData.customer_name,
    customerPhone: bookingData.customer_phone,
    totalPrice: Number(bookingData.total_price),
    paymentLabel:
      paymentType === "partial_payment"
        ? `Parcial (${Number(actualAmountPaid)}€ online + ${Number(actualAmountPending)}€ en mano)`
        : "Online (pagado)",
  })

  return {
    outcome: "created",
    bookingId: newBooking.id,
    response: {
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
      bookingDetails: {
        customerEmail: bookingData.customer_email,
        bookingDate: bookingData.booking_date,
        startTime: bookingData.start_time,
        endTime: bookingData.end_time,
        vehicleName: bookingData.vehicle_name,
        totalPrice: Number(totalRentalAmount),
        securityDeposit: Number(bookingData.security_deposit || 0),
        paymentType: paymentType,
        amountPaid: Number(actualAmountPaid),
        amountPending: Number(actualAmountPending),
      },
    },
  }
}
