import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { verifyToken } from "@/lib/auth"
import { HOLD_PAYMENT_STATUS } from "@/lib/holds"

// DELETE: desbloquea (libera) un bloqueo del comercial logueado
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get("admin-token")?.value
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: "Token inválido" }, { status: 401 })

    const { id } = await params
    const holdId = Number.parseInt(id, 10)
    if (!holdId || Number.isNaN(holdId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    // Solo puede liberar SUS propios bloqueos (salvo admin)
    const ownershipCondition =
      user.role === "admin" || user.isAdmin
        ? sql`TRUE`
        : sql`LOWER(sales_person) = LOWER(${user.email})`

    const result = (await db.execute(sql`
      UPDATE bookings
      SET status = 'cancelled', updated_at = now()
      WHERE id = ${holdId}
        AND payment_status = ${HOLD_PAYMENT_STATUS}
        AND status = 'pending'
        AND ${ownershipCondition}
      RETURNING id
    `)) as any[]

    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Bloqueo no encontrado o ya liberado" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Error desbloqueando:", error)
    return NextResponse.json(
      { error: "Error al desbloquear", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    )
  }
}
