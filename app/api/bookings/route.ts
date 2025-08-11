import { NextResponse } from "next/server"
import { sql, eq } from "drizzle-orm" // Importar 'eq' para comparaciones
import { db } from "@/lib/db"
import type { NextRequest } from "next/server"
import { createBooking } from "@/lib/db/queries"
import { sendAdminNotification, sendCustomerConfirmation } from "@/lib/email"
import { vehicles, locations } from "@/lib/db/schema" // Importar esquemas de vehicles y locations

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 API: Fetching bookings...")
    const { searchParams } = new URL(request.url)
    const beachLocationId = searchParams.get("beachLocationId")
    const hotelCode = searchParams.get("hotelCode")
    const bookingDate = searchParams.get("bookingDate") // NUEVO: Obtener bookingDate

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
      b.hotel_code,
      b.beach_location_id, -- Asegurarse de seleccionar beach_location_id de bookings
      l.name as beach_location_name, -- Seleccionar el nombre de la playa de locations
      v.name as vehicle_current_name,
      v.type as vehicle_current_type
    FROM bookings b
    LEFT JOIN vehicles v ON b.vehicle_id = v.id
    LEFT JOIN locations l ON b.beach_location_id = l.id -- Unir con locations
  `
    const conditions = []

    if (beachLocationId && beachLocationId !== "all") {
      conditions.push(sql`b.beach_location_id = ${beachLocationId}`)
    }

    if (hotelCode) {
      conditions.push(sql`LOWER(b.hotel_code) LIKE LOWER(${`%${hotelCode}%`})`)
    }

    // NUEVO: Añadir condición para filtrar por bookingDate
    if (bookingDate) {
      conditions.push(sql`b.booking_date = ${bookingDate}`)
    }

    if (conditions.length > 0) {
      query = sql`${query} WHERE ${sql.join(conditions, sql` AND `)}`
    }

    query = sql`${query} ORDER BY b.created_at DESC`

    const bookingsResult = (await db.execute(query)) as any[]
    console.log(`✅ API: Found ${bookingsResult.length} bookings`)

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
        paymentType: row.payment_type,
        amountPaid: row.amount_paid?.toString() || null,
        amountPending: row.amount_pending?.toString() || null,
        paymentLocation: row.payment_location,
        paymentMethod: row.payment_method,
        beachLocationId: row.beach_location_id,
        beachLocationName: row.beach_location_name, // Ahora se obtiene de la unión
        hotelCode: row.hotel_code,
      },
      vehicle: row.vehicle_current_name
        ? {
            name: row.vehicle_current_name,
            type: row.vehicle_current_type,
          }
        : null,
    }))

    const manualBookings = transformedBookings.filter((b) => b.booking.isManualBooking)
    console.log(`🔍 API: Manual bookings found: ${manualBookings.length}`)
    manualBookings.forEach((b) => {
      console.log(`   - Booking ${b.booking.id}: sales_person = ${b.booking.salesPerson || "no sales person"}`)
    })

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

    console.log("📝 Received initial booking data:", {
      vehicleId: bookingData.vehicleId,
      customerName: bookingData.customerName,
      bookingDate: bookingData.bookingDate,
      timeSlot: bookingData.timeSlot,
      totalPrice: bookingData.totalPrice,
      hotelCode: bookingData.hotelCode,
    })

    // 1. Obtener el vehículo para obtener su beachLocationId
    const vehicle = await db
      .select({
        beachLocationId: vehicles.beachLocationId,
      })
      .from(vehicles)
      .where(eq(vehicles.id, bookingData.vehicleId))
      .limit(1)

    console.log("🔍 Vehicle lookup result:", vehicle)
    if (!vehicle || vehicle.length === 0) {
      console.warn("⚠️ Vehicle not found for vehicleId:", bookingData.vehicleId)
    } else if (!vehicle[0].beachLocationId) {
      console.warn("⚠️ Vehicle found, but beachLocationId is null for vehicleId:", bookingData.vehicleId)
    }

    if (!vehicle || vehicle.length === 0 || !vehicle[0].beachLocationId) {
      console.warn("⚠️ Vehicle or beachLocationId not found for vehicleId:", bookingData.vehicleId)
      // Puedes decidir si quieres lanzar un error o continuar sin el nombre de la playa
      // Por ahora, continuaremos pero el nombre de la playa será nulo
    }

    let beachLocationName: string | null = null
    if (vehicle && vehicle.length > 0 && vehicle[0].beachLocationId) {
      // 2. Obtener el nombre de la playa usando el beachLocationId
      const location = await db
        .select({
          name: locations.name,
        })
        .from(locations)
        .where(eq(locations.id, vehicle[0].beachLocationId))
        .limit(1)

      console.log("🔍 Location lookup result:", location)
      if (!location || location.length === 0) {
        console.warn("⚠️ Beach location name not found for ID:", vehicle[0].beachLocationId)
      }

      if (location && location.length > 0) {
        beachLocationName = location[0].name
        console.log("🏖️ Found beach location name:", beachLocationName)
      } else {
        console.warn("⚠️ Beach location name not found for ID:", vehicle[0].beachLocationId)
      }
    }

    // 3. Añadir beachLocationId y beachLocationName a bookingData
    const finalBookingData = {
      ...bookingData,
      beachLocationId: vehicle?.[0]?.beachLocationId || null, // Asegurarse de que se pasa el ID
      beachLocationName: beachLocationName, // Añadir el nombre de la playa
    }

    console.log("📝 Final booking data before creation:", {
      customerName: finalBookingData.customerName,
      vehicleName: finalBookingData.vehicleName,
      beachLocationId: finalBookingData.beachLocationId,
      beachLocationName: finalBookingData.beachLocationName,
      totalPrice: finalBookingData.totalPrice || finalBookingData.finalAmount,
      hotelCode: finalBookingData.hotelCode,
    })

    const booking = await createBooking(finalBookingData)
    console.log("✅ Booking created successfully:", booking[0])

    try {
      const vehicleName = finalBookingData.vehicleName || "Vehículo"
      const emailData = {
        bookingId: Number(booking[0].id),
        customerName: finalBookingData.customerName,
        customerEmail: finalBookingData.customerEmail,
        customerPhone: finalBookingData.customerPhone,
        vehicleName: vehicleName,
        bookingDate: finalBookingData.bookingDate,
        startTime: finalBookingData.startTime,
        endTime: finalBookingData.endTime,
        totalPrice: finalBookingData.totalPrice || finalBookingData.finalAmount,
        discountAmount: finalBookingData.discountAmount > 0 ? finalBookingData.discountAmount : undefined,
        originalPrice: finalBookingData.discountAmount > 0 ? finalBookingData.originalPrice : undefined,
        discountCode: finalBookingData.discountCode || undefined,
        securityDeposit: finalBookingData.securityDeposit || 0,
        paymentType: finalBookingData.paymentType || "full_payment",
        amountPaid: finalBookingData.amountPaid || finalBookingData.finalAmount || 0,
        amountPending: finalBookingData.amountPending || 0,
        hotelCode: finalBookingData.hotelCode,
        beachLocationName: finalBookingData.beachLocationName, // Incluir en emailData
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
