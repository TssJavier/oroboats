import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { pricingRules, settings } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, context: RouteParams) {
  try {
    const { id } = await context.params
    const vehicleId = Number.parseInt(id)

    console.log(`🔍 Fetching pricing for vehicle ${vehicleId}`)

    // Obtener reglas de precios
    const rules = await db.select().from(pricingRules).where(eq(pricingRules.vehicleId, vehicleId))

    // Obtener tarifa personalizada
    const customRateSetting = await db
      .select()
      .from(settings)
      .where(eq(settings.key, `custom-rate-${vehicleId}`))
      .limit(1)

    const customRatePerMinute = customRateSetting[0]?.value ? Number.parseFloat(customRateSetting[0].value) : 0

    console.log(`✅ Found ${rules.length} pricing rules and custom rate: ${customRatePerMinute}`)

    return NextResponse.json({
      vehicleId,
      pricingRules: rules,
      customRatePerMinute,
    })
  } catch (error) {
    console.error("❌ Error fetching pricing:", error)
    return NextResponse.json({ error: "Failed to fetch pricing data" }, { status: 500 })
  }
}

export async function POST(request: Request, context: RouteParams) {
  try {
    const { id } = await context.params
    const vehicleId = Number.parseInt(id)
    const body = await request.json()

    console.log("📝 Saving pricing for vehicle:", vehicleId, body)

    const { pricingRules: newPricingRules, customRatePerMinute } = body

    // Eliminar reglas existentes
    await db.delete(pricingRules).where(eq(pricingRules.vehicleId, vehicleId))
    console.log("🗑️ Deleted existing pricing rules")

    // Insertar nuevas reglas
    if (newPricingRules && newPricingRules.length > 0) {
      const rulesToInsert = newPricingRules
        .filter((rule: any) => rule.duration && rule.label && rule.price > 0)
        .map((rule: any) => ({
          vehicleId,
          duration: rule.duration,
          price: rule.price.toString(),
          label: rule.label,
        }))

      if (rulesToInsert.length > 0) {
        await db.insert(pricingRules).values(rulesToInsert)
        console.log(`✅ Inserted ${rulesToInsert.length} new pricing rules`)
      }
    }

    // Actualizar o insertar tarifa personalizada
    const settingKey = `custom-rate-${vehicleId}`
    const customRateValue = (customRatePerMinute || 0).toString()

    const existingSetting = await db.select().from(settings).where(eq(settings.key, settingKey)).limit(1)

    if (existingSetting.length > 0) {
      await db
        .update(settings)
        .set({
          value: customRateValue,
          updatedAt: new Date(),
        })
        .where(eq(settings.key, settingKey))
      console.log("✅ Updated custom rate setting")
    } else {
      await db.insert(settings).values({
        key: settingKey,
        value: customRateValue,
        description: `Custom rate per minute for vehicle ${vehicleId}`,
      })
      console.log("✅ Created new custom rate setting")
    }

    return NextResponse.json({
      success: true,
      message: "Pricing rules updated successfully",
    })
  } catch (error) {
    console.error("❌ Error saving pricing:", error)
    return NextResponse.json(
      {
        error: "Failed to save pricing",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const vehicleId = Number.parseInt(params.id)
    const { searchParams } = new URL(request.url)
    const duration = searchParams.get("duration")

    if (!duration) {
      return NextResponse.json({ error: "Duration is required" }, { status: 400 })
    }

    await db.delete(pricingRules).where(and(eq(pricingRules.vehicleId, vehicleId), eq(pricingRules.duration, duration)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting pricing rule:", error)
    return NextResponse.json({ error: "Failed to delete pricing rule" }, { status: 500 })
  }
}
