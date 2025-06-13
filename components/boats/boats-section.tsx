"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SimpleDateFilter } from "./simple-date-filter"
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
  Filter,
} from "lucide-react"
import Image from "next/image"
import { useApp } from "@/components/providers"
import { useRouter } from "next/navigation"
import { OroLoading, useNavigationLoading } from "@/components/ui/oro-loading" // ✅ NUEVO: Importar OroLoading

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
  isAvailable?: boolean
}

interface Translations {
  title: string
  subtitle: string
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
  photoSession: string
  bluetoothMusic: string
  safetyRing: string
  champagne: string
  snorkelingGear: string
  coolerDrinks: string
  halfDayMorning: string
  halfDayAfternoon: string
  halfDayEvening: string
  fullDay: string
  halfDay: string
  oneHour: string
  twoHours: string
  fourHours: string
  halfHour: string
  withLicenseDesc: string
  withoutLicenseDesc: string
  searchResults: string
  showingResults: string
  noResultsFound: string
  adjustFilters: string
  boatsAndJetskis: string
  availableForDate: string
}

const translations = {
  es: {
    title: "Nuestra Flota",
    subtitle: "Motos de agua y barcos para experiencias inolvidables",
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
    restrictedHours: "Horario restringido",
    restrictedInfo: "Motos sin licencia: No disponible de 14:00 a 16:00 (descanso del personal)",
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
    photoSession: "Sesión de fotos",
    bluetoothMusic: "Música Bluetooth",
    safetyRing: "Rosco de seguridad",
    champagne: "Champán",
    snorkelingGear: "Equipo de snorkel",
    coolerDrinks: "Nevera con bebidas",
    halfDayMorning: "Medio día mañana",
    halfDayAfternoon: "Medio día tarde",
    halfDayEvening: "Medio día noche",
    fullDay: "Día completo",
    halfDay: "Medio día",
    oneHour: "1 hora",
    twoHours: "2 horas",
    fourHours: "4 horas",
    halfHour: "30 minutos",
    withLicenseDesc: "Barcos y motos que requieren licencia de navegación",
    withoutLicenseDesc: "Barcos y motos que no requieren licencia",
    searchResults: "Resultados de búsqueda",
    showingResults: "Mostrando",
    noResultsFound: "No se encontraron resultados",
    adjustFilters: "Intenta seleccionar otra fecha",
    boatsAndJetskis: "barcos y motos",
    availableForDate: "disponibles para la fecha seleccionada",
  },
  en: {
    title: "Our Fleet",
    subtitle: "Jet skis and boats for unforgettable experiences",
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
    restrictedHours: "Restricted hours",
    restrictedInfo: "Jet skis without license: Not available from 14:00 to 16:00 (staff break)",
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
    photoSession: "Photo session",
    bluetoothMusic: "Bluetooth Music",
    safetyRing: "Safety ring",
    champagne: "Champagne",
    snorkelingGear: "Snorkel equipment",
    coolerDrinks: "Cooler with drinks",
    halfDayMorning: "Half day morning",
    halfDayAfternoon: "Half day afternoon",
    halfDayEvening: "Half day evening",
    fullDay: "Full day",
    halfDay: "Half day",
    oneHour: "1 hour",
    twoHours: "2 hours",
    fourHours: "4 hours",
    halfHour: "30 minutes",
    withLicenseDesc: "Boats and jet skis that require navigation license",
    withoutLicenseDesc: "Boats and jet skis that don't require license",
    searchResults: "Search results",
    showingResults: "Showing",
    noResultsFound: "No results found",
    adjustFilters: "Try selecting another date",
    boatsAndJetskis: "boats and jet skis",
    availableForDate: "available for selected date",
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
      return <Coffee className="h-4 w-4 text-orange-600" />
    case "fuel_included":
    case "extra_fuel":
    case "gasoline":
    case "fuel_tank":
      return <Fuel className="h-4 w-4 text-red-600" />
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
  const [activeLicense, setActiveLicense] = useState("without")
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showLicenseModal, setShowLicenseModal] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>("")

  // ✅ NUEVO: Hook para manejar el estado de carga durante la navegación
  const { isLoading: navigationLoading, startLoading, stopLoading } = useNavigationLoading()

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

      if (Array.isArray(data)) {
        setVehicles(data)
        setFilteredVehicles(data)
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

  // ✅ NUEVA FUNCIÓN PARA FILTRAR POR LICENCIA (BARCOS Y MOTOS JUNTOS)
  const getVehiclesByLicense = (hasLicense: boolean) => {
    const targetCategories = hasLicense
      ? ["boat_with_license", "jetski_with_license"]
      : ["boat_no_license", "jetski_no_license"]

    return filteredVehicles.filter((v) => targetCategories.includes(v.category))
  }

  // ✅ FUNCIÓN PARA BUSCAR POR FECHA MEJORADA
  const handleDateSelect = async (date: string) => {
    setSelectedDate(date)
    setSearchLoading(true)
    setHasSearched(true)

    try {
      console.log("🔍 Searching for date:", date)

      // Buscar disponibilidad para la fecha seleccionada
      const response = await fetch("/api/vehicles/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: date,
          vehicleIds: vehicles.map((v) => v.id),
        }),
      })

      if (response.ok) {
        const availabilityData = await response.json()
        console.log("📊 Availability data:", availabilityData)

        // Actualizar vehículos con información de disponibilidad
        const updatedVehicles = availabilityData.map((item: any) => ({
          ...item,
          isAvailable: item.isAvailable,
        }))

        // Filtrar solo los que tienen al menos un slot disponible
        const availableVehicles = updatedVehicles.filter((v: any) => v.isAvailable)

        setFilteredVehicles(availableVehicles)
      } else {
        console.warn("Availability API not available, showing all vehicles")
        // ✅ FALLBACK: Si la API falla, mostrar todos los vehículos
        setFilteredVehicles(vehicles)
      }
    } catch (error) {
      console.warn("Error searching by date, showing all vehicles:", error)
      // ✅ FALLBACK: Si hay error, mostrar todos los vehículos
      setFilteredVehicles(vehicles)
    } finally {
      setSearchLoading(false)
    }
  }

  const currentVehicles = getVehiclesByLicense(activeLicense === "with")

  // ✅ MODIFICADO: Actualizar handleReserveClick para mostrar el loading durante la navegación
  const handleReserveClick = (vehicle: Vehicle) => {
    if (vehicle.requiresLicense) {
      setSelectedVehicle(vehicle)
      setShowLicenseModal(true)
    } else {
      // Iniciar el loading antes de navegar
      startLoading()

      // Navegar a la página del producto
      router.push(`/reservar/${vehicle.id}`)

      // Nota: No necesitamos stopLoading() aquí porque la página se recargará completamente
    }
  }

  // ✅ MODIFICADO: Actualizar handleLicenseModalContinue para mostrar el loading durante la navegación
  const handleLicenseModalContinue = () => {
    if (selectedVehicle) {
      setShowLicenseModal(false)

      // Iniciar el loading antes de navegar
      startLoading()

      // Navegar a la página del producto
      router.push(`/reservar/${selectedVehicle.id}`)
      setSelectedVehicle(null)

      // Nota: No necesitamos stopLoading() aquí porque la página se recargará completamente
    }
  }

  const handleLicenseModalClose = () => {
    setShowLicenseModal(false)
    setSelectedVehicle(null)
  }

  // ✅ NUEVO: Mostrar OroLoading durante la carga inicial o la navegación
  if (loading) {
    return <OroLoading />
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

  return (
    <>
      {/* ✅ NUEVO: Mostrar OroLoading durante la navegación */}
      {navigationLoading && <OroLoading />}

      <section className="py-24 bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-6">{t.title}</h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto">{t.subtitle}</p>
          </div>

          {/* ✅ FILTRO SIMPLE DE FECHA */}
          <SimpleDateFilter onDateSelect={handleDateSelect} isLoading={searchLoading} language={language} />

          {/* ✅ SELECTOR DE LICENCIA MEJORADO */}
          <div className="flex justify-center mb-12">
            <div className="bg-white border-2 border-gray-200 p-2 rounded-xl shadow-sm">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActiveLicense("without")}
                  className={`px-8 py-4 rounded-lg font-semibold transition-all duration-200 flex flex-col items-center ${
                    activeLicense === "without"
                      ? "bg-gold text-black shadow-lg border-2 border-gold"
                      : "text-gray-600 hover:text-black hover:bg-gray-50 border-2 border-transparent"
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <div className="bg-green-100 p-2 rounded-full mr-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="text-lg">{t.withoutLicense}</span>
                  </div>
                  <span className="text-sm opacity-75 text-center">{t.withoutLicenseDesc}</span>
                </button>
                <button
                  onClick={() => setActiveLicense("with")}
                  className={`px-8 py-4 rounded-lg font-semibold transition-all duration-200 flex flex-col items-center ${
                    activeLicense === "with"
                      ? "bg-gold text-black shadow-lg border-2 border-gold"
                      : "text-gray-600 hover:text-black hover:bg-gray-50 border-2 border-transparent"
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <div className="bg-blue-100 p-2 rounded-full mr-2">
                      <Award className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="text-lg">{t.withLicense}</span>
                  </div>
                  <span className="text-sm opacity-75 text-center">{t.withLicenseDesc}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ✅ INDICADOR DE RESULTADOS */}
          {hasSearched && selectedDate && (
            <div className="mb-6">
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Filter className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-blue-800 font-medium">
                    {t.showingResults} {currentVehicles.length} {t.boatsAndJetskis} {t.availableForDate}
                  </span>
                </div>
                {searchLoading && (
                  <div className="flex items-center text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Buscando...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ✅ LISTA DE VEHÍCULOS */}
          <div className="max-w-6xl mx-auto" id="products-section">
            {currentVehicles.length > 0 ? (
              <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {currentVehicles.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} t={t} onReserveClick={handleReserveClick} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                {hasSearched && selectedDate ? (
                  <>
                    <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">{t.noResultsFound}</p>
                    <p className="text-gray-400 text-sm mt-2">{t.adjustFilters}</p>
                  </>
                ) : (
                  <>
                    <div className="flex justify-center mb-4">
                      <Ship className="h-8 w-8 text-gray-300 mr-2" />
                      <Zap className="h-8 w-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500 text-lg">{t.noVehicles}</p>
                  </>
                )}
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

  // Obtener extras habilitados
  const enabledExtras = (() => {
    if (!vehicle.extraFeatures || !Array.isArray(vehicle.extraFeatures)) {
      return []
    }

    return vehicle.extraFeatures.filter((extra) => {
      const isEnabled =
        (typeof extra.enabled === "boolean" && extra.enabled === true) ||
        (typeof extra.enabled === "string" && extra.enabled === "true")
      return isEnabled
    })
  })()

  // Función para manejar el clic en toda la tarjeta
  const handleCardClick = () => {
    onReserveClick(vehicle)
  }

  return (
    <Card
      className="bg-white border border-gray-200 hover:border-gold hover:shadow-lg transition-all duration-300 group overflow-hidden flex flex-col h-full cursor-pointer"
      onClick={handleCardClick} // ✅ NUEVO: Hacer toda la tarjeta clickable
    >
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

        {/* ✅ BADGE DE TIPO DE VEHÍCULO */}
        <Badge className="absolute top-4 right-4 bg-gray-800 text-white font-semibold">
          {vehicle.type === "jetski" ? (
            <div className="flex items-center">
              <Zap className="h-3 w-3 mr-1" />
              Moto
            </div>
          ) : (
            <div className="flex items-center">
              <Ship className="h-3 w-3 mr-1" />
              Barco
            </div>
          )}
        </Badge>

        {/* Badge de licencia */}
        <Badge
          className={`absolute top-4 left-4 font-semibold ${
            vehicle.requiresLicense ? "bg-blue-600 text-white" : "bg-green-600 text-white"
          }`}
        >
          {vehicle.requiresLicense ? t.licenseRequired : t.noLicenseNeeded}
        </Badge>

        {/* Badge de gasolina */}
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

      {/* ✅ CONTENIDO PRINCIPAL CON FLEX-GROW PARA EQUILIBRAR ALTURAS */}
      <CardContent className="flex-grow flex flex-col">
        <div className="space-y-4 mb-6 flex-grow">
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
            <div className="grid grid-cols-3 gap-2">
              {(() => {
                // Agrupar precios por categoría
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
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200 hover:bg-gold/10 hover:border-gold cursor-pointer transition-all"
                    onClick={(e) => {
                      e.stopPropagation() // Evitar que se propague al padre
                      onReserveClick(vehicle)
                    }}
                    role="button"
                    aria-label={`Reservar ${vehicle.name} por ${option.label}`}
                  >
                    <div className="text-lg font-bold text-gold">€{option.price}</div>
                    <div className="text-xs text-gray-600 font-medium">{option.label}</div>
                  </div>
                ))
              })()}
            </div>
          </div>

          {/* ✅ EXTRAS CON ALTURA FIJA PARA EQUILIBRAR LAYOUT - TODOS VISIBLES EN FILAS DE 3 */}
          <div className="min-h-[80px]">
            {enabledExtras.length > 0 ? (
              <div className="space-y-2">
                <span className="text-gray-500 text-sm font-medium">Extras:</span>
                <div className="grid grid-cols-3 gap-2">
                  {enabledExtras.map((extra, index) => (
                    <div
                      key={index}
                      className="flex flex-col items-center bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg px-2 py-2 hover:shadow-sm transition-shadow text-center"
                      title={extra.description}
                    >
                      {getExtraIcon(extra.id)}
                      <span className="text-xs text-purple-700 mt-1 font-medium leading-tight">
                        {translateExtraName(extra.id, t)}
                      </span>
                      {extra.price && extra.price > 0 && (
                        <span className="text-xs text-purple-600">(+{extra.price}€)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[80px]"></div> // Espacio reservado para mantener altura consistente
            )}
          </div>

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

        {/* ✅ SECCIÓN INFERIOR FIJA */}
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-gray-500 text-base">{t.from}</span>
              <div className="text-3xl font-bold text-gold">€{getLowestPrice()}</div>
            </div>
          </div>

          <Button
            onClick={(e) => {
              e.stopPropagation() // Evitar que se propague al padre
              onReserveClick(vehicle)
            }}
            className="w-full bg-black text-white hover:bg-gold hover:text-black transition-all duration-300 font-medium text-lg py-3 h-12"
          >
            <Calendar className="h-5 w-5 mr-2" />
            {t.reserve}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
