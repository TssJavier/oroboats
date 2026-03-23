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

// Slug de Almuñécar en base de datos (se detecta automáticamente si no se pasa location)
const DEFAULT_LOCATION_KEYWORD = "carboneras"

function EmbedBoatsContent() {
  const searchParams = useSearchParams()
  const hotelCode = searchParams.get("hotelCode") || ""
  // Permite forzar ubicación via ?location=slug, si no busca Almuñécar automáticamente
  const locationParam = searchParams.get("location") || ""
  const { language } = useApp()

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [resolvedLocation, setResolvedLocation] = useState<string>("")
  const [locationName, setLocationName] = useState<string>("")

  useEffect(() => {
    async function loadVehicles() {
      try {
        let locationId = locationParam

        // Si no se pasa location explícita, auto-detectar Carboneras
        const locRes = await fetch("/api/locations")
        if (locRes.ok) {
          const locs: { id: string; name: string }[] = await locRes.json()
          if (!locationId) {
            const match = locs.find((l) =>
              l.name.toLowerCase().includes(DEFAULT_LOCATION_KEYWORD) ||
              l.id.toLowerCase().includes(DEFAULT_LOCATION_KEYWORD)
            )
            if (match) {
              locationId = match.id
              setLocationName(match.name)
            }
          } else {
            const match = locs.find((l) => l.id === locationId)
            if (match) setLocationName(match.name)
          }
        }

        setResolvedLocation(locationId)

        const url = locationId
          ? `/api/vehicles?beachLocationId=${encodeURIComponent(locationId)}`
          : "/api/vehicles"

        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          setVehicles(data)
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }

    loadVehicles()
  }, [locationParam])

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
      <div className="flex flex-col items-center justify-center min-h-[600px]">
        <Loader2 className="h-10 w-10 animate-spin text-yellow-500" />
        <span className="mt-4 text-gray-600 text-lg">{t.loading}</span>
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
        {locationName && (
          <p className="text-yellow-600 font-semibold mt-1">{locationName}</p>
        )}
        <p className="text-gray-600 mt-1">{t.subtitle}</p>
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

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {vehicle.capacity} {t.people}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Fuel className="h-3 w-3 mr-1" />
                    {vehicle.fuelIncluded ? t.fuelIncluded : t.fuelSeparate}
                  </Badge>
                  <Badge
                    className={`text-xs ${
                      vehicle.requiresLicense
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-green-50 text-green-700 border-green-200"
                    }`}
                    variant="outline"
                  >
                    {vehicle.requiresLicense
                      ? (language === "es" ? "Requiere licencia" : "License required")
                      : (language === "es" ? "Sin licencia" : "No license needed")}
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
                      const params = new URLSearchParams({ hotelCode })
                      if (resolvedLocation) params.set("location", resolvedLocation)
                      window.location.href = `/embed/boats/${vehicle.id}/book?${params.toString()}`
                    }}
                    className="!bg-black !text-white hover:!bg-yellow-500 hover:!text-black transition-all"
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
        <div className="flex flex-col items-center justify-center min-h-[600px]">
          <Loader2 className="h-10 w-10 animate-spin text-yellow-500" />
          <span className="mt-4 text-gray-600 text-lg">Cargando embarcaciones...</span>
        </div>
      }
    >
      <EmbedBoatsContent />
    </Suspense>
  )
}
