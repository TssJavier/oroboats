import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { verifyToken } from "@/lib/auth"
import {
  HOLD_PAYMENT_STATUS,
  HOLD_EXPIRY_HOURS,
  generateHoldToken,
  releaseExpiredHolds,
} from "@/lib/holds"

function timeToMinutes(t: string): number {
  if (!t) return 0
  const [h, m] = t.split(":").map(Number)
  return (h || 0) * 60 + (m || 0)
}

async function getCommercial(request: NextRequest) {
  const token = request.cookies.get("admin-token")?.value
  if (!token) return null
  const user = await verifyToken(token)
  if (!user) return null
  // admin o comercial pueden usar bloqueos
  return user
}

// Normaliza una hora a "HH:MM" (la columna `time` de Postgres devuelve "HH:MM:SS",
// pero los slots de disponibilidad usan "HH:MM"; si no coinciden, el formulario da
// "Horario no disponible").
function hhmm(t: string): string {
  return typeof t === "string" ? t.slice(0, 5) : t
}

// Construye la URL de pago prerellenada con el token del bloqueo
function buildPayUrl(
  origin: string,
  vehicleId: number,
  date: string,
  startTime: string,
  endTime: string,
  duration: string,
  price: number | string,
  hotelCode: string | null,
  token: string,
) {
  const params = new URLSearchParams({
    date,
    startTime: hhmm(startTime),
    endTime: hhmm(endTime),
    duration,
    price: String(price),
    hold: token,
  })
  if (hotelCode) params.set("hotelCode", hotelCode)
  return `${origin}/boats/${vehicleId}/book?${params.toString()}`
}

// GET: lista los bloqueos activos del comercial logueado
export async function GET(request: NextRequest) {
  try {
    const user = await getCommercial(request)
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    // Liberar primero los caducados (8h) para que no aparezcan
    await releaseExpiredHolds()

    const rows = (await db.execute(sql`
      SELECT
        b.id,
        b.vehicle_id,
        b.vehicle_name,
        b.vehicle_type,
        b.booking_date,
        b.time_slot,
        b.start_time,
        b.end_time,
        b.duration,
        b.total_price,
        b.hotel_code,
        b.beach_location_name,
        b.created_at,
        (b.created_at + ${sql.raw(`interval '${HOLD_EXPIRY_HOURS} hours'`)}) AS expires_at
      FROM bookings b
      WHERE b.payment_status = ${HOLD_PAYMENT_STATUS}
        AND b.status = 'pending'
        AND LOWER(b.sales_person) = LOWER(${user.email})
      ORDER BY b.booking_date ASC, b.start_time ASC
    `)) as any[]

    const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin
    const holds = rows.map((r) => ({
      id: r.id,
      vehicleId: r.vehicle_id,
      vehicleName: r.vehicle_name,
      vehicleType: r.vehicle_type,
      bookingDate: r.booking_date,
      timeSlot: r.time_slot,
      startTime: r.start_time,
      endTime: r.end_time,
      duration: r.duration,
      totalPrice: r.total_price,
      hotelCode: r.hotel_code,
      beachLocationName: r.beach_location_name,
      createdAt: r.created_at,
      expiresAt: r.expires_at,
      payUrl: buildPayUrl(
        origin,
        r.vehicle_id,
        typeof r.booking_date === "string" ? r.booking_date : new Date(r.booking_date).toISOString().split("T")[0],
        r.start_time,
        r.end_time,
        r.duration,
        r.total_price,
        r.hotel_code,
        generateHoldToken(r.id),
      ),
    }))

    return NextResponse.json({ holds })
  } catch (error) {
    console.error("❌ Error listando bloqueos:", error)
    return NextResponse.json(
      { error: "Error al obtener los bloqueos", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    )
  }
}

// POST: crea un bloqueo (vehículo + día + hora)
export async function POST(request: NextRequest) {
  try {
    const user = await getCommercial(request)
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const body = await request.json()
    const { vehicleId, bookingDate, startTime, endTime, duration, price } = body

    if (!vehicleId || !bookingDate || !startTime || !endTime || !duration) {
      return NextResponse.json({ error: "Faltan datos del bloqueo" }, { status: 400 })
    }

    const timeSlot = `${startTime}-${endTime}`
    const durationMinutes = Math.max(0, timeToMinutes(endTime) - timeToMinutes(startTime))

    // Datos del vehículo (nombre, tipo, stock, playa)
    const vehicleRows = (await db.execute(sql`
      SELECT id, name, type, stock, beach_location_id
      FROM vehicles WHERE id = ${vehicleId}
    `)) as any[]
    if (!vehicleRows || vehicleRows.length === 0) {
      return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 })
    }
    const vehicle = vehicleRows[0]
    const vehicleStock = typeof vehicle.stock === "number" ? vehicle.stock : Number(vehicle.stock) || 1

    // Nombre de la playa
    let beachLocationName: string | null = null
    if (vehicle.beach_location_id) {
      const locRows = (await db.execute(
        sql`SELECT name FROM locations WHERE id = ${vehicle.beach_location_id}`,
      )) as any[]
      if (locRows && locRows.length > 0) beachLocationName = locRows[0].name
    }

    // Liberar caducados antes de comprobar disponibilidad
    await releaseExpiredHolds(Number(vehicleId), bookingDate)

    // Comprobar que el hueco está libre (mismo criterio que la reserva manual)
    const countRows = (await db.execute(sql`
      SELECT COUNT(*) as count FROM bookings
      WHERE vehicle_id = ${vehicleId}
        AND booking_date = ${bookingDate}
        AND time_slot = ${timeSlot}
        AND status IN ('confirmed', 'completed', 'pending')
    `)) as any[]
    const used = Number(countRows[0]?.count || 0)
    if (used >= vehicleStock) {
      return NextResponse.json(
        { error: "Ese horario ya no está disponible para bloquear" },
        { status: 409 },
      )
    }

    // Código de hotel del comercial (para que la venta le cuente como comisión)
    let hotelCode: string | null = null
    const hotelRows = (await db.execute(sql`
      SELECT code FROM hotels WHERE LOWER(commercial_email) = LOWER(${user.email}) ORDER BY id ASC LIMIT 1
    `)) as any[]
    if (hotelRows && hotelRows.length > 0) hotelCode = hotelRows[0].code

    // Email placeholder (el real lo pone el cliente al pagar)
    const placeholderEmail = "bloqueo@oroboats.com"

    const insertRows = (await db.execute(sql`
      INSERT INTO bookings (
        vehicle_id, customer_name, customer_email, customer_phone, customer_dni,
        booking_date, time_slot, start_time, end_time, duration, duration_minutes,
        total_price, original_price, status, payment_status, notes,
        is_manual_booking, is_test_booking, sales_person, vehicle_name, vehicle_type,
        hotel_code, beach_location_id, beach_location_name, created_at, updated_at
      ) VALUES (
        ${vehicleId}, ${`🔒 BLOQUEO (${user.name || user.email})`}, ${placeholderEmail}, '', NULL,
        ${bookingDate}, ${timeSlot}, ${startTime}, ${endTime}, ${duration}, ${durationMinutes},
        ${price || 0}, ${price || 0}, 'pending', ${HOLD_PAYMENT_STATUS},
        ${`Bloqueo comercial creado por ${user.email}. Caduca a las ${HOLD_EXPIRY_HOURS}h.`},
        false, false, ${user.email}, ${vehicle.name}, ${vehicle.type},
        ${hotelCode}, ${vehicle.beach_location_id || null}, ${beachLocationName}, now(), now()
      )
      RETURNING id
    `)) as any[]

    const holdId = insertRows[0]?.id
    const token = generateHoldToken(holdId)
    const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin
    const payUrl = buildPayUrl(
      origin,
      Number(vehicleId),
      bookingDate,
      startTime,
      endTime,
      duration,
      price || 0,
      hotelCode,
      token,
    )

    return NextResponse.json({
      success: true,
      id: holdId,
      payUrl,
      hotelCode,
      hotelCodeWarning: hotelCode
        ? null
        : "No tienes un código de hotel asignado: la venta no se podrá atribuir a tu comisión.",
    })
  } catch (error) {
    console.error("❌ Error creando bloqueo:", error)
    return NextResponse.json(
      { error: "Error al crear el bloqueo", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    )
  }
}
