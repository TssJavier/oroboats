"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Ship, Zap, Users, Clock, Calendar, Fuel, Award, AlertCircle, X, CheckCircle, FileText, Check } from 'lucide-react'
import Link from "next/link"
import Image from "next/image"
import { useApp } from "@/components/providers"
import { useRouter } from "next/navigation"

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
  category: string
  requiresLicense: boolean
  available: boolean
}

interface Translations {
  title: string
  subtitle: string
  boats: string
  jetskis: string
  withLicense: string
  withoutLicense: string
  reserve: string
  from: string
  capacity: string
  includes: string
  available: string
  fuelSeparate: string
  noVehicles: string
  loading: string
  licenseRequired: string
  noLicenseNeeded: string
  selectCategory: string
  restrictedHours: string
  restrictedInfo: string
  licenseWarningTitle: string
  licenseWarningMessage: string
  licenseWarningRequirements: string
  licenseWarningNote: string
  understand: string
  cancel: string
  continueReservation: string
}

const translations = {
  es: {
    title: "Nuestra Flota",
    subtitle: "Motos de agua y barcos para experiencias inolvidables",
    boats: "Barcos",
    jetskis: "Motos de Agua",
    withLicense: "Con Licencia",
    withoutLicense: "Sin Licencia",
    reserve: "Reservar",
    from: "Desde",
    capacity: "Capacidad",
    includes: "Incluye",
    available: "Disponible",
    fuelSeparate: "Gasolina aparte",
    noVehicles: "No hay vehículos disponibles en esta categoría",
    loading: "Cargando...",
    licenseRequired: "Licencia requerida",
    noLicenseNeeded: "Sin licencia",
    selectCategory: "Selecciona una categoría",
    restrictedHours: "Horario restringido",
    restrictedInfo: "No disponible de 14:00 a 16:00 (descanso del personal)",
    licenseWarningTitle: "Licencia de Navegación Requerida",
    licenseWarningMessage: "Has seleccionado un vehículo que requiere licencia de navegación.",
    licenseWarningRequirements: "Deberás presentar tu licencia de navegación válida en el momento del alquiler. Sin la licencia correspondiente, no podremos proceder con el alquiler del vehículo.",
    licenseWarningNote: "Asegúrate de traer tu documentación original el día de la reserva.",
    understand: "Entendido",
    cancel: "Cancelar",
    continueReservation: "Continuar con la Reserva",
  },
  en: {
    title: "Our Fleet",
    subtitle: "Jet skis and boats for unforgettable experiences",
    boats: "Boats",
    jetskis: "Jet Skis",
    withLicense: "With License",
    withoutLicense: "Without License",
    reserve: "Reserve",
    from: "From",
    capacity: "Capacity",
    includes: "Includes",
    available: "Available",
    fuelSeparate: "Fuel separate",
    noVehicles: "No vehicles available in this category",
    loading: "Loading...",
    licenseRequired: "License required",
    noLicenseNeeded: "No license needed",
    selectCategory: "Select a category",
    restrictedHours: "Restricted hours",
    restrictedInfo: "Not available from 14:00 to 16:00 (staff break)",
    licenseWarningTitle: "Navigation License Required",
    licenseWarningMessage: "You have selected a vehicle that requires a navigation license.",
    licenseWarningRequirements: "You must present your valid navigation license at the time of rental. Without the corresponding license, we cannot proceed with the vehicle rental.",
    licenseWarningNote: "Make sure to bring your original documentation on the day of the reservation.",
    understand: "Understood",
    cancel: "Cancel",
    continueReservation: "Continue with Reservation",
  },
}

// Modal de advertencia de licencia
function LicenseWarningModal({ 
  isOpen, 
  onClose, 
  onContinue, 
  vehicle, 
  t 
}: { 
  isOpen: boolean
  onClose: () => void
  onContinue: () => void
  vehicle: Vehicle
  t: Translations 
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 shadow-xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-full mr-3">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-black">{t.licenseWarningTitle}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Vehicle Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              {vehicle.type === "jetski" ? (
                <Zap className="h-5 w-5 text-gold mr-2" />
              ) : (
                <Ship className="h-5 w-5 text-gold mr-2" />
              )}
              <span className="font-semibold text-black">{vehicle.name}</span>
            </div>
          </div>

          {/* Warning Message */}
          <div className="space-y-4 mb-6">
            <p className="text-gray-700">{t.licenseWarningMessage}</p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-yellow-800 text-sm font-medium mb-2">
                    {t.licenseWarningRequirements}
                  </p>
                  <p className="text-yellow-700 text-sm">
                    {/*{t.licenseWarningNote}*/}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {t.cancel}
            </Button>
            <Button
              onClick={onContinue}
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {t.continueReservation}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function BoatsSection() {
  const { language } = useApp()
  const t = translations[language]
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("boats")
  const [activeLicense, setActiveLicense] = useState("with")
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showLicenseModal, setShowLicenseModal] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)

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
        setVehicles([])
        setError("Error: Los datos recibidos no son válidos")
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error)
      setVehicles([])
      setError("Error al cargar los vehículos. Verifica la conexión a la base de datos.")
    } finally {
      setLoading(false)
    }
  }

  // Filtrar vehículos por categoría
  const getVehiclesByCategory = (type: string, hasLicense: boolean) => {
    const category = `${type}_${hasLicense ? 'with_license' : 'no_license'}`
    return vehicles.filter((v) => v.category === category)
  }

  const currentVehicles = getVehiclesByCategory(activeTab === "boats" ? "boat" : "jetski", activeLicense === "with")

  const handleReserveClick = (vehicle: Vehicle) => {
    if (vehicle.requiresLicense) {
      setSelectedVehicle(vehicle)
      setShowLicenseModal(true)
    } else {
      router.push(`/reservar/${vehicle.id}`)
    }
  }

  const handleLicenseModalContinue = () => {
    if (selectedVehicle) {
      setShowLicenseModal(false)
      router.push(`/reservar/${selectedVehicle.id}`)
      setSelectedVehicle(null)
    }
  }

  const handleLicenseModalClose = () => {
    setShowLicenseModal(false)
    setSelectedVehicle(null)
  }

  if (error) {
    return (
      <section className="py-24 bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-6">{t.title}</h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto">{t.subtitle}</p>
          </div>
          <Card className="bg-red-50 border border-red-200">
            <CardContent className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-red-800 mb-2">{error}</h3>
              <Button onClick={fetchVehicles} className="bg-red-600 text-white hover:bg-red-700">
                Reintentar
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    )
  }

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

  return (
    <>
      <section className="py-24 bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-6">{t.title}</h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto">{t.subtitle}</p>
          </div>

          {/* Selector de Tipo de Vehículo */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-8">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-2 mb-8 bg-gray-100 border border-gray-200 h-16 p-2">
              <TabsTrigger
                value="boats"
                className="data-[state=active]:bg-black data-[state=active]:text-white text-gray-600 hover:text-black transition-colors text-lg font-semibold h-12 rounded-lg"
              >
                <Ship className="h-5 w-5 mr-3" />
                {t.boats}
              </TabsTrigger>
              <TabsTrigger
                value="jetskis"
                className="data-[state=active]:bg-black data-[state=active]:text-white text-gray-600 hover:text-black transition-colors text-lg font-semibold h-12 rounded-lg"
              >
                <Zap className="h-5 w-5 mr-3" />
                {t.jetskis}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Selector de Licencia */}
          <div className="flex justify-center mb-12">
            <div className="bg-gray-100 p-2 rounded-lg border border-gray-200">
              <div className="grid grid-cols-2 gap-2">
<button
  onClick={() => setActiveLicense("without")}
  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center ${
    activeLicense === "without"
      ? "bg-gold text-black shadow-md"
      : "text-gray-600 hover:text-black hover:bg-gray-50"
  }`}
>
  <Check className="h-4 w-4 mr-2" />
  {t.withoutLicense}
</button>
                <button
                  onClick={() => setActiveLicense("with")}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center ${
                    activeLicense === "with"
                      ? "bg-gold text-black shadow-md"
                      : "text-gray-600 hover:text-black hover:bg-gray-50"
                  }`}
                >
                  <Award className="h-4 w-4 mr-2" />
                  {t.withLicense}
                </button>
              </div>
            </div>
          </div>

          {/* Información de restricciones para motos sin licencia */}
          {activeTab === "jetskis" && activeLicense === "without" && (
            <div className="max-w-4xl mx-auto mb-8">
              <Card className="bg-orange-50 border border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-orange-600 mr-3" />
                    <div>
                      <h4 className="font-semibold text-orange-800">{t.restrictedHours}</h4>
                      <p className="text-orange-700 text-sm">{t.restrictedInfo}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Lista de Vehículos */}
          <div className="max-w-6xl mx-auto">
            {currentVehicles.length > 0 ? (
              <div className={`grid gap-8 ${
                activeTab === "boats" 
                  ? "grid-cols-1 max-w-4xl mx-auto" 
                  : "grid-cols-1 md:grid-cols-2"
              }`}>
                {currentVehicles.map((vehicle) => (
                  <VehicleCard 
                    key={vehicle.id} 
                    vehicle={vehicle} 
                    t={t} 
                    onReserveClick={handleReserveClick}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                {activeTab === "boats" ? (
                  <Ship className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                ) : (
                  <Zap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                )}
                <p className="text-gray-500 text-lg">{t.noVehicles}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Modal de advertencia de licencia */}
      {selectedVehicle && (
        <LicenseWarningModal
          isOpen={showLicenseModal}
          onClose={handleLicenseModalClose}
          onContinue={handleLicenseModalContinue}
          vehicle={selectedVehicle}
          t={t}
        />
      )}
    </>
  )
}

function VehicleCard({ 
  vehicle, 
  t, 
  onReserveClick 
}: { 
  vehicle: Vehicle
  t: Translations
  onReserveClick: (vehicle: Vehicle) => void
}) {
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
        
        {/* Badge de licencia */}
        <Badge className={`absolute top-4 left-4 font-semibold ${
          vehicle.requiresLicense 
            ? "bg-blue-600 text-white" 
            : "bg-green-600 text-white"
        }`}>
          {vehicle.requiresLicense ? t.licenseRequired : t.noLicenseNeeded}
        </Badge>

        {!vehicle.fuelIncluded && (
          <Badge className="absolute top-16 left-4 bg-orange-500 text-white font-semibold">
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
          onClick={() => onReserveClick(vehicle)}
          className="w-full bg-black text-white hover:bg-gold hover:text-black transition-all duration-300 font-medium text-lg py-3 h-12"
        >
          <Calendar className="h-5 w-5 mr-2" />
          {t.reserve}
        </Button>
      </CardContent>
    </Card>
  )
}