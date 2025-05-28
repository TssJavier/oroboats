"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CalendarPicker } from "./calendar-picker"
import { TimePicker } from "./time-picker"
import { BookingSummary } from "./booking-summary"
import { ArrowLeft, Ship, Zap, Users, Calendar, CreditCard } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useApp } from "@/components/providers"
import type { Vehicle } from "@/lib/db/schema"

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
  duration: string
  totalPrice: number
  notes: string
}

const translations = {
  es: {
    title: "Reservar",
    subtitle: "Completa tu reserva",
    step1: "Selecciona fecha y hora",
    step2: "Datos del cliente",
    step3: "Confirmar y pagar",
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
    payNow: "Pagar Ahora",
    back: "Volver",
    capacity: "Capacidad",
    includes: "Incluye",
    loading: "Cargando...",
    selectDateFirst: "Selecciona una fecha primero",
    selectTimeFirst: "Selecciona un horario",
    fillAllFields: "Completa todos los campos obligatorios",
  },
  en: {
    title: "Book",
    subtitle: "Complete your booking",
    step1: "Select date and time",
    step2: "Customer details",
    step3: "Confirm and pay",
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
    payNow: "Pay Now",
    back: "Back",
    capacity: "Capacity",
    includes: "Includes",
    loading: "Loading...",
    selectDateFirst: "Select a date first",
    selectTimeFirst: "Select a time slot",
    fillAllFields: "Fill all required fields",
  },
}

export function BookingForm({ vehicle }: BookingFormProps) {
  const { language } = useApp()
  const t = translations[language]

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
    duration: "",
    totalPrice: 0,
    notes: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (selectedDate && selectedTime) {
      setBookingData((prev) => ({
        ...prev,
        bookingDate: selectedDate,
        startTime: selectedTime.start,
        endTime: selectedTime.end,
        duration: selectedTime.duration,
        totalPrice: selectedTime.price,
      }))
    }
  }, [selectedDate, selectedTime])

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
    setCurrentStep((prev) => prev - 1)
    setError("")
  }

  const handleBooking = async () => {
    setLoading(true)
    setError("")

    try {
      // Aquí iría la lógica de pago
      // Por ahora solo creamos la reserva
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      })

      if (response.ok) {
        // Redirigir a página de éxito o mostrar modal
        alert("¡Reserva creada exitosamente! Pronto implementaremos el pago.")
      } else {
        const data = await response.json()
        setError(data.error || "Error al crear la reserva")
      }
    } catch (err) {
      console.error("Booking error:", err)
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-24 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" asChild className="border-gray-300">
            <Link href="/boats">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t.back}
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-black">
              {t.title} {vehicle.name}
            </h1>
            <p className="text-lg text-gray-600">{t.subtitle}</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= step ? "bg-gold text-black" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step}
                </div>
                {step < 3 && <div className={`w-16 h-1 mx-2 ${currentStep > step ? "bg-gold" : "bg-gray-200"}`} />}
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
                    fill
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
                  {currentStep === 3 && <CreditCard className="h-6 w-6 text-gold mr-3" />}
                  {currentStep === 1 && t.step1}
                  {currentStep === 2 && t.step2}
                  {currentStep === 3 && t.step3}
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

                {/* Step 3: Summary and Payment */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <BookingSummary vehicle={vehicle} bookingData={bookingData} />
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6 border-t border-gray-200">
                  {currentStep > 1 && (
                    <Button variant="outline" onClick={handlePrevStep} className="border-gray-300">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Anterior
                    </Button>
                  )}

                  <div className="ml-auto">
                    {currentStep < 3 ? (
                      <Button
                        onClick={handleNextStep}
                        className="bg-black text-white hover:bg-gold hover:text-black transition-all duration-300"
                      >
                        Siguiente
                        <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleBooking}
                        disabled={loading}
                        className="bg-gold text-black hover:bg-black hover:text-white transition-all duration-300 font-semibold text-lg px-8 py-3"
                      >
                        <CreditCard className="h-5 w-5 mr-2" />
                        {loading ? t.loading : t.payNow}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
