import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "tu-secreto-super-seguro-cambiar-en-produccion")

export async function POST(request: NextRequest) {
  try {
    console.log("🛡️ Manual booking API started")

    // Verificar autenticación de admin
    const token = request.cookies.get("admin-token")?.value

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    try {
      await jwtVerify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const body = await request.json()
    console.log("📝 Creating manual booking:", body)

    const {
      vehicleId,
      customerName,
      customerPhone,
      customerEmail,
      bookingDate,
      timeSlot,
      startTime,
      endTime,
      duration,
      totalPrice,
      notes,
      isManualBooking = true,
      salesPerson,
      vehicleName,
      vehicleType,
      liabilityWaiverId, // 🆕 NUEVO: ID del documento de exención firmado
      paymentMethod, // ✅ NUEVO: Método de pago (cash o card)
    } = body

    // Validaciones básicas
    if (!vehicleId || !customerName || !customerPhone || !bookingDate || !timeSlot || !totalPrice) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    if (!salesPerson) {
      return NextResponse.json({ error: "Debe seleccionar un comercial" }, { status: 400 })
    }

    if (!startTime || !endTime) {
      return NextResponse.json({ error: "Faltan horarios de inicio y fin" }, { status: 400 })
    }

    // ✅ NUEVO: Validar método de pago
    if (!paymentMethod || (paymentMethod !== "cash" && paymentMethod !== "card")) {
      return NextResponse.json({ error: "Método de pago inválido" }, { status: 400 })
    }

    // 🆕 NUEVO: Validar que el documento de exención esté firmado (opcional pero recomendado)
    if (liabilityWaiverId) {
      console.log(`🔍 Verifying liability waiver ID: ${liabilityWaiverId}`)

      const waiverResult = await db.execute(sql`
        SELECT id, customer_name, customer_email, signed_at 
        FROM liability_waivers 
        WHERE id = ${liabilityWaiverId}
      `)

      if (!waiverResult || waiverResult.length === 0) {
        return NextResponse.json({ error: "Documento de exención no encontrado" }, { status: 404 })
      }

      const waiver = waiverResult[0]
      console.log(`✅ Verified waiver for ${waiver.customer_name} signed at ${waiver.signed_at}`)
    } else {
      console.log("⚠️ No liability waiver provided - proceeding without waiver")
    }

    // Verificar que el vehículo existe y obtener su información
    console.log(`🔍 Checking vehicle ${vehicleId}...`)

    const vehicleResult = await db.execute(sql`
      SELECT id, name, type, stock FROM vehicles WHERE id = ${vehicleId}
    `)

    if (!vehicleResult || vehicleResult.length === 0) {
      return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 })
    }

    const vehicle = vehicleResult[0]
    const vehicleStock = typeof vehicle.stock === "number" ? vehicle.stock : 1

    console.log(`📊 Vehicle ${vehicleId} (${vehicle.name}) has stock: ${vehicleStock}`)

    // ✅ VERIFICAR DISPONIBILIDAD CON STOCK
    console.log(`🔍 Checking availability for slot: ${timeSlot} on ${bookingDate}`)

    const existingBookingsResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM bookings 
      WHERE vehicle_id = ${vehicleId} 
      AND booking_date = ${bookingDate}
      AND time_slot = ${timeSlot}
      AND status IN ('confirmed', 'completed', 'pending')
    `)

    const bookingsCount = Number(existingBookingsResult[0]?.count || 0)

    console.log(`📊 Existing bookings for this slot: ${bookingsCount}/${vehicleStock}`)

    // Si ya hay tantas reservas como stock disponible, rechazamos
    if (bookingsCount >= vehicleStock) {
      return NextResponse.json(
        {
          error: "No hay suficiente stock disponible para este horario",
          details: `Stock disponible: ${vehicleStock}, Reservas existentes: ${bookingsCount}`,
        },
        { status: 409 },
      )
    }

    // ✅ CALCULAR DURACIÓN CORRECTAMENTE
    let durationMinutes = 30 // Valor por defecto
    let finalDuration = duration || "30min"

    try {
      const startParts = startTime.split(":").map(Number)
      const endParts = endTime.split(":").map(Number)

      const startMinutes = startParts[0] * 60 + startParts[1]
      const endMinutes = endParts[0] * 60 + endParts[1]

      durationMinutes = endMinutes - startMinutes

      // Asignar duración basada en minutos calculados
      if (durationMinutes <= 30) {
        finalDuration = "30min"
      } else if (durationMinutes <= 60) {
        finalDuration = "1hour"
      } else if (durationMinutes <= 120) {
        finalDuration = "2hour"
      } else if (durationMinutes <= 240) {
        finalDuration = "halfday"
      } else {
        finalDuration = "fullday"
      }

      console.log(`⏱️ Calculated duration: ${durationMinutes} minutes = ${finalDuration}`)
    } catch (error) {
      console.log("⚠️ Error calculating duration, using provided value:", duration)
      finalDuration = duration || "30min"
    }

    // ✅ CREAR LA RESERVA MANUAL
    console.log("💾 Creating booking in database...")

    try {
      const insertResult = await db.execute(sql`
        INSERT INTO bookings (
          vehicle_id,
          customer_name,
          customer_email,
          customer_phone,
          booking_date,
          time_slot,
          start_time,
          end_time,
          duration,
          duration_minutes,
          total_price,
          original_price,
          status,
          payment_status,
          notes,
          is_manual_booking,
          sales_person,
          vehicle_name,
          vehicle_type,
          liability_waiver_id,
          payment_method, /* ✅ NUEVO: Campo para método de pago */
          created_at,
          updated_at
        ) VALUES (
          ${vehicleId},
          ${customerName},
          ${customerEmail || `${customerName.replace(/\s+/g, "").toLowerCase()}@manual.booking`},
          ${customerPhone},
          ${bookingDate},
          ${timeSlot},
          ${startTime},
          ${endTime},
          ${finalDuration},
          ${durationMinutes},
          ${totalPrice},
          ${totalPrice},
          'confirmed',
          'manual',
          ${notes || ""},
          ${isManualBooking},
          ${salesPerson},
          ${vehicleName || vehicle.name},
          ${vehicleType || vehicle.type},
          ${liabilityWaiverId || null},
          ${paymentMethod}, /* ✅ NUEVO: Guardar método de pago */
          NOW(),
          NOW()
        )
        RETURNING id
      `)

      const bookingId = insertResult[0]?.id

      if (!bookingId) {
        throw new Error("No se pudo obtener el ID de la reserva creada")
      }

      // 🆕 NUEVO: Si hay un waiver asociado, actualizar la relación bidireccional
      if (liabilityWaiverId) {
        try {
          await db.execute(sql`
            UPDATE liability_waivers 
            SET booking_id = ${bookingId}
            WHERE id = ${liabilityWaiverId}
          `)
          console.log(`✅ Updated liability waiver ${liabilityWaiverId} with booking ID ${bookingId}`)
        } catch (waiverUpdateError) {
          console.error("⚠️ Warning: Could not update waiver with booking ID:", waiverUpdateError)
          // No fallar la reserva por esto, solo logear el warning
        }
      }

      console.log("✅ Manual booking created successfully!")
      console.log(`   - Booking ID: ${bookingId}`)
      console.log(`   - Customer: ${customerName}`)
      console.log(`   - Vehicle: ${vehicleName || vehicle.name} (${vehicleType || vehicle.type})`)
      console.log(`   - Sales Person: ${salesPerson}`)
      console.log(`   - Date: ${bookingDate}`)
      console.log(`   - Time: ${timeSlot}`)
      console.log(`   - Duration: ${finalDuration} (${durationMinutes} min)`)
      console.log(`   - Price: €${totalPrice}`)
      console.log(`   - Payment Method: ${paymentMethod}`) // ✅ NUEVO: Loguear método de pago
      console.log(`   - Liability Waiver: ${liabilityWaiverId ? `ID ${liabilityWaiverId}` : "None"}`)
      console.log(`   - Remaining stock: ${vehicleStock - bookingsCount - 1}`)

      return NextResponse.json({
        success: true,
        bookingId,
        message: "Reserva manual creada correctamente",
        details: {
          customerName,
          vehicleName: vehicleName || vehicle.name,
          vehicleType: vehicleType || vehicle.type,
          salesPerson,
          bookingDate,
          timeSlot,
          duration: finalDuration,
          durationMinutes,
          totalPrice,
          paymentMethod, // ✅ NUEVO: Incluir método de pago en la respuesta
          availableStock: vehicleStock - bookingsCount - 1,
          totalStock: vehicleStock,
          liabilityWaiverId: liabilityWaiverId || null, // 🆕 NUEVO: Incluir en la respuesta
        },
      })
    } catch (dbError) {
      console.error("❌ Database error creating booking:", dbError)
      return NextResponse.json(
        {
          error: "Error al crear la reserva en la base de datos",
          details: dbError instanceof Error ? dbError.message : "Error de base de datos desconocido",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("❌ Server error in manual booking:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
