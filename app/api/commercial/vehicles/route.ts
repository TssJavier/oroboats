import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hotels, vehicles, locations } from "@/lib/db/schema"
import { eq, sql, and } from "drizzle-orm"
import { verifyToken } from "@/lib/auth"

const CARBONERAS_KEYWORD = "carboneras"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("admin-token")?.value
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    // Find hotel codes assigned to this commercial
    const assignedHotels = await db
      .select()
      .from(hotels)
      .where(sql`LOWER(${hotels.commercialEmail}) = LOWER(${user.email})`)

    if (assignedHotels.length === 0) {
      return NextResponse.json({ vehicles: [], hotelCode: "" })
    }

    const hotelCode = assignedHotels[0].code

    // Find Carboneras location
    const allLocations = await db.select().from(locations)
    const carboneras = allLocations.find(
      (l) =>
        l.name.toLowerCase().includes(CARBONERAS_KEYWORD) ||
        l.id.toLowerCase().includes(CARBONERAS_KEYWORD)
    )

    // Get active vehicles filtered by Carboneras location
    const activeVehicles = await db
      .select({
        id: vehicles.id,
        name: vehicles.name,
        type: vehicles.type,
        image: vehicles.image,
        capacity: vehicles.capacity,
      })
      .from(vehicles)
      .where(
        carboneras
          ? and(eq(vehicles.available, true), eq(vehicles.beachLocationId, carboneras.id))
          : eq(vehicles.available, true)
      )

    return NextResponse.json({
      vehicles: activeVehicles,
      hotelCode,
    })
  } catch (error) {
    console.error("Error fetching commercial vehicles:", error)
    return NextResponse.json(
      { error: "Error al obtener vehículos" },
      { status: 500 }
    )
  }
}
