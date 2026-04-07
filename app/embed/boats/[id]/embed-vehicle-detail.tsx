"use client"

import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Ship, Zap, Users, Fuel, Clock, CheckCircle } from "lucide-react"
import { useApp } from "@/components/providers"
import type { Vehicle } from "@/lib/db/schema"

interface PricingOption {
  duration: string
  price: number
  label: string
}

const translations = {
  es: {
    from: "Desde",
    book: "Reservar ahora",
    people: "personas",
    fuelIncluded: "Combustible incluido",
    fuelSeparate: "Combustible no incluido",
    licenseRequired: "Requiere licencia",
    noLicense: "Sin licencia",
    includes: "Incluye",
    prices: "Tarifas",
    powered: "Powered by",
  },
  en: {
    from: "From",
    book: "Book now",
    people: "people",
    fuelIncluded: "Fuel included",
    fuelSeparate: "Fuel not included",
    licenseRequired: "License required",
    noLicense: "No license needed",
    includes: "Includes",
    prices: "Pricing",
    powered: "Powered by",
  },
}

export function EmbedVehicleDetail({ vehicle }: { vehicle: Vehicle }) {
  const searchParams = useSearchParams()
  const hotelCode = searchParams.get("hotelCode") || ""
  const location = searchParams.get("location") || ""
  const { language } = useApp()
  const t = translations[language]

  const pricing = (vehicle.pricing as PricingOption[]) || []
  const includes = (vehicle.includes as string[]) || []
  const minPrice = pricing.length > 0 ? Math.min(...pricing.map((p) => p.price)) : 0

  const handleBook = () => {
    const params = new URLSearchParams()
    if (hotelCode) params.set("hotelCode", hotelCode)
    if (location) params.set("location", location)
    const qs = params.toString()
    window.location.href = `/embed/boats/${vehicle.id}/book${qs ? `?${qs}` : ""}`
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <Card className="overflow-hidden border border-gray-200 shadow-lg">
        {/* Image */}
        <div className="relative w-full h-56 md:h-72 bg-gray-50">
          <Image
            src={vehicle.image || "/placeholder.svg"}
            alt={vehicle.name}
            fill
            className="object-contain p-6"
          />
        </div>

        <CardContent className="p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            {vehicle.type === "jetski" ? (
              <Zap className="h-6 w-6 text-yellow-500" />
            ) : (
              <Ship className="h-6 w-6 text-yellow-500" />
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-black">{vehicle.name}</h1>
          </div>

          {/* Description */}
          <p className="text-gray-600 mb-4">{vehicle.description}</p>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <Badge variant="outline" className="text-sm py-1 px-3">
              <Users className="h-4 w-4 mr-1" />
              {vehicle.capacity} {t.people}
            </Badge>
            <Badge variant="outline" className="text-sm py-1 px-3">
              <Fuel className="h-4 w-4 mr-1" />
              {vehicle.fuelIncluded ? t.fuelIncluded : t.fuelSeparate}
            </Badge>
            <Badge
              className={`text-sm py-1 px-3 ${
                vehicle.requiresLicense
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-green-50 text-green-700 border-green-200"
              }`}
              variant="outline"
            >
              {vehicle.requiresLicense ? t.licenseRequired : t.noLicense}
            </Badge>
          </div>

          {/* Pricing table */}
          {pricing.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-black mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                {t.prices}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {pricing.map((option) => (
                  <div
                    key={option.duration}
                    className="border border-gray-200 rounded-lg p-3 text-center hover:border-yellow-400 transition-colors"
                  >
                    <span className="text-sm text-gray-500 block">{option.label}</span>
                    <span className="text-xl font-bold text-yellow-600">{option.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Includes */}
          {includes.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-black mb-3">{t.includes}</h2>
              <ul className="space-y-1">
                {includes.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div>
              <span className="text-sm text-gray-500">{t.from}</span>
              <span className="text-2xl font-bold text-yellow-600 ml-2">{minPrice}</span>
            </div>
            <Button
              onClick={handleBook}
              size="lg"
              className="!bg-black !text-white hover:!bg-yellow-500 hover:!text-black transition-all text-base px-8"
            >
              {t.book}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-center mt-6 text-xs text-gray-400">
        {t.powered} <span className="font-semibold">OroBoats</span>
      </div>
    </div>
  )
}
