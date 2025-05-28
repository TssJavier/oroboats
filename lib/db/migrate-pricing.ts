import { db } from "./index"
import { vehicles, pricingRules } from "./schema"
import { eq } from "drizzle-orm"

export async function migratePricingData() {
  try {
    console.log("🔄 Starting pricing data migration...")

    // Obtener todos los vehículos con pricing data
    const allVehicles = await db.select().from(vehicles)

    for (const vehicle of allVehicles) {
      if (vehicle.pricing && Array.isArray(vehicle.pricing)) {
        console.log(`📝 Migrating pricing for vehicle ${vehicle.id}: ${vehicle.name}`)

        // Verificar si ya existen reglas para este vehículo
        const existingRules = await db.select().from(pricingRules).where(eq(pricingRules.vehicleId, vehicle.id))

        if (existingRules.length === 0) {
          // Migrar cada opción de precio
          for (const pricingOption of vehicle.pricing as any[]) {
            if (pricingOption.duration && pricingOption.price && pricingOption.label) {
              await db.insert(pricingRules).values({
                vehicleId: vehicle.id,
                duration: pricingOption.duration,
                price: pricingOption.price.toString(),
                label: pricingOption.label,
              })
              console.log(`  ✅ Migrated: ${pricingOption.duration} - ${pricingOption.label} - €${pricingOption.price}`)
            }
          }
        } else {
          console.log(`  ⏭️ Skipping vehicle ${vehicle.id} - already has pricing rules`)
        }
      }
    }

    console.log("✅ Pricing data migration completed!")
  } catch (error) {
    console.error("❌ Error during pricing migration:", error)
    throw error
  }
}
