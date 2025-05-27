import { config } from "dotenv"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { vehicles, settings } from "./schema"
import path from "path"
import fs from "fs"

// Verificar que el archivo .env.local existe
const envPath = path.resolve(process.cwd(), ".env.local")
console.log("🔍 Looking for .env.local at:", envPath)
console.log("📁 File exists:", fs.existsSync(envPath))

if (fs.existsSync(envPath)) {
  console.log("📄 File content preview:")
  const content = fs.readFileSync(envPath, "utf8")
  console.log(content.split("\n").slice(0, 5).join("\n") + "...")
}

// Cargar variables de entorno
config({ path: envPath })

// También intentar cargar desde .env
config({ path: path.resolve(process.cwd(), ".env") })

async function seed() {
  console.log("🌱 Seeding database...")

  // Debug: mostrar variables de entorno
  console.log("🔍 Checking environment variables...")
  console.log("NODE_ENV:", process.env.NODE_ENV)
  console.log("POSTGRES_URL_NON_POOLING exists:", !!process.env.POSTGRES_URL_NON_POOLING)

  // Intentar diferentes nombres de variables
  const connectionString =
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    "postgres://postgres.yencvzyflvzhcfsiakph:WdBTm3YZxhu9BZKp@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"

  console.log("🔗 Using connection string:", connectionString.substring(0, 50) + "...")

  if (!connectionString || connectionString.includes("undefined")) {
    console.error("❌ No valid connection string found")
    console.log("Available env vars:")
    Object.keys(process.env)
      .filter((key) => key.includes("POSTGRES") || key.includes("DATABASE"))
      .forEach((key) => console.log(`  ${key}: ${process.env[key] ? "SET" : "NOT SET"}`))

    console.log("\n🔧 Using hardcoded Supabase URL for now...")
  }

  console.log("🔗 Connecting to Supabase...")

  // Crear cliente con configuración SSL para Supabase
  const client = postgres(connectionString, {
    prepare: false,
    ssl: "require",
    max: 1,
  })

  const db = drizzle(client, { schema: { vehicles, settings } })

  try {
    console.log("🧪 Testing connection...")
    await client`SELECT 1 as test`
    console.log("✅ Connection successful!")

    console.log("📦 Inserting vehicles...")

    // Insertar vehículos actuales
    const vehiclesData = [
      {
        name: "GTX 130",
        type: "jetski",
        capacity: 2,
        pricing: [
          { duration: "30min", price: 99, label: "30 min" },
          { duration: "1hour", price: 180, label: "1 hora" },
        ],
        includes: ["Gasolina", "Chalecos", "IVA", "Fotos"],
        fuelIncluded: true,
        description: "Moto de agua premium con excelente estabilidad y potencia",
        image: "/assets/motos/moto1.png",
        available: true,
      },
      {
        name: "SPARK TRIXX 120 RS",
        type: "jetski",
        capacity: 2,
        pricing: [
          { duration: "30min", price: 110, label: "30 min" },
          { duration: "1hour", price: 199, label: "1 hora" },
        ],
        includes: ["Gasolina", "Chalecos", "IVA", "Fotos"],
        fuelIncluded: true,
        description: "Moto deportiva con características acrobáticas únicas",
        image: "/assets/motos/moto2.png",
        available: true,
      },
      {
        name: "INVICTUS FX 190",
        type: "boat",
        capacity: 8,
        pricing: [
          { duration: "halfday", price: 390, label: "Medio día" },
          { duration: "fullday", price: 590, label: "Todo el día" },
        ],
        includes: ["Chalecos", "IVA", "Fotos"],
        fuelIncluded: false,
        description: "Barco espacioso perfecto para grupos, ideal para excursiones",
        image: "/assets/barcos/barco1.png",
        available: true,
      },
    ]

    // Insertar vehículos
    for (const vehicle of vehiclesData) {
      try {
        const result = await db.insert(vehicles).values(vehicle).returning()
        console.log(`✅ Inserted vehicle: ${vehicle.name} (ID: ${result[0].id})`)
      } catch (error: any) {
        if (error.message?.includes("duplicate") || error.code === "23505") {
          console.log(`⚠️  Vehicle ${vehicle.name} already exists, skipping...`)
        } else {
          console.error(`❌ Error inserting ${vehicle.name}:`, error.message)
        }
      }
    }

    console.log("⚙️  Inserting settings...")

    // Configuración inicial
    const settingsData = [
      {
        key: "business_hours",
        value: { start: "09:00", end: "19:00" },
        description: "Horario de operación del negocio",
      },
      {
        key: "booking_advance_days",
        value: 30,
        description: "Días de antelación máxima para reservas",
      },
      {
        key: "contact_info",
        value: {
          phone: "+34 123 456 789",
          email: "info@oroboats.com",
          address: "Puerto Marina Valencia, Muelle VIP 15",
        },
        description: "Información de contacto del negocio",
      },
    ]

    // Insertar configuraciones
    for (const setting of settingsData) {
      try {
        await db
          .insert(settings)
          .values(setting)
          .onConflictDoUpdate({
            target: settings.key,
            set: { value: setting.value, updatedAt: new Date() },
          })
        console.log(`✅ Upserted setting: ${setting.key}`)
      } catch (error: any) {
        console.error(`❌ Error inserting setting ${setting.key}:`, error.message)
      }
    }

    console.log("✅ Database seeded successfully!")
    console.log("📊 Summary:")
    console.log(`   - ${vehiclesData.length} vehicles processed`)
    console.log(`   - ${settingsData.length} settings processed`)
  } catch (error) {
    console.error("❌ Error seeding database:", error)
    process.exit(1)
  } finally {
    // Cerrar conexión
    await client.end()
    console.log("🔌 Database connection closed")
  }
}

// Ejecutar seed
seed().catch((error) => {
  console.error("❌ Seed script failed:", error)
  process.exit(1)
})
