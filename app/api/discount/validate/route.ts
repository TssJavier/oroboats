import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { discountCodes } from "@/lib/db/schema"
import { eq, and, or, isNull, gte, lte } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    console.log("🎫 API: Validating discount code...")

    const { code, amount } = await request.json()
    console.log("📝 Received data:", { code, amount })

    if (!code || !amount) {
      console.log("❌ Missing code or amount")
      return NextResponse.json({ error: "Código y monto requeridos" }, { status: 400 })
    }

    console.log("🔍 Searching for discount code:", code.toUpperCase())

    // Buscar código de descuento
    const discount = await db
      .select()
      .from(discountCodes)
      .where(
        and(
          eq(discountCodes.code, code.toUpperCase()),
          eq(discountCodes.active, true),
          or(isNull(discountCodes.validUntil), gte(discountCodes.validUntil, new Date())),
          lte(discountCodes.validFrom, new Date()),
        ),
      )
      .limit(1)

    console.log("🔍 Found discount codes:", discount.length)

    if (discount.length === 0) {
      console.log("❌ No valid discount code found")
      return NextResponse.json({ error: "Código no válido o expirado" }, { status: 404 })
    }

    const discountData = discount[0]
    console.log("✅ Found discount:", discountData)

    // Verificar usos máximos
    if (discountData.maxUses && (discountData.usedCount ?? 0) >= discountData.maxUses) {
      console.log("❌ Max uses exceeded")
      return NextResponse.json({ error: "Código agotado" }, { status: 400 })
    }

    // Verificar monto mínimo
    if (amount < (discountData.minAmount ?? 0)) {
      console.log("❌ Minimum amount not met")
      return NextResponse.json(
        {
          error: `Monto mínimo: €${discountData.minAmount ?? 0}`,
        },
        { status: 400 },
      )
    }

    // Calcular descuento
    let discountAmount = 0
    if (discountData.discountType === "percentage") {
      discountAmount = (amount * Number(discountData.discountValue)) / 100
    } else {
      discountAmount = Number(discountData.discountValue)
    }

    // No puede ser mayor al monto total
    discountAmount = Math.min(discountAmount, amount)

    console.log("✅ Discount calculated:", discountAmount)

    return NextResponse.json({
      valid: true,
      code: discountData.code,
      description: discountData.description,
      discountAmount: discountAmount,
      finalAmount: amount - discountAmount,
    })
  } catch (error) {
    console.error("❌ Error validating discount:", error)
    return NextResponse.json(
      {
        error: "Error interno",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
