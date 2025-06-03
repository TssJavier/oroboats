"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Ship, Zap, Users, Clock, Calendar, Fuel } from 'lucide-react'
import Link from "next/link"
import Image from "next/image"
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
  available: boolean
}

interface Translations {
  title: string
  subtitle: string
  boats: string
  jetskis: string
  reserve: string
  from: string
  capacity: string
  includes: string
  available: string
  fuelSeparate: string
  noVehicles: string
  loading: string
  error: string
}

const translations = {
  es: {
    title: "Nuestra Flota",
    subtitle: "Motos de agua y barcos para experiencias inolvidables",
    boats: "Barcos",
    jetskis: "Motos de Agua",
    reserve: "Reservar",
    from: "Desde",
    capacity: "Capacidad",
    includes: "Incluye",
    available: "Disponible",
    fuelSeparate: "Gasolina aparte",
    noVehicles: "No hay vehículos disponibles",
    loading: "Cargando...",
    error: "Error al cargar los vehículos. Inténtalo de nuevo más tarde."
  },
  en: {
    title: "Our Fleet",
    subtitle: "Jet skis and boats for unforgettable experiences",
    boats: "Boats",
    jetskis: "Jet Skis",
    reserve: "Reserve",
    from: "From",
    capacity: "Capacity",
    includes: "Includes",
    available: "Available",
    fuelSeparate: "Fuel separate",
    noVehicles: "No vehicles available",
    loading: "Loading...",
    error: "Error loading vehicles. Please try again later."
  },
}

export function BoatsSection() {
  const { language } = useApp()
  const t = translations[language]
  const [activeTab, setActiveTab] = useState("jetskis")
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      setError(null)
      const response = await fetch("/api/vehicles")
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Verificar que la respuesta sea un array
      if (Array.isArray(data)) {
        setVehicles(data)
      } else {
        console.error("API returned non-array data:", data)
        setError("API returned invalid data format")
        setVehicles([]) // Mantener array vacío si hay error
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error)
      setError(error instanceof Error ? error.message : "Unknown error")
      setVehicles([]) // Asegurar que vehicles siempre sea un array
    } finally {
      setLoading(false)
    }
  }

  // Ahora vehicles siempre será un array, así que filter funcionará
  const jetskis = vehicles.filter((v) => v.type === "jetski")
  const boats = vehicles.filter((v) => v.type === "boat")

  if (loading) {
    return (
      <section className="py-24 bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-6">{t.title}</h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto">{t.loading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-72 bg-gray-200"></div>
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-24 bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-6">{t.title}</h1>
            <p className="text-xl md:text-2xl text-red-600 max-w-4xl mx-auto">{t.error}</p>
            <Button 
              onClick={() => {
                setLoading(true);
                fetchVehicles();
              }}
              className="mt-8 bg-black text-white hover:bg-gold hover:text-black"
            >
              Intentar de nuevo
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-24 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-6">{t.title}</h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto">{t.subtitle}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-2 mb-16 bg-gray-100 border border-gray-200 h-16 p-2">
            <TabsTrigger
              value="jetskis"
              className="data-[state=active]:bg-black data-[state=active]:text-white text-gray-600 hover:text-black transition-colors text-lg font-semibold h-12 rounded-lg"
            >
              <Zap className="h-5 w-5 mr-3" />
              {t.jetskis}
            </TabsTrigger>
            <TabsTrigger
              value="boats"
              className="data-[state=active]:bg-black data-[state=active]:text-white text-gray-600 hover:text-black transition-colors text-lg font-semibold h-12 rounded-lg"
            >
              <Ship className="h-5 w-5 mr-3" />
              {t.boats}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jetskis" className="mt-0">
            {jetskis.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {jetskis.map((jetski) => (
                  <VehicleCard key={jetski.id} vehicle={jetski} t={t} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Zap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">{t.noVehicles}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="boats" className="mt-0">
            {boats.length > 0 ? (
              <div className="grid grid-cols-1 gap-8 max-w-3xl mx-auto">
                {boats.map((boat) => (
                  <VehicleCard key={boat.id} vehicle={boat} t={t} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Ship className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">{t.noVehicles}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}

function VehicleCard({ vehicle, t }: { vehicle: Vehicle; t: Translations }) {
  const getLowestPrice = () => {
    return Math.min(...vehicle.pricing.map((p) => p.price))
  }

  return (
    <Card className="bg-white border border-gray-200 hover:border-gold hover:shadow-lg transition-all duration-300 group overflow-hidden">
      <div className="relative">
        <div className="w-full h-72 bg-gray-50 flex items-center justify-center overflow-hidden">
          <Image
            src={vehicle.image || "/placeholder.svg"}
            alt={vehicle.name}
            width={500}
            height={300}
            className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300 p-4"
            style={{
              filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))",
            }}
          />
        </div>
        <Badge className="absolute top-4 right-4 bg-gold text-black font-semibold">{t.available}</Badge>
        {!vehicle.fuelIncluded && (
          <Badge className="absolute top-4 left-4 bg-orange-500 text-white font-semibold">
            <Fuel className="h-3 w-3 mr-1" />
            {t.fuelSeparate}
          </Badge>
        )}
      </div>

      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold text-black group-hover:text-gold transition-colors">
          {vehicle.name}
        </CardTitle>
        <CardDescription className="text-gray-600 text-base">{vehicle.description}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between text-base">
            <span className="flex items-center text-gray-500 font-medium">
              <Users className="h-5 w-5 mr-2 text-gold" />
              {t.capacity}
            </span>
            <span className="text-black font-semibold">{vehicle.capacity} personas</span>
          </div>

          <div className="space-y-3">
            <span className="flex items-center text-gray-500 text-base font-medium">
              <Clock className="h-5 w-5 mr-2 text-gold" />
              Precios:
            </span>
            <div className="grid grid-cols-2 gap-3">
              {vehicle.pricing.map((option, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
                  <div className="text-xl font-bold text-gold">€{option.price}</div>
                  <div className="text-sm text-gray-600 font-medium">{option.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-gray-500 text-base font-medium">{t.includes}:</span>
            <div className="flex flex-wrap gap-2">
              {vehicle.includes.map((item, index) => (
                <Badge key={index} variant="outline" className="text-sm py-1 px-3">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-gray-500 text-base">{t.from}</span>
            <div className="text-3xl font-bold text-gold">€{getLowestPrice()}</div>
          </div>
        </div>

        <Button
          asChild
          className="w-full bg-black text-white hover:bg-gold hover:text-black transition-all duration-300 font-medium text-lg py-3 h-12"
        >
          <Link href={`/reservar/${vehicle.id}`}>
            <Calendar className="h-5 w-5 mr-2" />
            {t.reserve}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
