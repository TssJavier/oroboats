// app/boats/[id]/book/page.tsx

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { BookingForm } from "@/components/booking/booking-form"
import { notFound } from "next/navigation"
import { getVehicleById } from "@/lib/db/vehicle-queries" // Ajusta esta ruta a tu proyecto

interface BookingPageProps {
  params: {
    id: string
  }
}

export default async function BookingPage({ params }: BookingPageProps) {
  const vehicleId = Number(params.id)

  if (isNaN(vehicleId)) {
    return notFound()
  }

  const vehicle = await getVehicleById(vehicleId)

  if (!vehicle) {
    return notFound()
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <BookingForm vehicle={vehicle} />
      <Footer />
    </div>
  )
}
