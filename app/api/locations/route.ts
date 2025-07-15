import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { locations } from "@/lib/db/schema"

export async function GET() {
  try {
    console.log("🏖️ Fetching beach locations...")

    const locationResults = await db.select().from(locations).orderBy(locations.name)

    console.log(`✅ Found ${locationResults.length} beach locations`)

    return NextResponse.json(locationResults)
  } catch (error) {
    console.error("❌ Error fetching locations:", error)
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name } = body

    if (!id || !name) {
      return NextResponse.json({ error: "ID and name are required" }, { status: 400 })
    }

    const newLocation = await db
      .insert(locations)
      .values({
        id,
        name,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return NextResponse.json(newLocation[0], { status: 201 })
  } catch (error) {
    console.error("❌ Error creating location:", error)
    return NextResponse.json({ error: "Failed to create location" }, { status: 500 })
  }
}
