"use client"

import type React from "react"

import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SimpleDateFilter } from "./simple-date-filter"
import {
  Ship,
  Zap,
  Users,
  Clock,
  Calendar,
  Fuel,
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
  Anchor,
  MapPin,
  ArrowLeft,
  ChevronDown,
  Check,
  RollerCoaster,
} from "lucide-react"
import Image from "next/image"
import { useApp } from "@/components/providers"
import { useRouter } from "next/navigation"
import { OroLoading, useNavigationLoading } from "@/components/ui/oro-loading"

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

// ✅ ACTUALIZADO: Interfaz Vehicle para coincidir con el esquema de la base de datos
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
  category?: string // Hacemos category opcional según el esquema
  requiresLicense?: boolean // Hacemos opcional según el esquema
  available?: boolean // Hacemos opcional según el esquema
  extraFeatures?: ExtraFeature[]
  securityDeposit?: number | null // Allow null
  manualDeposit?: number | null // Allow null
  isAvailable?: boolean
  beachLocationId?: string // Hacemos opcional
}

interface BeachLocation {
  id: string
  name: string
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
  selectBeach: string
  selectBeachDescription: string
  allBeaches: string
  backToBeaches: string
  productsAvailable: string
  changeBeach: string
  currentBeach: string
}

const translations = {
  es: {
    title: "Nuestra Flota",
    subtitle: "Motos de agua y barcos para experiencias inolvidables",
    withLicense: "CON LICENCIA",
    withoutLicense: "SIN LICENCIA",
    reserve: "Reservar",
    from: "Desde",
    capacity: "Capacidad",
    includes: "Incluye",
    available: "Disponible",
    fuelSeparate: "GASOLINA APARTE",
    fuelIncluded: "GASOLINA INCLUIDA",
    noVehicles: "No hay vehículos disponibles en esta categoría",
    loading: "Cargando...",
    licenseRequired: "LICENCIA REQUERIDA",
    noLicenseNeeded: "SIN LICENCIA",
    restrictedHours: "Horario restringido",
    restrictedInfo: "Vehículo sin licencia: No disponible de 14:00 a 16:00 (descanso del personal)",
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
    safetyRing: "Donut flotador",
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
    selectBeach: "Selecciona tu Playa",
    selectBeachDescription: "Elige la ubicación donde quieres alquilar tu embarcación",
    allBeaches: "Todas las Playas",
    backToBeaches: "Volver a Playas",
    productsAvailable: "vehículos disponibles",
    changeBeach: "Cambiar Playa",
    currentBeach: "Playa Actual",
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
    fuelSeparate: "FUEL SEPARATE",
    fuelIncluded: "FUEL INCLUDED",
    noVehicles: "No vehicles available in this category",
    loading: "Loading...",
    licenseRequired: "LICENSE REQUIRED",
    noLicenseNeeded: "NO LICENSE NEEDED",
    restrictedHours: "Restricted hours",
    restrictedInfo: "Vehicle without license: Not available from 14:00 to 16:00 (staff break)",
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
    selectBeach: "Select Your Beach",
    selectBeachDescription: "Choose the location where you want to rent your boat",
    allBeaches: "All Beaches",
    backToBeaches: "Back to Beaches",
    productsAvailable: "vehicles available",
    changeBeach: "Change Beach",
    currentBeach: "Current Beach",
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
      return <RollerCoaster className="h-4 w-4 text-green-600" />
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

// ✅ FIXED: Componente BeachSelector con mejor manejo de eventos táctiles
function BeachSelector({
  beachLocations,
  selectedBeachId,
  selectedBeachName,
  onBeachSelect,
  onBackToSelection,
  t,
}: {
  beachLocations: BeachLocation[]
  selectedBeachId: string | null
  selectedBeachName: string
  onBeachSelect: (id: string, name: string) => void
  onBackToSelection: () => void
  t: Translations
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [vehicleCounts, setVehicleCounts] = useState<Record<string, number>>({})

  // Cargar conteos de vehículos para cada playa
  useEffect(() => {
    const loadVehicleCounts = async () => {
      const counts: Record<string, number> = {}
      for (const location of beachLocations) {
        try {
          const response = await fetch(`/api/vehicles?beachLocationId=${location.id}`)
          if (response.ok) {
            const data = await response.json()
            counts[location.id] = Array.isArray(data) ? data.filter((v) => v.available).length : 0
          }
        } catch {
          counts[location.id] = 0
        }
      }
      setVehicleCounts(counts)
    }

    if (beachLocations.length > 0) {
      loadVehicleCounts()
    }
  }, [beachLocations])

  // ✅ FIXED: Simplificado manejo de eventos
  const handleBeachChange = (beach: BeachLocation) => {
    onBeachSelect(beach.id, beach.name)
    setIsOpen(false)
  }

  // ✅ FIXED: Simplificado manejo del botón "Volver a Playas"
  const handleBackToBeaches = () => {
    onBackToSelection()
    setIsOpen(false)
  }

  // ✅ FIXED: Toggle del dropdown con delay para evitar cierre inmediato
  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  // ✅ FIXED: Cerrar dropdown solo cuando se hace click fuera
  const handleOverlayClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(false)
  }

  return (
    <div className="mb-8">
      {/* Versión Desktop */}
      <div className="hidden sm:block">
        <div className="bg-gradient-to-r from-gold/10 via-yellow-50 to-gold/10 border-2 border-gold/30 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gold p-3 rounded-full shadow-md">
                <MapPin className="h-6 w-6 text-black" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{t.currentBeach}</h3>
                <p className="text-2xl font-bold text-gold">{selectedBeachName}</p>
                <p className="text-sm text-gray-600">
                  {vehicleCounts[selectedBeachId || ""] || 0} {t.productsAvailable}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {beachLocations.length > 1 && (
                <div className="relative">
                  <button
                    onClick={toggleDropdown}
                    className="flex items-center space-x-2 bg-white hover:bg-gray-50 border-2 border-gold/30 hover:border-gold text-gray-700 px-4 py-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <span className="font-medium">{t.changeBeach}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="absolute top-full right-0 mt-2 w-80 bg-white border-2 border-gold/20 rounded-xl shadow-xl z-50 overflow-hidden">
                      <div className="p-2">
                        {beachLocations.map((beach) => (
                          <button
                            key={beach.id}
                            onClick={() => handleBeachChange(beach)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                              beach.id === selectedBeachId
                                ? "bg-gold/20 text-gold border border-gold/30"
                                : "hover:bg-gray-50 text-gray-700"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <MapPin
                                className={`h-5 w-5 ${beach.id === selectedBeachId ? "text-gold" : "text-gray-400"}`}
                              />
                              <div className="text-left">
                                <p className="font-medium">{beach.name}</p>
                                <p className="text-xs text-gray-500">{vehicleCounts[beach.id] || 0} vehículos</p>
                              </div>
                            </div>
                            {beach.id === selectedBeachId && <Check className="h-5 w-5 text-gold" />}
                          </button>
                        ))}
                      </div>
                      <div className="border-t border-gray-100 p-2">
                        <button
                          onClick={handleBackToBeaches}
                          className="w-full flex items-center justify-center space-x-2 p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          <span className="text-sm">{t.backToBeaches}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Versión Mobile - ✅ FIXED */}
      <div className="block sm:hidden">
        <div className="bg-gradient-to-r from-gold/10 via-yellow-50 to-gold/10 border-2 border-gold/30 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="bg-gold p-2 rounded-full">
                <MapPin className="h-5 w-5 text-black" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{t.currentBeach}</p>
                <p className="text-lg font-bold text-gold">{selectedBeachName}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {vehicleCounts[selectedBeachId || ""] || 0} {t.productsAvailable}
            </p>
            {beachLocations.length > 1 && (
              <button
                onClick={toggleDropdown}
                className="flex items-center space-x-2 bg-white hover:bg-gray-50 active:bg-gray-100 border border-gold/30 text-gray-700 px-3 py-2 rounded-lg text-sm transition-all"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <span>{t.changeBeach}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
            )}
          </div>

          {/* Dropdown Mobile - ✅ FIXED */}
          {isOpen && (
            <div className="mt-4 bg-white border border-gold/20 rounded-lg shadow-lg overflow-hidden relative z-50">
              {beachLocations.map((beach) => (
                <button
                  key={beach.id}
                  onClick={() => handleBeachChange(beach)}
                  className={`w-full flex items-center justify-between p-3 transition-all ${
                    beach.id === selectedBeachId
                      ? "bg-gold/20 text-gold"
                      : "hover:bg-gray-50 active:bg-gray-100 text-gray-700 border-b border-gray-100 last:border-b-0"
                  }`}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <div className="flex items-center space-x-3">
                    <MapPin className={`h-4 w-4 ${beach.id === selectedBeachId ? "text-gold" : "text-gray-400"}`} />
                    <div className="text-left">
                      <p className="font-medium text-sm">{beach.name}</p>
                      <p className="text-xs text-gray-500">{vehicleCounts[beach.id] || 0} vehículos</p>
                    </div>
                  </div>
                  {beach.id === selectedBeachId && <Check className="h-4 w-4 text-gold" />}
                </button>
              ))}
              <button
                onClick={handleBackToBeaches}
                className="w-full flex items-center justify-center space-x-2 p-3 text-gray-600 hover:bg-gray-50 active:bg-gray-100 border-t border-gray-100 transition-colors"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">{t.backToBeaches}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ✅ FIXED: Overlay mejorado que solo se activa con un pequeño delay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 sm:hidden"
          onClick={handleOverlayClick}
          style={{
            backgroundColor: "transparent",
            WebkitTapHighlightColor: "transparent",
          }}
        />
      )}
    </div>
  )
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
      <div className="bg-white rounded-lg max-w-md w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center flex-1 min-w-0">
              <div className="bg-blue-100 p-2 rounded-full mr-3 flex-shrink-0">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-black truncate">{t.licenseWarningTitle}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 ml-2 flex-shrink-0"
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
                  <p className="text-yellow-800 text-sm font-medium mb-2">{t.licenseWarningRequirements}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 py-3 bg-transparent"
            >
              {t.cancel}
            </Button>
            <Button
              onClick={onContinue}
              className="w-full sm:flex-1 bg-blue-600 text-white hover:bg-blue-700 py-3 text-sm sm:text-base"
            >
              <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{t.continueReservation}</span>
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
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-200 w-72 sm:w-80 animate-in slide-in-from-bottom-5 duration-300">
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

  // ✅ NUEVO: Estados para manejo de playas
  const [selectedBeachId, setSelectedBeachId] = useState<string | null>(null)
  const [beachLocations, setBeachLocations] = useState<BeachLocation[]>([])
  const [fetchingLocations, setFetchingLocations] = useState(true)
  const [selectedBeachName, setSelectedBeachName] = useState<string>("")

  const { isLoading: navigationLoading, startLoading, stopLoading } = useNavigationLoading()

  useEffect(() => {
    fetchBeachLocations()
  }, [])

  // ✅ NUEVO: Función para obtener ubicaciones de playa
  const fetchBeachLocations = async () => {
    try {
      setFetchingLocations(true)
      console.log("🏖️ Fetching beach locations...")
      const response = await fetch("/api/locations")
      if (!response.ok) {
        throw new Error("Error al cargar las ubicaciones de playa.")
      }
      const data = await response.json()
      console.log("🏖️ Beach locations received:", data)
      if (Array.isArray(data)) {
        setBeachLocations(data)
        // Si solo hay una playa, seleccionarla automáticamente
        if (data.length === 1) {
          setSelectedBeachId(data[0].id)
          setSelectedBeachName(data[0].name)
          await fetchVehicles(data[0].id)
        } else {
          setLoading(false)
        }
      } else {
        setError("Error: Datos de ubicaciones no válidos.")
        setLoading(false)
      }
    } catch (err) {
      console.error("Error fetching beach locations:", err)
      setError(err instanceof Error ? err.message : "Error al cargar las ubicaciones de playa.")
      setLoading(false)
    } finally {
      setFetchingLocations(false)
    }
  }

  // ✅ MODIFICADO: Función para obtener vehículos filtrados por playa
  const fetchVehicles = async (locationId?: string) => {
    setLoading(true)
    setError(null)
    try {
      console.log("🚗 Fetching vehicles for location:", locationId)
      // ✅ FIXED: Construct URL properly with beachLocationId parameter
      const url = locationId ? `/api/vehicles?beachLocationId=${locationId}` : "/api/vehicles"
      console.log("🔗 API URL:", url)
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log("🚗 Vehicles received:", data)
      console.log("🔍 Number of vehicles:", data.length)
      if (Array.isArray(data)) {
        setVehicles(data)
        setFilteredVehicles(data)
        console.log("✅ Vehicles set successfully")
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

  const getVehiclesByLicense = (hasLicense: boolean) => {
    const targetCategories = hasLicense
      ? ["boat_with_license", "jetski_with_license"]
      : ["boat_no_license", "jetski_no_license"]

    console.log("🔍 Filtering vehicles by license:", { hasLicense, targetCategories })
    console.log("🔍 Available vehicles:", filteredVehicles.length)
    console.log("🔍 Selected beach:", selectedBeachId)

    const filtered = filteredVehicles.filter((v) => {
      const matchesCategory = v.category ? targetCategories.includes(v.category) : false // Handle optional category
      const matchesBeach = selectedBeachId === null || v.beachLocationId === selectedBeachId
      console.log(`🔍 Vehicle ${v.name}:`, {
        category: v.category,
        matchesCategory,
        beachLocationId: v.beachLocationId,
        matchesBeach,
        included: matchesCategory && matchesBeach,
      })
      return matchesCategory && matchesBeach
    })

    console.log("✅ Filtered vehicles:", filtered.length)
    return filtered
  }

  const handleDateSelect = async (date: string) => {
    setSelectedDate(date)
    setSearchLoading(true)
    setHasSearched(true)
    try {
      console.log("🔍 Searching for date:", date)
      const response = await fetch("/api/vehicles/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: date,
          vehicleIds: vehicles.map((v) => v.id),
          beachLocationId: selectedBeachId,
        }),
      })

      if (response.ok) {
        const availabilityData = await response.json()
        console.log("📊 Availability data:", availabilityData)
        const updatedVehicles = availabilityData.map((item: Vehicle) => ({
          ...item,
          isAvailable: item.isAvailable,
        }))
        const availableVehicles = updatedVehicles.filter((v: Vehicle) => v.isAvailable)
        setFilteredVehicles(availableVehicles)
      } else {
        console.warn("Availability API not available, showing all vehicles")
        setFilteredVehicles(vehicles)
      }
    } catch (error) {
      console.warn("Error searching by date, showing all vehicles:", error)
      setFilteredVehicles(vehicles)
    } finally {
      setSearchLoading(false)
    }
  }

  const currentVehicles = getVehiclesByLicense(activeLicense === "with")

  const handleReserveClick = (vehicle: Vehicle) => {
    if (vehicle.requiresLicense) {
      setSelectedVehicle(vehicle)
      setShowLicenseModal(true)
    } else {
      startLoading()
      router.push(`/reservar/${vehicle.id}`)
    }
  }

  const handleLicenseModalContinue = () => {
    if (selectedVehicle) {
      setShowLicenseModal(false)
      startLoading()
      router.push(`/reservar/${selectedVehicle.id}`)
      setSelectedVehicle(null)
    }
  }

  const handleLicenseModalClose = () => {
    setShowLicenseModal(false)
    setSelectedVehicle(null)
  }

  // ✅ NUEVO: Función para manejar selección de playa
  const handleBeachSelect = async (beachId: string, beachName: string) => {
    console.log("🏖️ Beach selected:", beachId, beachName)
    setSelectedBeachId(beachId)
    setSelectedBeachName(beachName)
    // Limpiar búsquedas anteriores
    setHasSearched(false)
    setSelectedDate("")
    await fetchVehicles(beachId)
  }

  // ✅ NUEVO: Función para volver a la selección de playas
  const handleBackToBeaches = () => {
    setSelectedBeachId(null)
    setSelectedBeachName("")
    setVehicles([])
    setFilteredVehicles([])
    setHasSearched(false)
    setSelectedDate("")
  }

  // ✅ NUEVO: Función para contar vehículos por playa
  const getVehicleCountForBeach = async (beachId: string): Promise<number> => {
    try {
      const response = await fetch(`/api/vehicles?beachLocationId=${beachId}`)
      if (response.ok) {
        const data = await response.json()
        return Array.isArray(data) ? data.filter((v) => v.available).length : 0
      }
      return 0
    } catch {
      return 0
    }
  }

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
                <Button onClick={() => fetchBeachLocations()} className="bg-red-600 text-white hover:bg-red-700">
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
      {navigationLoading && <OroLoading />}
      <section className="py-24 bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-6">{t.title}</h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto">{t.subtitle}</p>
          </div>

          {/* ✅ ACTUALIZADO: Selección de playa (se muestra si no hay playa seleccionada) */}
          {selectedBeachId === null && beachLocations.length > 0 && (
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold text-black mb-4 flex items-center justify-center">
                <MapPin className="h-7 w-7 mr-3 text-gold" />
                {t.selectBeach}
              </h2>
              <p className="text-lg text-gray-600 mb-8">{t.selectBeachDescription}</p>
              {/* ✅ CENTRADO DE PLAYAS: Añadido justify-center y gap-6 */}
              <div className="flex flex-wrap justify-center gap-6 max-w-4xl mx-auto">
                {fetchingLocations ? (
                  <Card className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] animate-pulse">
                    <CardContent className="py-12 text-center min-h-[180px] flex items-center justify-center">
                      Cargando ubicaciones...
                    </CardContent>
                  </Card>
                ) : (
                  beachLocations.map((location) => (
                    <BeachCard
                      key={location.id}
                      location={location}
                      onSelect={handleBeachSelect}
                      getVehicleCount={getVehicleCountForBeach}
                      t={t}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* ✅ CONTENIDO PRINCIPAL (solo si se ha seleccionado una playa) */}
          {selectedBeachId !== null && (
            <>
              {/* ✅ NUEVO: Selector de playa elegante */}
              <BeachSelector
                beachLocations={beachLocations}
                selectedBeachId={selectedBeachId}
                selectedBeachName={selectedBeachName}
                onBeachSelect={handleBeachSelect}
                onBackToSelection={handleBackToBeaches}
                t={t}
              />

              {/* ✅ FILTRO SIMPLE DE FECHA */}
              <SimpleDateFilter onDateSelect={handleDateSelect} isLoading={searchLoading} language={language} />

              {/* 🎯 SELECTOR DE PESTAÑAS OPTIMIZADO PARA MÓVILES */}
              <div className="flex justify-center mb-12 px-2 sm:px-4">
                <div className="w-full max-w-5xl">
                  <div className="flex rounded-2xl overflow-hidden shadow-lg border-2 border-gray-200">
                    {/* Pestaña Sin Licencia */}
                    <button
                      onClick={() => setActiveLicense("without")}
                      className={`flex-1 p-3 sm:p-6 transition-all duration-300 relative ${
                        activeLicense === "without"
                          ? "bg-gradient-to-r from-black via-gray-900 to-black text-white border-r-2 border-gold shadow-xl"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-r border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <div className="text-left">
                          <h3 className="text-sm sm:text-lg font-bold leading-tight">{t.withoutLicense}</h3>
                          <p className="text-xs opacity-80 mt-1 hidden lg:block">{t.withoutLicenseDesc}</p>
                        </div>
                      </div>
                      {/* Indicador dorado para pestaña activa */}
                      {activeLicense === "without" && (
                        <>
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold via-yellow-400 to-gold"></div>
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-gold via-yellow-400 to-gold"></div>
                          <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-gold p-1 sm:p-2 rounded-full">
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-black" />
                          </div>
                        </>
                      )}
                    </button>

                    {/* Pestaña Con Licencia */}
                    <button
                      onClick={() => setActiveLicense("with")}
                      className={`flex-1 p-3 sm:p-6 transition-all duration-300 relative ${
                        activeLicense === "with"
                          ? "bg-gradient-to-r from-black via-gray-900 to-black text-white border-l-2 border-gold shadow-xl"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-l border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <div className="text-left">
                          <h3 className="text-sm sm:text-lg font-bold leading-tight">{t.withLicense}</h3>
                          <p className="text-xs opacity-80 mt-1 hidden lg:block">{t.withLicenseDesc}</p>
                        </div>
                      </div>
                      {/* Indicador dorado para pestaña activa */}
                      {activeLicense === "with" && (
                        <>
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold via-yellow-400 to-gold"></div>
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-gold via-yellow-400 to-gold"></div>
                          <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-gold p-1 sm:p-2 rounded-full">
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-black" />
                          </div>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Indicador adicional móvil - Más compacto */}
                  <div className="mt-3 text-center sm:hidden">
                    <div
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                        activeLicense === "without" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {activeLicense === "without" ? (
                        <>
                          <Waves className="h-3 w-3 mr-1.5" />
                          {t.withoutLicense}
                        </>
                      ) : (
                        <>
                          <Anchor className="h-3 w-3 mr-1.5" />
                          {t.withLicense}
                        </>
                      )}
                    </div>
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
            </>
          )}
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

// ✅ NUEVO: Componente para tarjeta de playa
function BeachCard({
  location,
  onSelect,
  getVehicleCount,
  t,
}: {
  location: BeachLocation
  onSelect: (id: string, name: string) => void
  getVehicleCount: (id: string) => Promise<number>
  t: Translations
}) {
  const [vehicleCount, setVehicleCount] = useState<number | null>(null)

  useEffect(() => {
    getVehicleCount(location.id).then(setVehicleCount)
  }, [location.id, getVehicleCount])

  return (
    <Card
      className="cursor-pointer hover:shadow-xl transition-shadow duration-300 border-2 border-gray-200 hover:border-gold w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
      onClick={() => onSelect(location.id, location.name)}
    >
      <CardContent className="flex flex-col items-center justify-center p-6 min-h-[180px]">
        <MapPin className="h-12 w-12 text-gold mb-4" />
        <h3 className="text-xl font-bold text-black text-center">{location.name}</h3>
        <p className="text-sm text-gray-600 mt-2">
          {vehicleCount !== null ? `${vehicleCount} ${t.productsAvailable}` : "Cargando..."}
        </p>
      </CardContent>
    </Card>
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

  // Obtener extras habilitados - FIXED
  const enabledExtras = (() => {
    if (!vehicle.extraFeatures || !Array.isArray(vehicle.extraFeatures)) {
      return []
    }
    return vehicle.extraFeatures.filter((extra) => {
      // ✅ FIXED: Check for both 'enabled' and 'description' fields
      const isEnabled =
        extra.enabled === true ||
        (typeof extra.enabled === "string" && extra.enabled === "true") ||
        (typeof extra.description === "boolean" && extra.description === true) ||
        (typeof extra.description === "string" && extra.description === "true")
      console.log(`🔍 Extra ${extra.name}:`, { enabled: extra.enabled, description: extra.description, isEnabled })
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
      onClick={handleCardClick}
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
        <div className="absolute top-4 left-4 flex gap-2">
          {/* Badge de licencia */}
          <Badge
            className={`font-semibold ${
              vehicle.requiresLicense ? "bg-blue-600 text-white" : "bg-green-600 text-white"
            }`}
          >
            {vehicle.requiresLicense ? t.licenseRequired : t.noLicenseNeeded}
          </Badge>
          {/* Badge de gasolina */}
          {vehicle.fuelIncluded ? (
            <Badge className="bg-green-500 text-white font-semibold">
              <Fuel className="h-3 w-3 mr-1" />
              {t.fuelIncluded}
            </Badge>
          ) : (
            <Badge className="bg-orange-500 text-white font-semibold">
              <Fuel className="h-3 w-3 mr-1" />
              {t.fuelSeparate}
            </Badge>
          )}
        </div>
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

          {/* ✅ EXTRAS: Solo se muestra si hay extras habilitados */}
          {enabledExtras.length > 0 && (
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
          )}

          {/* Fianza */}
          {vehicle.securityDeposit != null && vehicle.securityDeposit > 0 && (
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

          {/* ✅ FIANZA MANUAL: Solo se muestra si es mayor que 0 */}
          {vehicle.manualDeposit != null && vehicle.manualDeposit > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
              <span className="text-sm text-yellow-800 font-medium">
                Fianza a dejar en el sitio: €{vehicle.manualDeposit}
              </span>
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
