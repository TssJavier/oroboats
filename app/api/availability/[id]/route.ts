import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/db-supabase"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params
    const vehicleId = Number.parseInt(id)
    const { searchParams } = new URL(request.url)
    const year = searchParams.get("year")
    const month = searchParams.get("month")
    const checkFullDays = searchParams.get("checkFullDays") === "true"

    if (isNaN(vehicleId)) {
      return NextResponse.json({ error: "Invalid vehicle ID" }, { status: 400 })
    }

    console.log("🔍 GET availability for vehicle:", vehicleId)

    // ✅ USAR SUPABASE EN LUGAR DE NEON
    const { data: availability, error: availabilityError } = await supabaseAdmin
      .from("vehicle_availability")
      .select("*")
      .eq("vehicle_id", vehicleId)

    if (availabilityError) {
      console.error("❌ Error fetching availability:", availabilityError)
      return NextResponse.json(
        {
          error: "Failed to fetch availability",
          details: availabilityError.message,
        },
        { status: 500 },
      )
    }

    // Si no hay disponibilidad, crear disponibilidad por defecto
    if (!availability || availability.length === 0) {
      console.log("⚠️ No hay disponibilidad para el vehículo", vehicleId, "- Creando por defecto")

      const defaultAvailability = []
      for (let day = 0; day <= 6; day++) {
        const newAvailability = {
          vehicle_id: vehicleId,
          day_of_week: day,
          start_time: "09:00:00",
          end_time: "19:00:00",
          is_available: true,
        }

        const { data: inserted, error: insertError } = await supabaseAdmin
          .from("vehicle_availability")
          .insert([newAvailability])
          .select()

        if (!insertError && inserted) {
          defaultAvailability.push(inserted[0])
        }
      }

      return NextResponse.json({
        availability: defaultAvailability,
        message: "Disponibilidad creada por defecto",
      })
    }

    // Obtener fechas bloqueadas
    const { data: blocked, error: blockedError } = await supabaseAdmin
      .from("blocked_dates")
      .select("date")
      .eq("vehicle_id", vehicleId)

    const blockedDatesArray = blocked?.map((item) => item.date) || []

    // Obtener fechas completamente reservadas si se solicita
    const fullyBookedDates: string[] = []

    if (checkFullDays && year && month) {
      try {
        const { data: fullyBooked, error: fullyBookedError } = await supabaseAdmin.rpc("get_fully_booked_dates", {
          p_vehicle_id: vehicleId,
          p_year: Number.parseInt(year),
          p_month: Number.parseInt(month),
        })

        if (!fullyBookedError && fullyBooked) {
          fullyBookedDates.push(...fullyBooked.map((row: any) => row.date))
        }
      } catch (error) {
        console.error("Error checking fully booked dates:", error)
      }
    }

    return NextResponse.json({
      vehicleId,
      availability,
      blockedDates: blockedDatesArray,
      fullyBookedDates,
    })
  } catch (error) {
    console.error("Error fetching availability:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch availability",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
