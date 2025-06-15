import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { discountCodes } from "@/lib/db/schema"
import { eq, and, or, isNull, gte, lte } from "drizzle-orm"

// ✅ RATE LIMITING SIMPLE (en memoria)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 5 // máximo 5 intentos por IP
const RATE_WINDOW = 60000 // 1 minuto

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(ip)

  if (!userLimit || now > userLimit.resetTime) {
    // Resetear o crear nuevo límite
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW })
    return true
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false // Límite excedido
  }

  userLimit.count++
  return true
}

export async function GET(request: NextRequest) {
  try {
    // ✅ OBTENER IP PARA RATE LIMITING
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown"

    // ✅ VERIFICAR RATE LIMIT
    if (!checkRateLimit(ip)) {
      console.log(`❌ Rate limit exceeded for IP: ${ip}`)
      return NextResponse.json(
        {
          valid: false,
          error: "Demasiados intentos. Espera un minuto.",
        },
        { status: 429 },
      )
    }

    console.log("🎫 API: Validating discount code...")

    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const amount = Number.parseFloat(searchParams.get("amount") || "0")

    console.log("📝 Received data:", { code, amount, ip })

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

    // ✅ VALIDACIÓN BÁSICA DEL CÓDIGO (evitar inyecciones)
    if (!/^[A-Z0-9]{3,20}$/i.test(code)) {
      console.log("❌ Invalid code format")
      return NextResponse.json(
        {
          valid: false,
          error: "Formato de código inválido",
        },
        { status: 400 },
      )
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
      // ✅ NO REVELAR INFORMACIÓN SOBRE CÓDIGOS EXISTENTES
      return NextResponse.json(
        {
          valid: false,
          error: "Código no válido o expirado",
        },
        { status: 200 },
      )
    }

    const discountData = discount[0]
    console.log("✅ Found discount:", { code: discountData.code, type: discountData.discountType })

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
    const minAmount = discountData.minAmount !== null ? Number(discountData.minAmount) : 0
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
      type: discountData.discountType,
      value: discountData.discountValue,
    })
  } catch (error) {
    console.error("❌ Error validating discount:", error)
    return NextResponse.json(
      {
        valid: false,
        error: "Error interno",
      },
      { status: 500 },
    )
  }
}
