import { type NextRequest, NextResponse } from "next/server"
import { getVehicleById, updateVehicle, deleteVehicle } from "@/lib/db/queries"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params
    console.log(`🚗 API: Fetching vehicle ${id}...`)
    const vehicle = await getVehicleById(Number.parseInt(id))
    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
    }
    console.log(`✅ API: Vehicle ${id} found`)
    return NextResponse.json(vehicle)
  } catch (error) {
    console.error(`❌ API Error fetching vehicle:`, error)
    return NextResponse.json(
      {
        error: "Failed to fetch vehicle",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params
    console.log(`🚗 API: Updating vehicle ${id}...`)
    const body = await request.json()
    const vehicle = await updateVehicle(Number.parseInt(id), body)
    console.log(`✅ API: Vehicle ${id} updated`)
    return NextResponse.json(vehicle[0])
  } catch (error) {
    console.error(`❌ API Error updating vehicle:`, error)
    return NextResponse.json(
      {
        error: "Failed to update vehicle",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params
    console.log(`🗑️ API: Deleting vehicle ${id}...`)
    const vehicleId = Number.parseInt(id)

    if (isNaN(vehicleId)) {
      return NextResponse.json({ error: "Invalid vehicle ID" }, { status: 400 })
    }

    // Verificar que el vehículo existe antes de eliminarlo
    const vehicle = await getVehicleById(vehicleId)
    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
    }

    await deleteVehicle(vehicleId)
    console.log(`✅ API: Vehicle ${id} deleted successfully`)

    return NextResponse.json({ success: true, message: "Vehicle deleted successfully" })
  } catch (error) {
    console.error(`❌ API Error deleting vehicle:`, error)
    return NextResponse.json(
      {
        error: "Failed to delete vehicle",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
