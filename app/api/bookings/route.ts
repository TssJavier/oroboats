import { type NextRequest, NextResponse } from "next/server"
import { createBooking, getBookings } from "@/lib/db/queries"
import { db } from "@/lib/db"
import { discountCodes, discountUsage } from "@/lib/db/schema"
import { eq, and, lte, gte, or, isNull } from "drizzle-orm"
import { sendAdminNotification, sendCustomerConfirmation } from "@/lib/email"

export async function GET(request: NextRequest) {
  try {
    console.log("📅 API: Fetching bookings...")
    const bookings = await getBookings()
    console.log(`✅ API: Found ${bookings.length} bookings`)

    return NextResponse.json(bookings)
  } catch (error) {
    console.error("❌ API Error fetching bookings:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch bookings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("📅 API: Creating booking...")
    const body = await request.json()
    console.log("📅 API: Received data:", body)

    // ✅ MANTENER TU VALIDACIÓN ORIGINAL DE FECHAS
    const bookingDate = new Date(body.bookingDate)
    const startTime = body.startTime
    const [hours, minutes] = startTime.split(":").map(Number)
    bookingDate.setHours(hours)
    bookingDate.setMinutes(minutes)

    if (bookingDate < new Date()) {
      console.log("❌ Booking in the past")
      return NextResponse.json({ error: "No puedes reservar en el pasado" }, { status: 400 })
    }

    // ✅ NUEVA FUNCIONALIDAD: VALIDAR CÓDIGO DE DESCUENTO
    let discountAmount = 0
    const originalPrice = body.totalPrice
    let validDiscountCode = null

    if (body.discountCode) {
      console.log(`🎫 Validating discount code: ${body.discountCode}`)

      const discountCode = await db.query.discountCodes.findFirst({
        where: and(
          eq(discountCodes.code, body.discountCode),
          eq(discountCodes.active, true),
          or(isNull(discountCodes.validFrom), lte(discountCodes.validFrom, new Date())),
          or(isNull(discountCodes.validUntil), gte(discountCodes.validUntil, new Date())),
        ),
      })

      if (!discountCode) {
        console.log("❌ Invalid discount code")
        return NextResponse.json({ error: "Código de descuento inválido o expirado" }, { status: 400 })
      }

      // Verificar límite de usos
      if (
        discountCode.maxUses &&
        typeof discountCode.usedCount === "number" &&
        discountCode.usedCount >= discountCode.maxUses
      ) {
        console.log("❌ Discount code usage limit exceeded")
        return NextResponse.json({ error: "Código de descuento agotado" }, { status: 400 })
      }

      // Verificar monto mínimo
      if (
        discountCode.minAmount !== null &&
        typeof discountCode.minAmount === "number" &&
        body.totalPrice < discountCode.minAmount
      ) {
        console.log("❌ Minimum amount not met")
        return NextResponse.json(
          {
            error: `Monto mínimo para este código: €${discountCode.minAmount}`,
          },
          { status: 400 },
        )
      }

      // Calcular descuento
      if (discountCode.discountType === "percentage") {
        discountAmount = (body.totalPrice * Number(discountCode.discountValue)) / 100
      } else {
        discountAmount = Number(discountCode.discountValue)
      }

      // No puede ser mayor al precio total
      discountAmount = Math.min(discountAmount, body.totalPrice)
      validDiscountCode = discountCode

      console.log(`✅ Discount applied: €${discountAmount}`)
    }

    // ✅ PREPARAR DATOS PARA TU FUNCIÓN ORIGINAL - AÑADIENDO timeSlot y securityDeposit
    const bookingData = {
      ...body,
      timeSlot: body.timeSlot || `${body.startTime}-${body.endTime}`,
      discountCode: body.discountCode || null,
      discountAmount: discountAmount,
      originalPrice: originalPrice,
      totalPrice: originalPrice - discountAmount, // Precio final con descuento
      securityDeposit: body.securityDeposit || 0, // ✅ AÑADIDO: Asegurar que la fianza se guarda
      depositPaymentIntentId: body.depositPaymentIntentId || null, // ✅ AÑADIDO: ID del pago de la fianza
      inspectionStatus: "pending", // ✅ AÑADIDO: Estado inicial de la inspección
    }

    console.log("📅 API: Prepared booking data:", bookingData)

    // ✅ USAR TU FUNCIÓN ORIGINAL PARA CREAR LA RESERVA
    const booking = await createBooking(bookingData)
    console.log("✅ API: Booking created successfully", booking[0])

    // ✅ NUEVA FUNCIONALIDAD: ACTUALIZAR CONTADOR DE CÓDIGO DE DESCUENTO
    if (validDiscountCode && booking[0]) {
      try {
        // Incrementar contador
        await db
          .update(discountCodes)
          .set({
            usedCount: (validDiscountCode.usedCount ?? 0) + 1,
          })
          .where(eq(discountCodes.id, validDiscountCode.id))

        // Registrar uso - CORREGIDO: Asegurar que bookingId es un número
        await db.insert(discountUsage).values({
          discountCodeId: validDiscountCode.id,
          bookingId: Number(booking[0].id), // ✅ CORREGIDO: Convertir explícitamente a número
          customerEmail: body.customerEmail,
          discountAmount: discountAmount.toString(),
        })

        console.log("✅ Discount code usage updated")
      } catch (error) {
        console.error("⚠️ Error updating discount code usage:", error)
        // No fallar la reserva por esto
      }
    }

    // ✅ NUEVA FUNCIONALIDAD: OBTENER DATOS DEL VEHÍCULO PARA EMAILS
    let vehicleName = "Vehículo"
    try {
      const vehicleData = await db.query.vehicles.findFirst({
        where: (vehicles, { eq }) => eq(vehicles.id, Number.parseInt(body.vehicleId)),
      })
      vehicleName = vehicleData?.name || "Vehículo"
    } catch (error) {
      console.error("⚠️ Error fetching vehicle data:", error)
    }

    // ✅ NUEVA FUNCIONALIDAD: ENVIAR EMAILS (NO BLOQUEAR SI FALLAN)
    const emailData = {
      bookingId: Number(booking[0].id), // ✅ CORREGIDO: Convertir explícitamente a número
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      vehicleName: vehicleName,
      bookingDate: body.bookingDate,
      startTime: body.startTime,
      endTime: body.endTime,
      totalPrice: originalPrice - discountAmount,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      originalPrice: discountAmount > 0 ? originalPrice : undefined,
      discountCode: body.discountCode || undefined,
      securityDeposit: body.securityDeposit || 0, // ✅ AÑADIDO: Incluir fianza en el email
    }

    // Email al admin (no bloquear si falla)
    sendAdminNotification(emailData).catch((error) => {
      console.error("⚠️ Failed to send admin notification:", error)
    })

    // Email al cliente (no bloquear si falla)
    sendCustomerConfirmation(emailData).catch((error) => {
      console.error("⚠️ Failed to send customer confirmation:", error)
    })

    console.log("📧 Email notifications queued")

    return NextResponse.json(
      {
        ...booking[0],
        discountApplied: discountAmount > 0,
        discountAmount: discountAmount,
        originalPrice: originalPrice,
        finalPrice: originalPrice - discountAmount,
        securityDeposit: body.securityDeposit || 0, // ✅ AÑADIDO: Devolver fianza en la respuesta
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("❌ API Error creating booking:", error)
    return NextResponse.json(
      {
        error: "Failed to create booking",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
