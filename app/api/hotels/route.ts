import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db/index"
import { hotels } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    console.log("🔍 API: Fetching hotels")
    const allHotels = await db.select().from(hotels)
    console.log(`✅ API: Found ${allHotels.length} hotels.`)
    return NextResponse.json(allHotels)
  } catch (error) {
    console.error("❌ API Error fetching hotels:", error)
    return NextResponse.json({ error: "Failed to fetch hotels", details: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const newHotelData = await req.json()
    console.log("🔍 API: Creating new hotel with data:", newHotelData)

    // Basic validation
    if (!newHotelData.name || !newHotelData.code) {
      return NextResponse.json({ error: "Name and code are required" }, { status: 400 })
    }

    const [newHotel] = await db.insert(hotels).values(newHotelData).returning()
    console.log("✅ API: Hotel created successfully:", newHotel)
    return NextResponse.json(newHotel, { status: 201 })
  } catch (error) {
    console.error("❌ API: Error creating hotel:", error)
    return NextResponse.json({ error: "Failed to create hotel", details: error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: "Hotel ID is required" }, { status: 400 })
    }

    console.log(`🔍 API: Updating hotel ${id} with:`, updateData)
    const [updated] = await db
      .update(hotels)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(hotels.id, Number(id)))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 })
    }

    console.log("✅ API: Hotel updated:", updated)
    return NextResponse.json(updated)
  } catch (error) {
    console.error("❌ API: Error updating hotel:", error)
    return NextResponse.json({ error: "Failed to update hotel", details: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Hotel ID is required" }, { status: 400 })
    }

    console.log(`🔍 API: Deleting hotel with ID: ${id}`)
    const deletedHotels = await db
      .delete(hotels)
      .where(eq(hotels.id, Number(id)))
      .returning()

    if (deletedHotels.length === 0) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 })
    }

    console.log("✅ API: Hotel deleted successfully:", deletedHotels[0])
    return NextResponse.json({ message: "Hotel deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("❌ API: Error deleting hotel:", error)
    return NextResponse.json({ error: "Failed to delete hotel", details: error.message }, { status: 500 })
  }
}
