import { type NextRequest, NextResponse } from "next/server"
import { updateBookingStatus } from "@/lib/db/queries"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params
    const { status } = await request.json()

    await updateBookingStatus(Number.parseInt(id), status)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating booking:", error)
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 })
  }
}
