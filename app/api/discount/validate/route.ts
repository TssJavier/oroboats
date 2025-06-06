import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { discountCodes } from "@/lib/db/schema"
import { eq, and, or, isNull, gte, lte } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    console.log("🎫 API: Validating discount code...")

    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const amount = Number.parseFloat(searchParams.get("amount") || "0")

    console.log("📝 Received data:", { code, amount })

    if (!code || !amount) {
      console.log("❌ Missing code or amount")
      return NextResponse.json(
        {
          valid: false,
          error: "Código y monto requeridos",
        },
        { status: 400 },
      )
    }

    console.log("🔍 Searching for discount code:", code.toUpperCase())

    // Buscar código de descuento - USANDO LOS MISMOS CAMPOS QUE TU ADMIN
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
    console.log("🔍 Raw discount data:", discount)

    if (discount.length === 0) {
      console.log("❌ No valid discount code found")

      // DEBUG: Buscar CUALQUIER código con ese nombre (sin filtros)
      const anyCode = await db.select().from(discountCodes).where(eq(discountCodes.code, code.toUpperCase())).limit(1)

      console.log("🔍 Any code with that name:", anyCode)

      return NextResponse.json(
        {
          valid: false,
          error: "Código no válido o expirado",
          debug: {
            searchedCode: code.toUpperCase(),
            foundAnyCode: anyCode.length > 0,
            codeData: anyCode[0] || null,
          },
        },
        { status: 200 },
      )
    }

    const discountData = discount[0]
    console.log("✅ Found discount:", discountData)

    // Verificar usos máximos
    if (discountData.maxUses && (Number(discountData.usedCount) || 0) >= discountData.maxUses) {
      console.log("❌ Max uses exceeded")
      return NextResponse.json(
        {
          valid: false,
          error: "Código agotado",
        },
        { status: 200 },
      )
    }

    // Verificar monto mínimo
    const minAmount = discountData.minAmount !== null ? Number(discountData.minAmount) : 0;
    if (amount < minAmount) {
      console.log("❌ Minimum amount not met")
      return NextResponse.json(
        {
          valid: false,
          error: `Monto mínimo: €${minAmount}`,
        },
        { status: 200 },
      )
    }

    // Calcular descuento - USANDO discountType (como en tu admin)
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
      type: discountData.discountType,
      value: discountData.discountValue,
    })
  } catch (error) {
    console.error("❌ Error validating discount:", error)
    return NextResponse.json(
      {
        valid: false,
        error: "Error interno",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
