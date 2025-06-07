import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { bookings } from "@/lib/db/schema"
import { eq, and, lt } from "drizzle-orm"
import stripe from "@/lib/stripe-config"

export async function POST() {
  try {
    // Buscar fianzas pendientes de más de 7 días
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const expiredDeposits = await db.query.bookings.findMany({
      where: and(
        eq(bookings.inspectionStatus, "pending"),
        lt(bookings.bookingDate, sevenDaysAgo.toISOString().split("T")[0]),
      ),
    })

    console.log(`Encontradas ${expiredDeposits.length} fianzas expiradas`)

    let processedCount = 0
    let errorCount = 0

    for (const booking of expiredDeposits) {
      try {
        // Auto-aprobar fianza después de 7 días (asumir que todo está bien)
        if (booking.depositPaymentIntentId && stripe) {
          // Cancelar la autorización (devolver dinero)
          await stripe.paymentIntents.cancel(booking.depositPaymentIntentId, {
            cancellation_reason: "requested_by_customer",
          })

          console.log(`Fianza auto-devuelta para reserva ${booking.id}`)
        }

        // Actualizar estado en BD
        await db
          .update(bookings)
          .set({
            inspectionStatus: "approved",
            damageDescription: "Auto-aprobado por timeout (7 días sin inspección)",
            updatedAt: new Date(),
          })
          .where(eq(bookings.id, booking.id))

        processedCount++
      } catch (error) {
        console.error(`Error procesando fianza ${booking.id}:`, error)
        errorCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Procesadas ${processedCount} fianzas expiradas`,
      processed: processedCount,
      errors: errorCount,
    })
  } catch (error) {
    console.error("Error en cleanup de fianzas:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
