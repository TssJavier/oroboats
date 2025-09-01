import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

const connectionString =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL

if (!connectionString) {
  throw new Error("Database connection string is not defined")
}

const client = postgres(connectionString, {
  prepare: false,
  ssl: "require",
  max: 10, // Máximo de conexiones
  idle_timeout: 20,
  connect_timeout: 10,
})

export const db = drizzle(client, { schema })

export { client }
