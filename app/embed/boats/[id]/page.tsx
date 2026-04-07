import { notFound } from "next/navigation"
import { getVehicleById } from "@/lib/db/vehicle-queries"
import { EmbedVehicleDetail } from "./embed-vehicle-detail"

interface EmbedVehiclePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EmbedVehiclePage({ params }: EmbedVehiclePageProps) {
  const { id } = await params
  const vehicleId = Number(id)

  if (isNaN(vehicleId)) {
    return notFound()
  }

  const vehicle = await getVehicleById(vehicleId)

  if (!vehicle || !vehicle.available) {
    return notFound()
  }

  return <EmbedVehicleDetail vehicle={vehicle} />
}
