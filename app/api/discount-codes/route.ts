import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { discountCodes, type NewDiscountCode } from "@/lib/db/schema"
import { desc } from "drizzle-orm"

// ✅ OBTENER TODOS LOS CÓDIGOS
export async function GET() {
  try {
    const codes = await db.select().from(discountCodes).orderBy(desc(discountCodes.createdAt))

    return NextResponse.json(codes)
  } catch (error) {
    console.error("Error fetching discount codes:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// ✅ CREAR NUEVO CÓDIGO
export async function POST(request: NextRequest) {
  try {
    const { code, description, discountType, discountValue, minAmount, maxUses, validUntil } = await request.json()

    // Validaciones
    if (!code || !description || !discountType || !discountValue) {
      return NextResponse.json(
        { error: "Campos requeridos: code, description, discountType, discountValue" },
        { status: 400 },
      )
    }

    if (discountType === "percentage" && discountValue > 100) {
      return NextResponse.json({ error: "El porcentaje no puede ser mayor a 100%" }, { status: 400 })
    }

    // ✅ CREAR OBJETO CON TIPO EXPLÍCITO
    const newDiscountCode: NewDiscountCode = {
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue: Number.parseFloat(discountValue).toString(), // Convertir a string para decimal
      minAmount: (Number.parseFloat(minAmount) || 0).toString(),
      maxUses: maxUses ? Number.parseInt(maxUses) : null,
      validUntil: validUntil ? new Date(validUntil) : null,
      active: true,
      createdBy: "admin",
    }

    const newCode = await db.insert(discountCodes).values(newDiscountCode).returning()

    return NextResponse.json(newCode[0])
  } catch (error) {
    console.error("Error creating discount code:", error)

    if (error instanceof Error && error.message.includes("unique")) {
      return NextResponse.json({ error: "Ya existe un código con ese nombre" }, { status: 400 })
    }

    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
