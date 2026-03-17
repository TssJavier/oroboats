import { BookingForm } from "@/components/booking/booking-form"
import { notFound } from "next/navigation"
import { getVehicleById } from "@/lib/db/vehicle-queries"

interface EmbedBookingPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EmbedBookingPage({ params }: EmbedBookingPageProps) {
  const { id } = await params
  const vehicleId = Number(id)

  if (isNaN(vehicleId)) {
    return notFound()
  }

  const vehicle = await getVehicleById(vehicleId)

  if (!vehicle) {
    return notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BookingForm vehicle={vehicle} embedded />
    </div>
  )
}
