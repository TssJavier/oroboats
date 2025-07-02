import { db } from "./index"
import { vehicles } from "./schema"
import { eq } from "drizzle-orm"

export async function getVehicleById(id: number) {
  const result = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1)

  return result[0] || null
}