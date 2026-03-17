"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Ship, Zap, Users, Fuel, Loader2 } from "lucide-react"
import { useApp } from "@/components/providers"

interface PricingOption {
  duration: string
  price: number
  label: string
}

interface Vehicle {
  id: number
  name: string
  image: string
  capacity: number
  pricing: PricingOption[]
  includes: string[]
  fuelIncluded: boolean
  description: string
  type: string
  category?: string
  requiresLicense?: boolean
  available?: boolean
  securityDeposit?: number | null
}

function EmbedBoatsContent() {
  const searchParams = useSearchParams()
  const hotelCode = searchParams.get("hotelCode") || ""
  const { language } = useApp()

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/vehicles")
      .then((res) => res.json())
      .then((data) => {
        setVehicles(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const t = language === "es"
    ? {
        title: "Nuestras embarcaciones",
        subtitle: "Selecciona una embarcación para reservar",
        from: "Desde",
        book: "Reservar",
        people: "personas",
        loading: "Cargando embarcaciones...",
        noVehicles: "No hay embarcaciones disponibles en este momento.",
        fuelIncluded: "Combustible incluido",
        fuelSeparate: "Combustible no incluido",
      }
    : {
        title: "Our boats",
        subtitle: "Select a boat to book",
        from: "From",
        book: "Book now",
        people: "people",
        loading: "Loading boats...",
        noVehicles: "No boats available at this time.",
        fuelIncluded: "Fuel included",
        fuelSeparate: "Fuel not included",
      }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
        <span className="ml-3 text-gray-600">{t.loading}</span>
      </div>
    )
  }

  const getMinPrice = (pricing: PricingOption[]) => {
    if (!pricing || pricing.length === 0) return 0
    return Math.min(...pricing.map((p) => p.price))
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-black">{t.title}</h1>
        <p className="text-gray-600 mt-2">{t.subtitle}</p>
      </div>

      {vehicles.length === 0 ? (
        <p className="text-center text-gray-500">{t.noVehicles}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="overflow-hidden hover:shadow-lg transition-shadow border border-gray-200">
              <div className="relative w-full h-48 bg-gray-50">
                <Image
                  src={vehicle.image || "/placeholder.svg"}
                  alt={vehicle.name}
                  fill
                  className="object-contain p-4"
                />
              </div>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  {vehicle.type === "jetski" ? (
                    <Zap className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <Ship className="h-5 w-5 text-yellow-500" />
                  )}
                  <h3 className="text-lg font-bold text-black">{vehicle.name}</h3>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{vehicle.description}</p>

                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center text-sm text-gray-500">
                    <Users className="h-4 w-4 mr-1 text-yellow-500" />
                    {vehicle.capacity} {t.people}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    <Fuel className="h-3 w-3 mr-1" />
                    {vehicle.fuelIncluded ? t.fuelIncluded : t.fuelSeparate}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-500">{t.from}</span>
                    <span className="text-xl font-bold text-yellow-600 ml-1">
                      €{getMinPrice(vehicle.pricing)}
                    </span>
                  </div>
                  <Button
                    onClick={() => {
                      window.location.href = `/embed/boats/${vehicle.id}/book?hotelCode=${encodeURIComponent(hotelCode)}`
                    }}
                    className="bg-black text-white hover:bg-yellow-500 hover:text-black transition-all"
                  >
                    {t.book}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="text-center mt-8 text-xs text-gray-400">
        Powered by <span className="font-semibold">OroBoats</span>
      </div>
    </div>
  )
}

export default function EmbedBoatsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
        </div>
      }
    >
      <EmbedBoatsContent />
    </Suspense>
  )
}
