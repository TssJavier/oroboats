import { config } from "dotenv"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { vehicles } from "../lib/db/schema"
import { eq } from "drizzle-orm"
import path from "path"

// Cargar variables de entorno
config({ path: path.resolve(process.cwd(), ".env.local") })

async function cleanupDuplicates() {
  console.log("🧹 Starting cleanup of duplicate vehicles...")

  const connectionString =
    process.env.POSTGRES_URL_NON_POOLING ||
    "postgres://postgres.yencvzyflvzhcfsiakph:WdBTm3YZxhu9BZKp@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"

  const client = postgres(connectionString, {
    prepare: false,
    ssl: "require",
    max: 1,
  })

  const db = drizzle(client, { schema: { vehicles } })

  try {
    // Obtener todos los vehículos
    const allVehicles = await db.select().from(vehicles).orderBy(vehicles.id)
    console.log(`📊 Found ${allVehicles.length} total vehicles`)

    // Agrupar por nombre para encontrar duplicados
    const vehicleGroups = allVehicles.reduce(
      (groups, vehicle) => {
        const key = vehicle.name.toLowerCase().trim()
        if (!groups[key]) {
          groups[key] = []
        }
        groups[key].push(vehicle)
        return groups
      },
      {} as Record<string, typeof allVehicles>,
    )

    // Mostrar duplicados encontrados
    let totalDuplicates = 0
    for (const [name, vehiclesList] of Object.entries(vehicleGroups)) {
      if (vehiclesList.length > 1) {
        console.log(`🔍 Found ${vehiclesList.length} duplicates for "${name}":`)
        vehiclesList.forEach((v, i) => {
          console.log(`  ${i === 0 ? "✅ KEEP" : "❌ DELETE"} - ID: ${v.id}, Name: ${v.name}`)
        })
        totalDuplicates += vehiclesList.length - 1
      }
    }

    if (totalDuplicates === 0) {
      console.log("✅ No duplicates found!")
      return
    }

    console.log(`\n🗑️ Will delete ${totalDuplicates} duplicate vehicles...`)

    // Eliminar duplicados (mantener el primero)
    let deletedCount = 0
    for (const [name, vehiclesList] of Object.entries(vehicleGroups)) {
      if (vehiclesList.length > 1) {
        // Mantener el primero, eliminar el resto
        for (let i = 1; i < vehiclesList.length; i++) {
          await db.delete(vehicles).where(eq(vehicles.id, vehiclesList[i].id))
          deletedCount++
          console.log(`🗑️ Deleted duplicate: ID ${vehiclesList[i].id} - ${vehiclesList[i].name}`)
        }
      }
    }

    console.log(`✅ Cleanup completed! Removed ${deletedCount} duplicate vehicles`)

    // Mostrar vehículos restantes
    const remainingVehicles = await db.select().from(vehicles).orderBy(vehicles.id)
    console.log(`\n📊 Remaining vehicles (${remainingVehicles.length}):`)
    remainingVehicles.forEach((v) => {
      console.log(`  - ID: ${v.id}, Name: ${v.name}, Type: ${v.type}`)
    })
  } catch (error) {
    console.error("❌ Error during cleanup:", error)
  } finally {
    await client.end()
    console.log("🔌 Database connection closed")
  }
}

cleanupDuplicates().catch(console.error)
