import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "tu-secreto-super-seguro-cambiar-en-produccion")

export async function POST(request: NextRequest) {
  try {
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
    } = body

    // Validaciones
    if (!vehicleId || !customerName || !customerPhone || !bookingDate || !timeSlot || !totalPrice) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Verificar que el vehículo existe
    const vehicleCheck = await db.execute(sql`
      SELECT id, name FROM vehicles WHERE id = ${vehicleId}
    `)

    if (!vehicleCheck || vehicleCheck.length === 0) {
      return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 })
    }

    // Verificar disponibilidad del horario
    const conflictCheck = await db.execute(sql`
      SELECT id FROM bookings 
      WHERE vehicle_id = ${vehicleId} 
      AND booking_date = ${bookingDate}
      AND (
        (start_time <= ${startTime} AND end_time > ${startTime}) OR
        (start_time < ${endTime} AND end_time >= ${endTime}) OR
        (start_time >= ${startTime} AND end_time <= ${endTime})
      )
      AND status != 'cancelled'
    `)

    if (conflictCheck && conflictCheck.length > 0) {
      return NextResponse.json({ error: "Ya existe una reserva en ese horario" }, { status: 409 })
    }

    // Calcular duración en minutos
    const start = new Date(`2000-01-01T${startTime}`)
    const end = new Date(`2000-01-01T${endTime}`)
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60)

    // Crear la reserva manual
    const result = await db.execute(sql`
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
        created_at,
        updated_at
      ) VALUES (
        ${vehicleId},
        ${customerName},
        ${customerEmail},
        ${customerPhone},
        ${bookingDate},
        ${timeSlot},
        ${startTime},
        ${endTime},
        ${duration || "30min"},
        ${durationMinutes},
        ${totalPrice},
        ${totalPrice},
        'confirmed',
        'manual',
        ${notes || ""},
        ${isManualBooking},
        NOW(),
        NOW()
      )
      RETURNING id
    `)

    const bookingId = result[0]?.id

    if (!bookingId) {
      throw new Error("Error al crear la reserva")
    }

    console.log("✅ Manual booking created with ID:", bookingId)

    return NextResponse.json({
      success: true,
      bookingId,
      message: "Reserva manual creada correctamente",
    })
  } catch (error) {
    console.error("❌ Error creating manual booking:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
