import type { Config } from "drizzle-kit"
import { config } from "dotenv"

// Cargar variables de entorno
config({ path: ".env.local" })

const connectionString = process.env.POSTGRES_URL_NON_POOLING

if (!connectionString) {
  throw new Error("POSTGRES_URL_NON_POOLING is not defined")
}

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString,
  },
  verbose: true,
  strict: true,
} satisfies Config
