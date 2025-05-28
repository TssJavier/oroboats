import { Navigation } from "@/components/navigation"
import { BookingForm } from "@/components/booking/booking-form"
import { Footer } from "@/components/footer"
import { getVehicleById } from "@/lib/db/queries"
import { notFound } from "next/navigation"

interface BookingPageProps {
  params: Promise<{ id: string }>
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { id } = await params
  const vehicleId = Number.parseInt(id)

  if (isNaN(vehicleId)) {
    notFound()
  }

  const vehicle = await getVehicleById(vehicleId)

  if (!vehicle || !vehicle.available) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <BookingForm vehicle={vehicle} />
      <Footer />
    </div>
  )
}
