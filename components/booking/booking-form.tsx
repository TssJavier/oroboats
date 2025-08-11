"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CalendarPicker } from "./calendar-picker"
import { TimePicker } from "./time-picker"
import { LiabilityWaiver } from "./liability-waiver"
import {
  ArrowLeft,
  Ship,
  Zap,
  Users,
  Calendar,
  CreditCard,
  FileText,
  Share2,
  Copy,
  Check,
  Hotel,
  Loader2,
} from "lucide-react"
import Image from "next/image"
import { useApp } from "@/components/providers"
import type { Vehicle } from "@/lib/db/schema"
import { useRouter, useSearchParams } from "next/navigation"
import { StripePayment } from "./stripe-payment"
import { OroLoading } from "@/components/ui/oro-loading"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog" // Importar componentes de Dialog

interface BookingFormProps {
  vehicle: Vehicle
}

interface BookingData {
  vehicleId: number
  customerName: string
  customerEmail: string
  customerPhone: string
  customerDni: string
  bookingDate: string
  startTime: string
  endTime: string
  timeSlot: string
  duration: string
  totalPrice: number
  notes: string
  securityDeposit?: number
  liabilityWaiverId?: number
  hotelCode?: string
  beachLocationId?: string
}

interface TimeSlot {
  time: string
  endTime: string
  available: boolean
  type?: string
  restricted?: boolean
  restrictionReason?: string
  duration: string
  label: string
  price: number
  availableUnits?: number
  totalUnits?: number
}

const translations = {
  es: {
    title: "Reservar",
    subtitle: "Completa tu reserva",
    step1: "Selecciona fecha y hora",
    step2: "Datos del cliente",
    step3: "Exención de responsabilidad",
    step4: "Confirmar",
    step5: "Pago",
    selectDate: "Selecciona una fecha",
    selectTime: "Selecciona horario",
    customerInfo: "Información del cliente",
    name: "Nombre completo",
    email: "Email",
    phone: "Teléfono",
    notes: "Notas adicionales (opcional)",
    notesPlaceholder: "Alguna petición especial...",
    hotelCode: "Código de Hotel (opcional)",
    hotelCodePlaceholder: "Introduce el código",
    summary: "Resumen de la reserva",
    total: "Total",
    payNow: "Confirmar Reserva",
    back: "Volver",
    capacity: "Capacidad",
    includes: "Incluye",
    loading: "Cargando...",
    selectDateFirst: "Selecciona una fecha primero",
    selectTimeFirst: "Selecciona un horario",
    fillAllFields: "Completa todos los campos obligatorios",
    bookingSuccess: "¡Reserva creada exitosamente!",
    pastBookingError: "No puedes reservar en el pasado",
    shareBooking: "Compartir reserva",
    shareDescription: "Comparte este enlace para que el cliente complete la reserva",
    linkCopied: "Enlace copiado al portapapeles",
    prefilledBooking: "Reserva preconfigurada",
    prefilledDescription: "",
    vehicleSelected: "Vehículo seleccionado",
    dateTimeSelected: "Fecha y hora seleccionadas",
    // NUEVAS TRADUCCIONES PARA EL MODAL DE DISPONIBILIDAD
    slotNotAvailableTitle: "Horario no disponible",
    slotNotAvailableDescription:
      "El horario seleccionado ya no está disponible. Por favor, selecciona un nuevo horario.",
    modifySelection: "Modificar selección",
    checkingAvailability: "Verificando disponibilidad...",
  },
  en: {
    title: "Book",
    subtitle: "Complete your booking",
    step1: "Select date and time",
    step2: "Customer details",
    step3: "Liability waiver",
    step4: "Confirm",
    step5: "Payment",
    selectDate: "Select a date",
    selectTime: "Select time",
    customerInfo: "Customer information",
    name: "Full name",
    email: "Email",
    phone: "Phone",
    notes: "Additional notes (optional)",
    notesPlaceholder: "Any special requests...",
    hotelCode: "Hotel Code (optional)",
    hotelCodePlaceholder: "Enter the code",
    summary: "Booking summary",
    total: "Total",
    payNow: "Confirm Booking",
    back: "Back",
    capacity: "Capacity",
    includes: "Includes",
    loading: "Loading...",
    selectDateFirst: "Select a date first",
    selectTimeFirst: "Select a time slot",
    fillAllFields: "Fill all required fields",
    bookingSuccess: "Booking created successfully!",
    pastBookingError: "You cannot book in the past",
    shareBooking: "Share booking",
    shareDescription: "Share this link for the customer to complete the booking",
    linkCopied: "Link copied to clipboard",
    prefilledBooking: "Pre-configured booking",
    prefilledDescription: "",
    vehicleSelected: "Vehicle selected",
    dateTimeSelected: "Date and time selected",
    // NEW TRANSLATIONS FOR AVAILABILITY MODAL
    slotNotAvailableTitle: "Time Slot Not Available",
    slotNotAvailableDescription: "The selected time slot is no longer available. Please select a new time slot.",
    modifySelection: "Modify selection",
    checkingAvailability: "Checking availability...",
  },
}

export function BookingForm({ vehicle }: BookingFormProps) {
  const { language } = useApp()
  const t = translations[language]
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [isDeeplink, setIsDeeplink] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [linkCopied, setLinkCopied] = useState(false)

  const securityDeposit = Number(vehicle.securityDeposit) || 0
  const manualDeposit = Number(vehicle.manualDeposit) || 0

  const [currentStep, setCurrentStep] = useState(1)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<{
    start: string
    end: string
    duration: string
    price: number
  } | null>(null)
  const [bookingData, setBookingData] = useState<BookingData>({
    vehicleId: vehicle.id,
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerDni: "",
    bookingDate: "",
    startTime: "",
    endTime: "",
    timeSlot: "",
    duration: "",
    totalPrice: 0,
    notes: "",
    securityDeposit: securityDeposit,
    liabilityWaiverId: undefined,
    hotelCode: "",
    beachLocationId: vehicle.beachLocationId ?? undefined,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [navigationLoading, setNavigationLoading] = useState(false)
  const [showHotelCodeInput, setShowHotelCodeInput] = useState(false)

  // NUEVOS ESTADOS PARA EL MODAL DE DISPONIBILIDAD
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false)
  const [availabilityCheckLoading, setAvailabilityCheckLoading] = useState(false)

  const stepTitleRef = useRef<HTMLDivElement>(null)
  const nextButtonRef = useRef<HTMLButtonElement>(null)
  const durationSectionRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>

  useEffect(() => {
    const date = searchParams.get("date")
    const startTime = searchParams.get("startTime")
    const endTime = searchParams.get("endTime")
    const duration = searchParams.get("duration")
    const price = searchParams.get("price")

    if (date && startTime && endTime && duration && price) {
      console.log("🔗 Deeplink detectado:", { date, startTime, endTime, duration, price })

      setIsDeeplink(true)
      setSelectedDate(date)
      setSelectedTime({
        start: startTime,
        end: endTime,
        duration: duration,
        price: Number(price),
      })

      setCurrentStep(2)

      toast({
        title: t.prefilledBooking,
        description: t.prefilledDescription,
      })
    }
  }, [searchParams, t, toast])

  useEffect(() => {
    if (selectedDate && selectedTime) {
      const timeSlot = `${selectedTime.start}-${selectedTime.end}`

      setBookingData((prev) => ({
        ...prev,
        bookingDate: selectedDate,
        startTime: selectedTime.start,
        endTime: selectedTime.end,
        timeSlot: timeSlot,
        duration: selectedTime.duration,
        totalPrice: selectedTime.price,
        securityDeposit: securityDeposit,
        beachLocationId: vehicle.beachLocationId ?? undefined,
      }))
    }
  }, [selectedDate, selectedTime, securityDeposit, vehicle.beachLocationId])

  useEffect(() => {
    const scrollTimer = setTimeout(() => {
      if (stepTitleRef.current) {
        stepTitleRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }, 100)

    return () => clearTimeout(scrollTimer)
  }, [currentStep])

  const generateShareLink = () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Error",
        description: "Selecciona fecha y hora primero",
        variant: "destructive",
      })
      return
    }

    const baseUrl = window.location.origin
    const vehiclePath = `/boats/${vehicle.id}/book`
    const params = new URLSearchParams({
      date: selectedDate,
      startTime: selectedTime.start,
      endTime: selectedTime.end,
      duration: selectedTime.duration,
      price: selectedTime.price.toString(),
    })

    const fullUrl = `${baseUrl}${vehiclePath}?${params.toString()}`
    setShareUrl(fullUrl)
    setShowShareModal(true)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setLinkCopied(true)
      toast({
        title: t.linkCopied,
        description: "El enlace se ha copiado al portapapeles",
      })

      setTimeout(() => {
        setLinkCopied(false)
      }, 3000)
    } catch (err) {
      console.error("Error copying to clipboard:", err)
    }
  }

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>, delay = 500) => {
    setTimeout(() => {
      if (ref.current && window.innerWidth <= 768) {
        ref.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
        })
      }
    }, delay)
  }

  const checkSelectedSlotAvailability = async (): Promise<boolean> => {
    if (!bookingData.bookingDate || !bookingData.duration || !selectedTime) {
      setError("Faltan datos para verificar la disponibilidad.")
      return false
    }

    setAvailabilityCheckLoading(true)
    setError("")

    try {
      const formattedDate = bookingData.bookingDate.includes("T")
        ? bookingData.bookingDate.split("T")[0]
        : bookingData.bookingDate

      const url = `/api/availability/${vehicle.id}/slots?date=${encodeURIComponent(formattedDate)}&durationType=${encodeURIComponent(bookingData.duration)}`
      const response = await fetch(url)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        setError(`Error al verificar disponibilidad: ${errorData.error || "No se pudieron cargar los horarios"}`)
        return false
      }

      const data = await response.json()
      const availableSlots: TimeSlot[] = data.slots || []

      const foundSlot = availableSlots.find(
        (slot) =>
          slot.time === selectedTime.start &&
          slot.endTime === selectedTime.end &&
          slot.duration === selectedTime.duration,
      )

      if (
        foundSlot &&
        foundSlot.available &&
        (foundSlot.availableUnits === undefined || foundSlot.availableUnits > 0)
      ) {
        return true // El slot sigue disponible
      } else {
        setError(t.slotNotAvailableDescription)
        setShowAvailabilityModal(true)
        return false // El slot ya no está disponible
      }
    } catch (err) {
      console.error("Error en la verificación de disponibilidad:", err)
      setError("Error de conexión al verificar disponibilidad.")
      return false
    } finally {
      setAvailabilityCheckLoading(false)
    }
  }

  const handleNextStep = async () => {
    setError("")

    if (currentStep === 1) {
      if (!selectedDate) {
        setError(t.selectDateFirst)
        return
      }
      if (!selectedTime) {
        setError(t.selectTimeFirst)
        return
      }
      setCurrentStep((prev) => prev + 1)
    } else if (currentStep === 2) {
      if (
        !bookingData.customerName ||
        !bookingData.customerEmail ||
        !bookingData.customerPhone ||
        !bookingData.customerDni
      ) {
        setError(t.fillAllFields)
        return
      }

      // ✅ VERIFICAR DISPONIBILIDAD ANTES DE AVANZAR
      const isAvailable = await checkSelectedSlotAvailability()
      if (isAvailable) {
        setCurrentStep((prev) => prev + 1)
      }
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrevStep = () => {
    setNavigationLoading(true)

    setTimeout(() => {
      if (isDeeplink && currentStep === 2) {
        setNavigationLoading(false)
        return
      }

      setCurrentStep((prev) => prev - 1)
      setError("")
      setNavigationLoading(false)
    }, 1500)
  }

  const handleWaiverSigned = (waiverId: number) => {
    setBookingData((prev) => ({
      ...prev,
      liabilityWaiverId: waiverId,
    }))
    setCurrentStep(5)
  }

  const handleBooking = () => {
    setCurrentStep(5)
  }

  return (
    <>
      <section className="py-24 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              onClick={() => {
                setNavigationLoading(true)
                setTimeout(() => {
                  router.push("/boats")
                }, 1500)
              }}
              className="border-gray-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t.back}
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-black">
                {t.title} {vehicle.name}
              </h1>
              <p className="text-lg text-gray-600">{t.subtitle}</p>
            </div>
          </div>

          {isDeeplink && (
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900">{t.prefilledBooking}</h3>
                  <p className="text-blue-700 text-sm mb-3">{t.prefilledDescription}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium text-blue-900">{t.vehicleSelected}</div>
                      <div className="text-blue-700">{vehicle.name}</div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium text-blue-900">{t.dateTimeSelected}</div>
                      <div className="text-blue-700">
                        {new Date(selectedDate).toLocaleDateString("es-ES")} • {selectedTime?.start} -{" "}
                        {selectedTime?.end}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center mb-8 sm:mb-12 overflow-x-auto px-2">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-max">
              {(isDeeplink ? [2, 3, 5] : [1, 2, 3, 5]).map((step, index) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-sm sm:text-base ${
                      currentStep >= step ? "bg-gold text-black" : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {index + 1}
                  </div>
                  {index < (isDeeplink ? 2 : 3) && (
                    <div className={`w-8 sm:w-16 h-1 mx-1 sm:mx-2 ${currentStep > step ? "bg-gold" : "bg-gray-200"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Card className="bg-white border border-gray-200 sticky top-24">
                <CardContent className="p-6">
                  <div className="relative w-full h-50 bg-gray-50 rounded-lg overflow-hidden mb-5">
                    <Image
                      src={vehicle.image || "/placeholder.svg"}
                      alt={vehicle.name}
                      width={500}
                      height={300}
                      className="object-contain p-4"
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-black flex items-center">
                        {vehicle.type === "jetski" ? (
                          <Zap className="h-5 w-5 mr-2 text-gold" />
                        ) : (
                          <Ship className="h-5 w-5 mr-2 text-gold" />
                        )}
                        {vehicle.name}
                      </h3>
                      <p className="text-gray-600">{vehicle.description}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-gray-500">
                        <Users className="h-4 w-4 mr-2 text-gold" />
                        {t.capacity}
                      </span>
                      <span className="font-semibold text-black">{vehicle.capacity} personas</span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-gray-500 text-sm">{t.includes}:</span>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(vehicle.includes) &&
                          vehicle.includes.map((item, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                      </div>
                    </div>

                    {securityDeposit > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                          <span className="font-semibold">Fianza reembolsable:</span> €{securityDeposit}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card className="bg-white border border-gray-200">
                <div ref={stepTitleRef} id="step-title">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-black flex items-center">
                      {currentStep === 1 && <Calendar className="h-6 w-6 text-gold mr-3" />}
                      {currentStep === 2 && <Users className="h-6 w-6 text-gold mr-3" />}
                      {currentStep === 3 && <FileText className="h-6 w-6 text-gold mr-3" />}
                      {currentStep === 4 && <CreditCard className="h-6 w-6 text-gold mr-3" />}
                      {currentStep === 5 && <CreditCard className="h-6 w-6 text-gold mr-3" />}
                      {currentStep === 1 && t.step1}
                      {currentStep === 2 && t.step2}
                      {currentStep === 3 && t.step3}
                      {currentStep === 4 && t.step4}
                      {currentStep === 5 && t.step5}
                    </CardTitle>
                  </CardHeader>
                </div>

                <CardContent className="space-y-8">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  )}

                  {currentStep === 1 && !isDeeplink && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-lg font-semibold text-black mb-4">{t.selectDate}</h3>
                        <CalendarPicker
                          vehicleId={vehicle.id}
                          selectedDate={selectedDate}
                          onDateSelect={(date) => {
                            setSelectedDate(date)
                            scrollToSection(durationSectionRef, 300)
                          }}
                        />
                      </div>

                      {selectedDate && (
                        <div ref={durationSectionRef}>
                          <h3 className="text-lg font-semibold text-black mb-4">{t.selectTime}</h3>
                          <TimePicker
                            vehicleId={vehicle.id}
                            selectedDate={selectedDate}
                            vehicle={vehicle}
                            selectedTime={selectedTime}
                            onTimeSelect={setSelectedTime}
                            nextButtonRef={nextButtonRef}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-black">{t.customerInfo}</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">{t.name} *</label>
                          <Input
                            value={bookingData.customerName}
                            onChange={(e) => setBookingData((prev) => ({ ...prev, customerName: e.target.value }))}
                            placeholder="Juan Pérez"
                            required
                            className="bg-gray-50 border-gray-200"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">{t.email} *</label>
                          <Input
                            type="email"
                            value={bookingData.customerEmail}
                            onChange={(e) => setBookingData((prev) => ({ ...prev, customerEmail: e.target.value }))}
                            placeholder="juan@email.com"
                            required
                            className="bg-gray-50 border-gray-200"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.phone} *</label>
                        <Input
                          type="tel"
                          value={bookingData.customerPhone}
                          onChange={(e) => setBookingData((prev) => ({ ...prev, customerPhone: e.target.value }))}
                          placeholder="+34 123 456 789"
                          required
                          className="bg-gray-50 border-gray-200"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">DNI/NIE *</label>
                        <Input
                          value={bookingData.customerDni}
                          onChange={(e) => setBookingData((prev) => ({ ...prev, customerDni: e.target.value }))}
                          placeholder="12345678A"
                          required
                          className="bg-gray-50 border-gray-200"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.notes}</label>
                        <Textarea
                          value={bookingData.notes}
                          onChange={(e) => setBookingData((prev) => ({ ...prev, notes: e.target.value }))}
                          placeholder={t.notesPlaceholder}
                          rows={3}
                          className="bg-gray-50 border-gray-200"
                        />
                      </div>

                      <div className="space-y-2">
                        {!showHotelCodeInput && (
                          <Button
                            variant="outline"
                            onClick={() => setShowHotelCodeInput(true)}
                            className="w-12 h-12 p-0 flex items-center justify-center border-gray-300 text-gray-600 hover:text-black hover:bg-gray-100"
                            aria-label="Añadir código de hotel"
                          >
                            <Hotel className="h-5 w-5" />
                          </Button>
                        )}
                        {showHotelCodeInput && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t.hotelCode}</label>
                            <Input
                              value={bookingData.hotelCode}
                              onChange={(e) =>
                                setBookingData((prev) => ({ ...prev, hotelCode: e.target.value.toUpperCase() }))
                              }
                              placeholder={t.hotelCodePlaceholder}
                              className="bg-gray-50 border-gray-200"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <LiabilityWaiver
                      customerName={bookingData.customerName}
                      customerEmail={bookingData.customerEmail}
                      customerDni={bookingData.customerDni}
                      manualDeposit={manualDeposit}
                      onWaiverSigned={handleWaiverSigned}
                      onBack={handlePrevStep}
                    />
                  )}

                  {currentStep === 5 && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-black mb-2">Pago Seguro</h3>

                        <div className="space-y-1">
                          <p className="text-gray-600">
                            Precio del alquiler: <span className="font-semibold">€{bookingData.totalPrice}</span>
                          </p>

                          {securityDeposit > 0 && (
                            <p className="text-blue-600">
                              Fianza (reembolsable): <span className="font-semibold">€{securityDeposit}</span>
                            </p>
                          )}

                          <p className="text-xl font-bold mt-2">
                            Total a pagar: €{bookingData.totalPrice + securityDeposit}
                          </p>
                        </div>
                      </div>

                      <StripePayment
                        amount={bookingData.totalPrice}
                        securityDeposit={securityDeposit}
                        bookingData={{
                          ...bookingData,
                          vehicleName: vehicle.name,
                          vehicleType: vehicle.type,
                          vehicleCategory: vehicle.category,
                        }}
                        onSuccess={() => {
                          router.push("/")
                        }}
                        onError={(error) => {
                          setError(error)
                          setCurrentStep(4)
                        }}
                      />
                    </div>
                  )}

                  <div className="pt-6 border-t border-gray-200 space-y-4">
                    {currentStep > 1 && currentStep < 5 && currentStep !== 3 ? (
                      <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
                        {!(isDeeplink && currentStep === 2) && (
                          <Button
                            variant="outline"
                            onClick={handlePrevStep}
                            className="border-gray-300 w-full sm:w-auto order-2 sm:order-1 bg-transparent"
                            disabled={availabilityCheckLoading} // Deshabilitar si se está verificando disponibilidad
                          >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Anterior
                          </Button>
                        )}

                        <div className="order-1 sm:order-2">
                          <Button
                            ref={nextButtonRef}
                            onClick={handleNextStep}
                            className="bg-black text-white hover:bg-gold hover:text-black transition-all duration-300 w-full sm:w-auto"
                            disabled={availabilityCheckLoading} // Deshabilitar si se está verificando disponibilidad
                          >
                            {availabilityCheckLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {t.checkingAvailability}
                              </>
                            ) : (
                              <>
                                Siguiente
                                <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : currentStep === 1 ? (
                      <div className="flex flex-col gap-4 sm:items-end">
                        <Button
                          ref={nextButtonRef}
                          onClick={handleNextStep}
                          className="bg-black text-white hover:bg-gold hover:text-black transition-all duration-300 w-full sm:w-auto"
                        >
                          Siguiente
                          <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                        </Button>

                        {selectedDate && selectedTime && !isDeeplink && (
                          <Button
                            variant="outline"
                            onClick={generateShareLink}
                            className="border-gold text-black hover:bg-gold hover:text-black bg-transparent w-full sm:w-auto"
                          >
                            <Share2 className="h-4 w-4 mr-2" />
                            {t.shareBooking}
                          </Button>
                        )}
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">{t.shareBooking}</h3>
            <p className="text-gray-600 text-sm mb-4">{t.shareDescription}</p>

            <div className="bg-gray-50 p-3 rounded border mb-4">
              <p className="text-xs text-gray-500 mb-2">Enlace de reserva:</p>
              <p className="text-sm font-mono break-all">{shareUrl}</p>
            </div>

            <div className="flex gap-2">
              <Button onClick={copyToClipboard} className="flex-1" variant={linkCopied ? "default" : "outline"}>
                {linkCopied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </>
                )}
              </Button>
              <Button onClick={() => setShowShareModal(false)} variant="outline">
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Nuevo Modal de Disponibilidad */}
      <Dialog open={showAvailabilityModal} onOpenChange={setShowAvailabilityModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              {t.slotNotAvailableTitle}
            </DialogTitle>
            <DialogDescription>{t.slotNotAvailableDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                onClick={() => {
                  router.push(`/boats/${vehicle.id}/book`) // Navegar a la URL base del vehículo
                  setIsDeeplink(false) // Resetear el estado de deeplink
                  setSelectedDate("") // Limpiar la fecha seleccionada
                  setSelectedTime(null) // Limpiar la hora seleccionada
                  setCurrentStep(1) // Asegurarse de que el paso sea el 1
                  setError("") // Limpiar cualquier error previo
                }}
                className="bg-black text-white hover:bg-gold hover:text-black"
              >
                {t.modifySelection}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {navigationLoading && <OroLoading />}
    </>
  )
}
