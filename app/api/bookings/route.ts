import { NextResponse } from "next/server"
import { sql } from "drizzle-orm"
import { db } from "@/lib/db"
import type { NextRequest } from "next/server"

// Reemplazar la función GET completa para asegurar que se incluye el campo salesPerson
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 API: Fetching bookings...")

    // Consulta SQL directa para asegurar que obtenemos todos los campos necesarios
    const bookingsResult = await db.execute(sql`
      SELECT 
        b.id,
        b.customer_name,
        b.customer_email,
        b.customer_phone,
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
        v.name as vehicle_current_name,
        v.type as vehicle_current_type
      FROM bookings b
      LEFT JOIN vehicles v ON b.vehicle_id = v.id
      ORDER BY b.created_at DESC
    `)

    console.log(`✅ API: Found ${bookingsResult.length} bookings`)

    // Transformar los datos al formato esperado por el frontend
    const transformedBookings = bookingsResult.map((row) => ({
      booking: {
        id: row.id,
        customerName: row.customer_name,
        customerEmail: row.customer_email,
        customerPhone: row.customer_phone,
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
        salesPerson: row.sales_person, // ✅ IMPORTANTE: Incluir el campo salesPerson
        vehicleName: row.vehicle_name || row.vehicle_current_name,
        vehicleType: row.vehicle_type || row.vehicle_current_type,
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

    const withWaivers = transformedBookings.filter((b) => b.booking.liabilityWaiverId).length
    console.log(`✅ API: Returning ${transformedBookings.length} bookings, ${withWaivers} with liability waivers`)

    return NextResponse.json(transformedBookings)
  } catch (error) {
    console.error("❌ API Error fetching bookings:", error)
    return NextResponse.json(
      { error: "Failed to fetch bookings", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
