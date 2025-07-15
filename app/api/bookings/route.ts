import { NextResponse } from "next/server"
import { sql } from "drizzle-orm"
import { db } from "@/lib/db"
import type { NextRequest } from "next/server"
import { createBooking } from "@/lib/db/queries"
import { sendAdminNotification, sendCustomerConfirmation } from "@/lib/email"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 API: Fetching bookings...")
    const { searchParams } = new URL(request.url)
    const beachLocationId = searchParams.get("beachLocationId")
    const hotelCode = searchParams.get("hotelCode") // ✅ NUEVO: Obtener hotelCode del searchParams

    let query = sql`
      SELECT
        b.id,
        b.customer_name,
        b.customer_email,
        b.customer_phone,
        b.customer_dni,
        b.booking_date,
        b.time_slot,
        b.duration,
        b.total_price,
        b.status,
        b.payment_status,
        b.notes,
        b.created_at,
        b.security_deposit,
        b.inspection_status,
        b.damage_description,
        b.damage_cost,
        b.liability_waiver_id,
        b.is_test_booking,
        b.is_manual_booking,
        b.sales_person,
        b.vehicle_name,
        b.vehicle_type,
        b.payment_type,
        b.amount_paid,
        b.amount_pending,
        b.payment_location,
        b.payment_method,
        b.hotel_code, -- ✅ NUEVO: Seleccionar hotel_code
        v.name as vehicle_current_name,
        v.type as vehicle_current_type,
        l.name as beach_location_name,
        l.id as beach_location_id
      FROM bookings b
      LEFT JOIN vehicles v ON b.vehicle_id = v.id
      LEFT JOIN locations l ON b.beach_location_id = l.id
    `
    const conditions = []

    if (beachLocationId && beachLocationId !== "all") {
      conditions.push(sql`b.beach_location_id = ${beachLocationId}`)
    }

    if (hotelCode) {
      // ✅ NUEVO: Añadir condición para filtrar por hotel_code
      conditions.push(sql`LOWER(b.hotel_code) LIKE LOWER(${`%${hotelCode}%`})`)
    }

    if (conditions.length > 0) {
      query = sql`${query} WHERE ${sql.join(conditions, sql` AND `)}`
    }

    query = sql`${query} ORDER BY b.created_at DESC`

    const bookingsResult = (await db.execute(query)) as any[] // Cast to any[] for flexible access
    console.log(`✅ API: Found ${bookingsResult.length} bookings`)

    // Debug específico para métodos de pago
    const paymentMethods = bookingsResult
      .filter((row) => row.is_manual_booking)
      .map((row) => ({
        id: row.id,
        name: row.customer_name,
        method: row.payment_method,
        rawValue: `"${row.payment_method}"`,
        type: typeof row.payment_method,
      }))
    if (paymentMethods.length > 0) {
      console.log("🔍 API: Payment methods in manual bookings:")
      console.table(paymentMethods)
    }

    // Transformar los datos al formato esperado por el frontend
    const transformedBookings = bookingsResult.map((row) => ({
      booking: {
        id: row.id,
        customerName: row.customer_name,
        customerEmail: row.customer_email,
        customerPhone: row.customer_phone,
        customerDni: row.customer_dni,
        bookingDate: row.booking_date,
        timeSlot: row.time_slot,
        duration: row.duration,
        totalPrice: row.total_price?.toString() || "0",
        status: row.status,
        paymentStatus: row.payment_status,
        notes: row.notes,
        createdAt: row.created_at,
        securityDeposit: row.security_deposit?.toString() || "0",
        inspectionStatus: row.inspection_status || "pending",
        damageDescription: row.damage_description,
        damageCost: row.damage_cost?.toString() || "0",
        liabilityWaiverId: row.liability_waiver_id,
        isTestBooking: row.is_test_booking || false,
        isManualBooking: row.is_manual_booking || false,
        salesPerson: row.sales_person,
        vehicleName: row.vehicle_name || row.vehicle_current_name,
        vehicleType: row.vehicle_type || row.vehicle_current_type,
        payment_type: row.payment_type,
        paymentType: row.payment_type, // Duplicado para compatibilidad
        amountPaid: row.amount_paid?.toString() || null,
        amountPending: row.amount_pending?.toString() || null,
        paymentLocation: row.payment_location,
        paymentMethod: row.payment_method,
        beachLocationId: row.beach_location_id, // Add beach location ID
        beachLocationName: row.beach_location_name, // Add beach location name
        hotelCode: row.hotel_code, // ✅ NUEVO: Incluir hotelCode
      },
      vehicle: row.vehicle_current_name
        ? {
            name: row.vehicle_current_name,
            type: row.vehicle_current_type,
          }
        : null,
    }))

    // Debug para verificar reservas manuales y comerciales
    const manualBookings = transformedBookings.filter((b) => b.booking.isManualBooking)
    console.log(`🔍 API: Manual bookings found: ${manualBookings.length}`)
    manualBookings.forEach((b) => {
      console.log(`   - Booking ${b.booking.id}: sales_person = ${b.booking.salesPerson || "no sales person"}`)
    })

    // Debug para verificar pagos parciales
    const partialPayments = transformedBookings.filter((b) => b.booking.payment_type === "partial_payment")
    console.log(`🔍 API: Partial payments found: ${partialPayments.length}`)
    partialPayments.forEach((b) => {
      console.log(
        `   - Booking ${b.booking.id}: payment_type = ${b.booking.payment_type}, amountPaid = ${b.booking.amountPaid}, amountPending = ${b.booking.amountPending}`,
      )
    })

    const withWaivers = transformedBookings.filter((b) => b.booking.liabilityWaiverId).length
    console.log(
      `✅ API: Returning ${transformedBookings.length} bookings, ${withWaivers} with liability waivers, ${partialPayments.length} with partial payments`,
    )
    return NextResponse.json(transformedBookings)
  } catch (error) {
    console.error("❌ API Error fetching bookings:", error)
    return NextResponse.json(
      { error: "Failed to fetch bookings", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 API: Creating new booking...")
    const bookingData = await request.json()
    console.log("📝 Received booking data:", {
      customerName: bookingData.customerName,
      vehicleName: bookingData.vehicleName,
      totalPrice: bookingData.totalPrice || bookingData.finalAmount,
      paymentStatus: bookingData.paymentStatus,
      paymentType: bookingData.paymentType,
      hasDiscount: !!bookingData.discountCode,
      hotelCode: bookingData.hotelCode, // ✅ NUEVO: Log hotelCode
    })

    const booking = await createBooking(bookingData)
    console.log("✅ Booking created successfully:", booking[0])

    try {
      const vehicleName = bookingData.vehicleName || "Vehículo"
      const emailData = {
        bookingId: Number(booking[0].id),
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail,
        customerPhone: bookingData.customerPhone,
        vehicleName: vehicleName,
        bookingDate: bookingData.bookingDate,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        totalPrice: bookingData.totalPrice || bookingData.finalAmount,
        discountAmount: bookingData.discountAmount > 0 ? bookingData.discountAmount : undefined,
        originalPrice: bookingData.discountAmount > 0 ? bookingData.originalPrice : undefined,
        discountCode: bookingData.discountCode || undefined,
        securityDeposit: bookingData.securityDeposit || 0,
        paymentType: bookingData.paymentType || "full_payment",
        amountPaid: bookingData.amountPaid || bookingData.finalAmount || 0,
        amountPending: bookingData.amountPending || 0,
        hotelCode: bookingData.hotelCode, // ✅ NUEVO: Incluir hotelCode en emailData
      }
      console.log("📧 Sending booking confirmation emails...")
      await sendAdminNotification(emailData)
      console.log("✅ Admin notification sent")
      await sendCustomerConfirmation(emailData)
      console.log("✅ Customer confirmation sent")
    } catch (emailError) {
      console.error("⚠️ Error sending emails (booking still created):", emailError)
    }

    return NextResponse.json({
      success: true,
      booking: booking[0],
      message: "Reserva creada exitosamente",
    })
  } catch (error) {
    console.error("❌ Error creating booking:", error)
    return NextResponse.json(
      {
        error: "Failed to create booking",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
