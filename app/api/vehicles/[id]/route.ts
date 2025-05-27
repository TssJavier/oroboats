import { type NextRequest, NextResponse } from "next/server"
import { getVehicleById, updateVehicle, deleteVehicle } from "@/lib/db/queries"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log(`🚗 API: Fetching vehicle ${params.id}...`)
    const vehicle = await getVehicleById(Number.parseInt(params.id))
    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
    }
    console.log(`✅ API: Vehicle ${params.id} found`)
    return NextResponse.json(vehicle)
  } catch (error) {
    console.error(`❌ API Error fetching vehicle ${params.id}:`, error)
    return NextResponse.json(
      {
        error: "Failed to fetch vehicle",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log(`🚗 API: Updating vehicle ${params.id}...`)
    const body = await request.json()
    const vehicle = await updateVehicle(Number.parseInt(params.id), body)
    console.log(`✅ API: Vehicle ${params.id} updated`)
    return NextResponse.json(vehicle[0])
  } catch (error) {
    console.error(`❌ API Error updating vehicle ${params.id}:`, error)
    return NextResponse.json(
      {
        error: "Failed to update vehicle",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log(`🗑️ API: Deleting vehicle ${params.id}...`)
    const vehicleId = Number.parseInt(params.id)

    if (isNaN(vehicleId)) {
      return NextResponse.json({ error: "Invalid vehicle ID" }, { status: 400 })
    }

    // Verificar que el vehículo existe antes de eliminarlo
    const vehicle = await getVehicleById(vehicleId)
    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
    }

    await deleteVehicle(vehicleId)
    console.log(`✅ API: Vehicle ${params.id} deleted successfully`)

    return NextResponse.json({ success: true, message: "Vehicle deleted successfully" })
  } catch (error) {
    console.error(`❌ API Error deleting vehicle ${params.id}:`, error)
    return NextResponse.json(
      {
        error: "Failed to delete vehicle",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
