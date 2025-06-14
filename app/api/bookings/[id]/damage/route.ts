import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { bookings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import Stripe from "stripe"

// ❌ NO hagas esto (se ejecuta durante el build):
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: "2025-05-28.basil",
// })

// ✅ Función para obtener Stripe solo cuando se necesite:
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured")
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-05-28.basil",
  })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const bookingId = Number.parseInt(id)

    if (isNaN(bookingId)) {
      return NextResponse.json({ error: "ID de reserva inválido" }, { status: 400 })
    }

    const body = await request.json()
    const { inspectionStatus, damageDescription, damageCost } = body

    // Validar estado de inspección
    if (!["pending", "approved", "damaged"].includes(inspectionStatus)) {
      return NextResponse.json({ error: "Estado de inspección inválido" }, { status: 400 })
    }

    // Si hay daños, validar descripción y coste
    if (inspectionStatus === "damaged") {
      if (!damageDescription) {
        return NextResponse.json({ error: "Se requiere descripción de los daños" }, { status: 400 })
      }

      if (typeof damageCost !== "number" || damageCost < 0) {
        return NextResponse.json({ error: "Coste de daños inválido" }, { status: 400 })
      }
    }

    // Actualizar la reserva
    const result = await db
      .update(bookings)
      .set({
        inspectionStatus,
        damageDescription: damageDescription || null,
        damageCost: inspectionStatus === "damaged" ? damageCost : 0,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId))
      .returning()

    if (!result.length) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
    }

    // ✅ Ahora inicializa Stripe solo cuando se necesite:
    if (inspectionStatus === "approved") {
      try {
        const stripe = getStripe()
        // TODO: Lógica para procesar devolución de fianza
        console.log("Stripe initialized for refund processing")
      } catch (error) {
        console.error("Stripe initialization failed:", error)
        // No fallar la request por esto
      }
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating damage inspection:", error)
    return NextResponse.json(
      { error: "Error al actualizar la inspección", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
