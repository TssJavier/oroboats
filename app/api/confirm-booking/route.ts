import { type NextRequest, NextResponse } from "next/server"
import stripe from "@/lib/stripe-config"
import { createBooking } from "@/lib/db/queries"
import { sendAdminNotification, sendCustomerConfirmation } from "@/lib/email"
import { db } from "@/lib/db"
import { discountCodes, discountUsage } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId } = await request.json()
    console.log("🔍 Confirming booking for payment:", paymentIntentId)

    // Verificar el pago en Stripe
    if (!stripe) {
      return NextResponse.json({ error: "Stripe configuration error" }, { status: 500 })
    }
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 })
    }

    // Extraer datos de reserva del metadata
    const bookingData = JSON.parse(paymentIntent.metadata.bookingData)
    console.log("📅 Creating booking with confirmed payment:", bookingData)
    console.log("🔍 Liability Waiver ID in booking data:", bookingData.liabilityWaiverId)

    // Añadir información de pago
    const finalBookingData = {
      ...bookingData,
      paymentId: paymentIntentId,
      paymentStatus: "completed",
      status: "confirmed",
    }

    // Crear la reserva en la base de datos
    const booking = await createBooking(finalBookingData)
    console.log("✅ Booking created after payment:", booking[0])

    // ✅ ACTUALIZAR EL LIABILITY_WAIVER_ID EN LA RESERVA
    if (bookingData.liabilityWaiverId && booking[0]) {
      try {
        const bookingId = Number(booking[0].id)
        const waiverId = Number(bookingData.liabilityWaiverId)

        console.log(`🔗 Updating booking ${bookingId} with liability waiver ${waiverId}`)

        await db.execute(sql`
          UPDATE bookings 
          SET liability_waiver_id = ${waiverId}
          WHERE id = ${bookingId}
        `)

        // También actualizar el waiver con el booking_id
        await db.execute(sql`
          UPDATE liability_waivers 
          SET booking_id = ${bookingId}
          WHERE id = ${waiverId}
        `)

        console.log("✅ Liability waiver association updated successfully")
      } catch (error) {
        console.error("❌ Error updating liability waiver association:", error)
      }
    } else {
      console.log("⚠️ No liability waiver ID provided or booking creation failed")
    }

    // Actualizar código de descuento si se usó
    if (bookingData.discountCode && booking[0]) {
      try {
        const discountCode = await db.query.discountCodes.findFirst({
          where: eq(discountCodes.code, bookingData.discountCode),
        })

        if (discountCode) {
          await db
            .update(discountCodes)
            .set({
              usedCount: (discountCode.usedCount ?? 0) + 1,
            })
            .where(eq(discountCodes.id, discountCode.id))

          // ✅ CORREGIR TIPOS Y NOMBRES DE COLUMNAS
          await db.insert(discountUsage).values({
            discountCodeId: Number(discountCode.id), // Asegurar que es number
            bookingId: Number(booking[0].id), // Asegurar que es number
            customerEmail: String(bookingData.customerEmail), // Asegurar que es string
            discountAmount: String(bookingData.discountAmount || 0), // Asegurar que es string
            usedAt: new Date(), // Añadir timestamp
          })

          console.log("✅ Discount code usage recorded successfully")
        }
      } catch (error) {
        console.error("⚠️ Error updating discount code:", error)
      }
    }

    // Obtener nombre del vehículo
    let vehicleName = "Vehículo"
    try {
      const vehicleData = await db.query.vehicles.findFirst({
        where: (vehicles, { eq }) => eq(vehicles.id, Number(bookingData.vehicleId)),
      })
      vehicleName = vehicleData?.name || "Vehículo"
    } catch (error) {
      console.error("⚠️ Error fetching vehicle data:", error)
    }

    // Enviar emails de confirmación
    const emailData = {
      bookingId: Number(booking[0].id),
      customerName: bookingData.customerName,
      customerEmail: bookingData.customerEmail,
      customerPhone: bookingData.customerPhone,
      vehicleName: vehicleName,
      bookingDate: bookingData.bookingDate,
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
      totalPrice: bookingData.totalPrice,
      discountAmount: bookingData.discountAmount > 0 ? bookingData.discountAmount : undefined,
      originalPrice: bookingData.discountAmount > 0 ? bookingData.originalPrice : undefined,
      discountCode: bookingData.discountCode || undefined,
      securityDeposit: bookingData.securityDeposit || 0,
    }

    // Enviar emails (no bloquear si fallan)
    sendAdminNotification(emailData).catch((error) => {
      console.error("⚠️ Failed to send admin notification:", error)
    })

    sendCustomerConfirmation(emailData).catch((error) => {
      console.error("⚠️ Failed to send customer confirmation:", error)
    })

    return NextResponse.json({
      success: true,
      booking: booking[0],
      message: "Reserva confirmada y pago procesado exitosamente",
    })
  } catch (error) {
    console.error("❌ Error confirming booking:", error)
    return NextResponse.json({ error: "Failed to confirm booking" }, { status: 500 })
  }
}
