import { db } from "./index"
import { vehicles, settings } from "./schema"
import { eq } from "drizzle-orm"

// Obtener reglas de precios para un vehículo
export async function getPricingRules(vehicleId: number) {
  try {
    const vehicle = await db.select().from(vehicles).where(eq(vehicles.id, vehicleId)).limit(1)

    if (vehicle.length === 0) {
      throw new Error("Vehicle not found")
    }

    // Las reglas de precios están almacenadas en el campo pricing del vehículo
    return vehicle[0].pricing || []
  } catch (error) {
    console.error("Error fetching pricing rules:", error)
    throw error
  }
}

// Actualizar reglas de precios para un vehículo
export async function updatePricingRules(vehicleId: number, pricingRules: any[]) {
  try {
    await db
      .update(vehicles)
      .set({
        pricing: pricingRules,
        updatedAt: new Date(),
      })
      .where(eq(vehicles.id, vehicleId))

    return true
  } catch (error) {
    console.error("Error updating pricing rules:", error)
    throw error
  }
}

// Obtener tarifa personalizada por minuto
export async function getCustomRatePerMinute(vehicleId: number) {
  try {
    const settingKey = `custom_rate_${vehicleId}`
    const setting = await db.select().from(settings).where(eq(settings.key, settingKey)).limit(1)

    if (setting.length === 0) {
      return 0
    }

    return Number.parseFloat(setting[0].value as string) || 0
  } catch (error) {
    console.error("Error fetching custom rate:", error)
    throw error
  }
}

// Actualizar tarifa personalizada por minuto
export async function updateCustomRatePerMinute(vehicleId: number, rate: number) {
  try {
    const settingKey = `custom_rate_${vehicleId}`

    await db
      .insert(settings)
      .values({
        key: settingKey,
        value: rate.toString(),
        description: `Tarifa por minuto para duraciones personalizadas del vehículo ${vehicleId}`,
      })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: rate.toString(), updatedAt: new Date() },
      })

    return true
  } catch (error) {
    console.error("Error updating custom rate:", error)
    throw error
  }
}

// Calcular precio para duración personalizada
export function calculateCustomPrice(customRatePerMinute: number, hours: number, minutes: number): number {
  const totalMinutes = hours * 60 + minutes
  return Math.round(customRatePerMinute * totalMinutes)
}
