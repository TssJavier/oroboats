import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { locations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

interface RouteParams {
  params: { id: string }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const id = params.id
    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const updatedLocation = await db
      .update(locations)
      .set({ name, updatedAt: new Date() })
      .where(eq(locations.id, id))
      .returning()

    if (updatedLocation.length === 0) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 })
    }

    return NextResponse.json(updatedLocation[0])
  } catch (error) {
    console.error("❌ Error updating location:", error)
    return NextResponse.json({ error: "Failed to update location" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const id = params.id

    const deletedLocation = await db.delete(locations).where(eq(locations.id, id)).returning()

    if (deletedLocation.length === 0) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Location deleted successfully" })
  } catch (error) {
    console.error("❌ Error deleting location:", error)
    return NextResponse.json({ error: "Failed to delete location" }, { status: 500 })
  }
}
