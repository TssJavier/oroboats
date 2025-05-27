import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

// Debug: mostrar variables de entorno
console.log("🔍 DB Connection Debug:")
console.log("NODE_ENV:", process.env.NODE_ENV)
console.log("POSTGRES_URL_NON_POOLING exists:", !!process.env.POSTGRES_URL_NON_POOLING)

// Verificar que tenemos la URL de conexión
const connectionString =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  // URL de respaldo (temporal para desarrollo)
  "postgres://postgres.yencvzyflvzhcfsiakph:WdBTm3YZxhu9BZKp@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"

if (!connectionString || connectionString.includes("undefined")) {
  console.error("❌ No database connection string found")
  console.log("Available env vars:")
  Object.keys(process.env)
    .filter((key) => key.includes("POSTGRES") || key.includes("DATABASE"))
    .forEach((key) => console.log(`  ${key}: ${process.env[key] ? "SET" : "NOT SET"}`))
}

console.log("🔗 Using connection:", connectionString.substring(0, 50) + "...")

// Crear cliente de postgres con configuración SSL para Supabase
const client = postgres(connectionString, {
  prepare: false,
  ssl: "require",
  max: 10, // Máximo de conexiones
  idle_timeout: 20,
  connect_timeout: 10,
})

// Crear instancia de drizzle
export const db = drizzle(client, { schema })

// Exportar cliente para uso directo si es necesario
export { client }
