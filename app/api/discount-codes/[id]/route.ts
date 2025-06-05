import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { discountCodes } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

// ✅ ACTUALIZAR CÓDIGO
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const updates = await request.json()

    // ✅ USAR NOMBRES CORRECTOS DEL SCHEMA
    const updatedCode = await db
      .update(discountCodes)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(discountCodes.id, id))
      .returning()

    if (updatedCode.length === 0) {
      return NextResponse.json({ error: "Código no encontrado" }, { status: 404 })
    }

    return NextResponse.json(updatedCode[0])
  } catch (error) {
    console.error("Error updating discount code:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// ✅ ELIMINAR CÓDIGO
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    const deletedCode = await db.delete(discountCodes).where(eq(discountCodes.id, id)).returning()

    if (deletedCode.length === 0) {
      return NextResponse.json({ error: "Código no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ message: "Código eliminado correctamente" })
  } catch (error) {
    console.error("Error deleting discount code:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
