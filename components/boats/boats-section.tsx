"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Ship,
  Zap,
  Users,
  Clock,
  Calendar,
  Fuel,
  Award,
  AlertCircle,
  X,
  CheckCircle,
  FileText,
  Phone,
  MessageCircle,
  HelpCircle,
  Mail,
  Camera,
  Music,
  Shield,
  Star,
  Waves,
  CreditCard,
  Wine,
  Droplets,
  Coffee,
  Package,
} from "lucide-react"
import Image from "next/image"
import { useApp } from "@/components/providers"
import { useRouter } from "next/navigation"

// Función para validar URLs de imágenes
function isValidImageUrl(url: string): boolean {
  if (!url) return false

  try {
    new URL(url)
    return true
  } catch {
    return url.startsWith("/")
  }
}

interface PricingOption {
  duration: string
  price: number
  label: string
}

interface ExtraFeature {
  id: string
  name: string
  description: string
  enabled: boolean
  price?: number
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
  extraFeatures?: ExtraFeature[]
  securityDeposit?: number
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
  fuelIncluded: string
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
  needHelp: string
  contactUs: string
  call: string
  whatsapp: string
  email: string
  securityDeposit: string
  prices: string
  people: string
  // ✅ NUEVAS TRADUCCIONES PARA EXTRAS
  photoSession: string
  bluetoothMusic: string
  safetyRing: string
  champagne: string
  snorkelingGear: string
  coolerDrinks: string
  // ✅ TRADUCCIONES PARA FRANJAS HORARIAS
  halfDayMorning: string
  halfDayAfternoon: string
  halfDayEvening: string
  fullDay: string
  halfDay: string
  oneHour: string
  twoHours: string
  fourHours: string
  halfHour: string
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
    fuelIncluded: "Gasolina incluida",
    noVehicles: "No hay vehículos disponibles en esta categoría",
    loading: "Cargando...",
    licenseRequired: "Licencia requerida",
    noLicenseNeeded: "Sin licencia",
    selectCategory: "Selecciona una categoría",
    restrictedHours: "Horario restringido",
    restrictedInfo: "No disponible de 14:00 a 16:00 (descanso del personal)",
    licenseWarningTitle: "Licencia de Navegación Requerida",
    licenseWarningMessage: "Has seleccionado un vehículo que requiere licencia de navegación.",
    licenseWarningRequirements:
      "Deberás presentar tu licencia de navegación válida en el momento del alquiler. Sin la licencia correspondiente, no podremos proceder con el alquiler del vehículo.",
    licenseWarningNote: "Asegúrate de traer tu documentación original el día de la reserva.",
    understand: "Entendido",
    cancel: "Cancelar",
    continueReservation: "Continuar con la Reserva",
    needHelp: "¿Necesitas ayuda?",
    contactUs: "Háblanos o llámanos",
    call: "Llamar",
    whatsapp: "WhatsApp",
    email: "Email",
    securityDeposit: "Fianza",
    prices: "Precios",
    people: "personas",
    // Extras en español
    photoSession: "Sesión de fotos",
    bluetoothMusic: "Música Bluetooth",
    safetyRing: "Rosco de seguridad",
    champagne: "Champán",
    snorkelingGear: "Equipo de snorkel",
    coolerDrinks: "Nevera con bebidas",
    // Franjas horarias en español
    halfDayMorning: "Medio día mañana",
    halfDayAfternoon: "Medio día tarde",
    halfDayEvening: "Medio día noche",
    fullDay: "Día completo",
    halfDay: "Medio día",
    oneHour: "1 hora",
    twoHours: "2 horas",
    fourHours: "4 horas",
    halfHour: "30 minutos",
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
    fuelIncluded: "Fuel included",
    noVehicles: "No vehicles available in this category",
    loading: "Loading...",
    licenseRequired: "License required",
    noLicenseNeeded: "No license needed",
    selectCategory: "Select a category",
    restrictedHours: "Restricted hours",
    restrictedInfo: "Not available from 14:00 to 16:00 (staff break)",
    licenseWarningTitle: "Navigation License Required",
    licenseWarningMessage: "You have selected a vehicle that requires a navigation license.",
    licenseWarningRequirements:
      "You must present your valid navigation license at the time of rental. Without the corresponding license, we cannot proceed with the vehicle rental.",
    licenseWarningNote: "Make sure to bring your original documentation on the day of the reservation.",
    understand: "Understood",
    cancel: "Cancel",
    continueReservation: "Continue with Reservation",
    needHelp: "Need help?",
    contactUs: "Talk to us or call us",
    call: "Call",
    whatsapp: "WhatsApp",
    email: "Email",
    securityDeposit: "Security Deposit",
    prices: "Prices",
    people: "people",
    // ✅ EXTRAS EN INGLÉS
    photoSession: "Photo session",
    bluetoothMusic: "Bluetooth Music",
    safetyRing: "Safety ring",
    champagne: "Champagne",
    snorkelingGear: "Snorkel equipment",
    coolerDrinks: "Cooler with drinks",
    // ✅ FRANJAS HORARIAS EN INGLÉS
    halfDayMorning: "Half day morning",
    halfDayAfternoon: "Half day afternoon",
    halfDayEvening: "Half day evening",
    fullDay: "Full day",
    halfDay: "Half day",
    oneHour: "1 hour",
    twoHours: "2 hours",
    fourHours: "4 hours",
    halfHour: "30 minutes",
  },
}

// ✅ FUNCIÓN PARA TRADUCIR NOMBRES DE EXTRAS
function translateExtraName(extraId: string, t: Translations): string {
  switch (extraId) {
    case "photo_session":
      return t.photoSession
    case "bluetooth_music":
      return t.bluetoothMusic
    case "safety_ring":
      return t.safetyRing
    case "champagne":
      return t.champagne
    case "snorkeling_gear":
      return t.snorkelingGear
    case "cooler_drinks":
      return t.coolerDrinks
    default:
      return extraId.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }
}

// ✅ FUNCIÓN PARA TRADUCIR ETIQUETAS DE TIEMPO
function translateTimeLabel(label: string, t: Translations): string {
  if (label.includes("Medio día mañana") || label.includes("Half day morning")) {
    return `${t.halfDayMorning} (10:00 - 14:00)`
  }
  if (label.includes("Medio día tarde") || label.includes("Half day afternoon")) {
    return `${t.halfDayAfternoon} (16:00 - 20:00)`
  }
  if (label.includes("Medio día noche") || label.includes("Half day evening")) {
    return `${t.halfDayEvening} (17:00 - 21:00)`
  }
  if (label.includes("Día completo") || label.includes("Full day")) {
    return `${t.fullDay} (10:00 - 21:00)`
  }
  return label
}

// ✅ FUNCIÓN MEJORADA CON ICONOS MÁS ESPECÍFICOS
function getExtraIcon(featureId: string) {
  switch (featureId) {
    case "photo_session":
      return <Camera className="h-4 w-4 text-pink-600" />
    case "bluetooth_music":
      return <Music className="h-4 w-4 text-blue-600" />
    case "safety_ring":
      return <Shield className="h-4 w-4 text-green-600" />
    case "champagne":
      return <Wine className="h-4 w-4 text-purple-600" />
    case "snorkeling_gear":
      return <Waves className="h-4 w-4 text-cyan-600" />
    case "cooler_drinks":
      return <Coffee className="h-4 w-4 text-orange-600\" />
      {
        /* Icono de bebidas */
      }
    case "fuel_included":
    case "extra_fuel":
    case "gasoline":
    case "fuel_tank":
      return <Fuel className="h-4 w-4 text-red-600\" />
      {
        /* Icono de combustible */
      }
    case "towels":
      return <Package className="h-4 w-4 text-blue-400" />
    case "water_sports":
      return <Droplets className="h-4 w-4 text-blue-500" />
    default:
      return <Star className="h-4 w-4 text-gray-600" />
  }
}

// Modal de advertencia de licencia
function LicenseWarningModal({
  isOpen,
  onClose,
  onContinue,
  vehicle,
  t,
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
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
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
                  <p className="text-yellow-800 text-sm font-medium mb-2">{t.licenseWarningRequirements}</p>
                  <p className="text-yellow-700 text-sm">{/*{t.licenseWarningNote}*/}</p>
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
            <Button onClick={onContinue} className="flex-1 bg-blue-600 text-white hover:bg-blue-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              {t.continueReservation}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Widget de contacto flotante
function FloatingContactWidget({ t }: { t: Translations }) {
  const [isOpen, setIsOpen] = useState(false)

  const handleCall = () => {
    window.location.href = "tel:+34655527988"
  }

  const handleWhatsApp = () => {
    const message = encodeURIComponent("Hola, necesito ayuda con el alquiler de embarcaciones")
    window.open(`https://wa.me/34643442364?text=${message}`, "_blank")
  }

  const handleEmail = () => {
    window.location.href = "mailto:info@oroboats.com"
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gold hover:bg-yellow-500 text-black p-4 sm:p-5 rounded-full shadow-xl transition-all duration-300 hover:scale-105 group border-2 border-white"
          aria-label={t.needHelp}
        >
          <HelpCircle className="h-6 w-6 sm:h-8 sm:w-8" />

          {/* Tooltip solo en desktop */}
          <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-black text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none hidden sm:block">
            {t.needHelp}
          </div>
        </button>
      ) : (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-72 sm:w-80 animate-in slide-in-from-bottom-5 duration-300">
          <div className="p-4 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-gold p-2 rounded-full mr-3">
                  <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{t.needHelp}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">{t.contactUs}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {/* Contact Options */}
            <div className="space-y-2 sm:space-y-3">
              <button
                onClick={handleCall}
                className="w-full flex items-center bg-blue-500 hover:bg-blue-600 text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition-colors duration-200"
              >
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0" />
                <div className="text-left flex-1">
                  <div className="font-semibold text-sm sm:text-base">{t.call}</div>
                  <div className="text-xs sm:text-sm opacity-90">+34 655 52 79 88</div>
                </div>
              </button>

              <button
                onClick={handleWhatsApp}
                className="w-full flex items-center bg-green-500 hover:bg-green-600 text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition-colors duration-200"
              >
                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0" />
                <div className="text-left flex-1">
                  <div className="font-semibold text-sm sm:text-base">{t.whatsapp}</div>
                  <div className="text-xs sm:text-sm opacity-90">+34 643 44 23 64</div>
                </div>
              </button>

              <button
                onClick={handleEmail}
                className="w-full flex items-center bg-gray-600 hover:bg-gray-700 text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition-colors duration-200"
              >
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0" />
                <div className="text-left flex-1">
                  <div className="font-semibold text-sm sm:text-base">{t.email}</div>
                  <div className="text-xs sm:text-sm opacity-90">info@oroboats.com</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
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
    const category = `${type}_${hasLicense ? "with_license" : "no_license"}`
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
      <>
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
        <FloatingContactWidget t={t} />
      </>
    )
  }

  if (loading) {
    return (
      <>
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
                  <CardContent></CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        <FloatingContactWidget t={t} />
      </>
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
              <div
                className={`grid gap-8 ${
                  activeTab === "boats" ? "grid-cols-1 lg:grid-cols-2 max-w-6xl mx-auto" : "grid-cols-1 md:grid-cols-2"
                }`}
              >
                {currentVehicles.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} t={t} onReserveClick={handleReserveClick} />
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

      {/* Widget de contacto flotante */}
      <FloatingContactWidget t={t} />

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
  onReserveClick,
}: {
  vehicle: Vehicle
  t: Translations
  onReserveClick: (vehicle: Vehicle) => void
}) {
  const getLowestPrice = () => {
    return Math.min(...vehicle.pricing.map((p) => p.price))
  }

  // Obtener extras habilitados - VERSIÓN MEJORADA
  const enabledExtras = (() => {
    console.log("🔍 Processing extras for vehicle:", vehicle.name, vehicle.extraFeatures)

    if (!vehicle.extraFeatures || !Array.isArray(vehicle.extraFeatures)) {
      console.log("⚠️ No valid extraFeatures found")
      return []
    }

    const filtered = vehicle.extraFeatures.filter((extra) => {
      const isEnabled =
        (typeof extra.enabled === "boolean" && extra.enabled === true) ||
        (typeof extra.enabled === "string" && extra.enabled === "true")
      console.log(`🔧 Extra ${extra.name}: enabled=${extra.enabled} (${typeof extra.enabled}) -> ${isEnabled}`)
      return isEnabled
    })

    console.log("✅ Enabled extras:", filtered)
    return filtered
  })()

  return (
    <Card className="bg-white border border-gray-200 hover:border-gold hover:shadow-lg transition-all duration-300 group overflow-hidden">
      <div className="relative">
        <div className="w-full h-72 bg-gray-50 flex items-center justify-center overflow-hidden">
          <Image
            src={isValidImageUrl(vehicle.image) ? vehicle.image : "/placeholder.svg"}
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
        <Badge
          className={`absolute top-4 left-4 font-semibold ${
            vehicle.requiresLicense ? "bg-blue-600 text-white" : "bg-green-600 text-white"
          }`}
        >
          {vehicle.requiresLicense ? t.licenseRequired : t.noLicenseNeeded}
        </Badge>

        {/* ✅ BADGE DE GASOLINA - SIEMPRE VISIBLE */}
        {vehicle.fuelIncluded ? (
          <Badge className="absolute top-16 left-4 bg-green-500 text-white font-semibold">
            <Fuel className="h-3 w-3 mr-1" />
            {t.fuelIncluded}
          </Badge>
        ) : (
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
            <span className="text-black font-semibold">
              {vehicle.capacity} {t.people}
            </span>
          </div>

          <div className="space-y-3">
            <span className="flex items-center text-gray-500 text-base font-medium">
              <Clock className="h-5 w-5 mr-2 text-gold" />
              {t.prices}:
            </span>
            <div className="grid grid-cols-2 gap-3">
              {(() => {
                // ✅ AGRUPAR PRECIOS POR CATEGORÍA EN LUGAR DE MOSTRAR TODOS LOS SLOTS
                const groupedPricing = new Map()

                vehicle.pricing.forEach((option) => {
                  let category = ""
                  let categoryLabel = ""

                  if (option.duration.startsWith("halfday")) {
                    category = "halfday"
                    categoryLabel = t.halfDay
                  } else if (option.duration.startsWith("fullday")) {
                    category = "fullday"
                    categoryLabel = t.fullDay
                  } else if (option.duration === "30min") {
                    category = "30min"
                    categoryLabel = t.halfHour || "30 minutos"
                  } else if (option.duration === "1hour") {
                    category = "1hour"
                    categoryLabel = t.oneHour || "1 hora"
                  } else if (option.duration === "2hour") {
                    category = "2hour"
                    categoryLabel = t.twoHours || "2 horas"
                  } else if (option.duration === "4hour") {
                    category = "4hour"
                    categoryLabel = t.fourHours || "4 horas"
                  } else {
                    // Para otros casos, usar la etiqueta original
                    category = option.duration
                    categoryLabel = option.label
                  }

                  if (!groupedPricing.has(category) || groupedPricing.get(category).price > option.price) {
                    groupedPricing.set(category, {
                      price: option.price,
                      label: categoryLabel,
                    })
                  }
                })

                return Array.from(groupedPricing.values()).map((option, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
                    <div className="text-xl font-bold text-gold">€{option.price}</div>
                    <div className="text-sm text-gray-600 font-medium">{option.label}</div>
                  </div>
                ))
              })()}
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

          {/* ✅ EXTRAS CON ICONOS MEJORADOS Y TRADUCCIONES */}
          {enabledExtras.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {enabledExtras.map((extra, index) => (
                <div
                  key={index}
                  className="flex items-center bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg px-3 py-2 hover:shadow-sm transition-shadow"
                  title={extra.description}
                >
                  {getExtraIcon(extra.id)}
                  <span className="text-xs text-purple-700 ml-2 font-medium">{translateExtraName(extra.id, t)}</span>
                  {extra.price && extra.price > 0 && (
                    <span className="text-xs text-purple-600 ml-1">(+{extra.price}€)</span>
                  )}
                </div>
              ))}
            </div>
          )}
          {/* Fianza */}
          {vehicle.securityDeposit && vehicle.securityDeposit > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-800">{t.securityDeposit}</span>
                </div>
                <Badge className="bg-blue-600 text-white text-sm">€{vehicle.securityDeposit}</Badge>
              </div>
            </div>
          )}
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
