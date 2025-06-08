"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CalendarPicker } from "./calendar-picker"
import { TimePicker } from "./time-picker"
import { BookingSummary } from "./booking-summary"
import { LiabilityWaiver } from "./liability-waiver"
import { ArrowLeft, Ship, Zap, Users, Calendar, CreditCard, FileText } from "lucide-react"
import Image from "next/image"
import { useApp } from "@/components/providers"
import type { Vehicle } from "@/lib/db/schema"
import { useRouter } from "next/navigation"
import { StripePayment } from "./stripe-payment"
import { OroLoading } from "@/components/ui/oro-loading"

interface BookingFormProps {
  vehicle: Vehicle
}

interface BookingData {
  vehicleId: number
  customerName: string
  customerEmail: string
  customerPhone: string
  bookingDate: string
  startTime: string
  endTime: string
  timeSlot: string
  duration: string
  totalPrice: number
  notes: string
  securityDeposit?: number
  liabilityWaiverId?: number // ✅ Añadido: ID del documento firmado
}

const translations = {
  es: {
    title: "Reservar",
    subtitle: "Completa tu reserva",
    step1: "Selecciona fecha y hora",
    step2: "Datos del cliente",
    step3: "Exención de responsabilidad", // ✅ Nuevo paso
    step4: "Confirmar",
    step5: "Pago", // ✅ Actualizado
    selectDate: "Selecciona una fecha",
    selectTime: "Selecciona horario",
    customerInfo: "Información del cliente",
    name: "Nombre completo",
    email: "Email",
    phone: "Teléfono",
    notes: "Notas adicionales (opcional)",
    notesPlaceholder: "Alguna petición especial...",
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
  },
  en: {
    title: "Book",
    subtitle: "Complete your booking",
    step1: "Select date and time",
    step2: "Customer details",
    step3: "Liability waiver", // ✅ Nuevo paso
    step4: "Confirm",
    step5: "Payment", // ✅ Actualizado
    selectDate: "Select a date",
    selectTime: "Select time",
    customerInfo: "Customer information",
    name: "Full name",
    email: "Email",
    phone: "Phone",
    notes: "Additional notes (optional)",
    notesPlaceholder: "Any special requests...",
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
  },
}

export function BookingForm({ vehicle }: BookingFormProps) {
  const { language } = useApp()
  const t = translations[language]
  const router = useRouter()

  // ✅ Obtener la fianza del vehículo
  const securityDeposit = Number(vehicle.securityDeposit) || 0

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
    bookingDate: "",
    startTime: "",
    endTime: "",
    timeSlot: "",
    duration: "",
    totalPrice: 0,
    notes: "",
    securityDeposit: securityDeposit,
    liabilityWaiverId: undefined, // ✅ Añadido: ID del documento firmado
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [navigationLoading, setNavigationLoading] = useState(false)

  // ✅ Ref para el botón "Siguiente" para scroll automático
  const nextButtonRef = useRef<HTMLButtonElement>(null)

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
      }))
    }
  }, [selectedDate, selectedTime, securityDeposit])

  const handleNextStep = () => {
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
    }

    if (currentStep === 2) {
      if (!bookingData.customerName || !bookingData.customerEmail || !bookingData.customerPhone) {
        setError(t.fillAllFields)
        return
      }
    }

    setCurrentStep((prev) => prev + 1)
  }

  const handlePrevStep = () => {
    setNavigationLoading(true)

    setTimeout(() => {
      setCurrentStep((prev) => prev - 1)
      setError("")
      setNavigationLoading(false)
    }, 1500)
  }

  // ✅ Nuevo: Manejar firma del documento
  const handleWaiverSigned = (waiverId: number) => {
    setBookingData((prev) => ({
      ...prev,
      liabilityWaiverId: waiverId,
    }))
    setCurrentStep(4) // Ir al paso de confirmación
  }

  const handleBooking = () => {
    setCurrentStep(5) // ✅ Actualizado: Ahora es el paso 5
  }

  return (
    <>
      <section className="py-24 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
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
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-black">
                {t.title} {vehicle.name}
              </h1>
              <p className="text-lg text-gray-600">{t.subtitle}</p>
            </div>
          </div>

          {/* Progress Steps - ✅ Actualizado para 5 pasos */}
          <div className="flex items-center justify-center mb-12">
            <div className="flex items-center space-x-4">
              {[1, 2, 3, 4, 5].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      currentStep >= step ? "bg-gold text-black" : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step}
                  </div>
                  {step < 5 && <div className={`w-16 h-1 mx-2 ${currentStep > step ? "bg-gold" : "bg-gray-200"}`} />}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Vehicle Info */}
            <div className="lg:col-span-1">
              <Card className="bg-white border border-gray-200 sticky top-24">
                <CardContent className="p-6">
                  <div className="relative w-full h-48 bg-gray-50 rounded-lg overflow-hidden mb-4">
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

            {/* Booking Form */}
            <div className="lg:col-span-2">
              <Card className="bg-white border border-gray-200">
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

                <CardContent className="space-y-8">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  )}

                  {/* Step 1: Date and Time Selection */}
                  {currentStep === 1 && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-lg font-semibold text-black mb-4">{t.selectDate}</h3>
                        <CalendarPicker
                          vehicleId={vehicle.id}
                          selectedDate={selectedDate}
                          onDateSelect={setSelectedDate}
                        />
                      </div>

                      {selectedDate && (
                        <div>
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

                  {/* Step 2: Customer Information */}
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.notes}</label>
                        <Textarea
                          value={bookingData.notes}
                          onChange={(e) => setBookingData((prev) => ({ ...prev, notes: e.target.value }))}
                          placeholder={t.notesPlaceholder}
                          rows={3}
                          className="bg-gray-50 border-gray-200"
                        />
                      </div>
                    </div>
                  )}

                  {/* ✅ Step 3: Liability Waiver */}
                  {currentStep === 3 && (
                    <LiabilityWaiver
                      customerName={bookingData.customerName}
                      customerEmail={bookingData.customerEmail}
                      onWaiverSigned={handleWaiverSigned}
                      onBack={handlePrevStep}
                    />
                  )}

                  {/* Step 4: Summary and Payment - ✅ Actualizado */}
                  {currentStep === 4 && (
                    <div className="space-y-6">
                      <BookingSummary vehicle={vehicle} bookingData={bookingData} />
                    </div>
                  )}

                  {/* Step 5: Payment - ✅ Actualizado */}
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
                        bookingData={bookingData}
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

                  {/* Navigation Buttons - ✅ Actualizado para manejar el nuevo paso */}
                  <div className="pt-6 border-t border-gray-200">
                    {currentStep > 1 && currentStep < 5 && currentStep !== 3 ? (
                      // Two buttons layout - Skip step 3 because it has its own navigation
                      <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
                        <Button
                          variant="outline"
                          onClick={handlePrevStep}
                          className="border-gray-300 w-full sm:w-auto order-2 sm:order-1"
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Anterior
                        </Button>

                        <div className="order-1 sm:order-2">
                          {currentStep < 4 ? (
                            <Button
                              ref={nextButtonRef}
                              onClick={handleNextStep}
                              className="bg-black text-white hover:bg-gold hover:text-black transition-all duration-300 w-full sm:w-auto"
                            >
                              Siguiente
                              <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                            </Button>
                          ) : currentStep === 4 ? (
                            <Button
                              onClick={handleBooking}
                              className="bg-gold text-black hover:bg-black hover:text-white transition-all duration-300 font-medium text-lg px-6 py-3 w-full sm:w-auto"
                            >
                              <CreditCard className="h-5 w-5 mr-2" />
                              Proceder al Pago
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ) : currentStep === 1 ? (
                      // Single button layout - First step
                      <div className="flex justify-end">
                        <Button
                          ref={nextButtonRef}
                          onClick={handleNextStep}
                          className="bg-black text-white hover:bg-gold hover:text-black transition-all duration-300 w-full sm:w-auto"
                        >
                          Siguiente
                          <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Indicador de carga durante la navegación */}
      {navigationLoading && <OroLoading />}
    </>
  )
}
