import { type NextRequest, NextResponse } from "next/server"
import { getVehicles, getAllVehicles, createVehicle } from "@/lib/db/queries"

export async function GET(request: NextRequest) {
  try {
    console.log("🚗 API: Fetching vehicles...")
    const { searchParams } = new URL(request.url)
    const includeUnavailable = searchParams.get("all") === "true"

    const vehicles = includeUnavailable ? await getAllVehicles() : await getVehicles()
    console.log(`✅ API: Found ${vehicles.length} vehicles`)

    return NextResponse.json(vehicles)
  } catch (error) {
    console.error("❌ API Error fetching vehicles:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch vehicles",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🚗 API: Creating vehicle...")
    const body = await request.json()
    const vehicle = await createVehicle(body)
    console.log("✅ API: Vehicle created successfully")

    return NextResponse.json(vehicle[0], { status: 201 })
  } catch (error) {
    console.error("❌ API Error creating vehicle:", error)
    return NextResponse.json(
      {
        error: "Failed to create vehicle",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
