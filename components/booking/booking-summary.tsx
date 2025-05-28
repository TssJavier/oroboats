"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, Phone, Mail, Euro, Ship, Zap } from "lucide-react"
import { useApp } from "@/components/providers"
import type { Vehicle } from "@/lib/db/schema"

interface BookingSummaryProps {
  vehicle: Vehicle
  bookingData: {
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
}

const translations = {
  es: {
    summary: "Resumen de la Reserva",
    vehicle: "Vehículo",
    customer: "Cliente",
    datetime: "Fecha y Hora",
    pricing: "Precio",
    notes: "Notas",
    total: "Total a Pagar",
    includes: "Incluye",
    capacity: "Capacidad",
    duration: "Duración",
    date: "Fecha",
    time: "Horario",
    name: "Nombre",
    email: "Email",
    phone: "Teléfono",
    noNotes: "Sin notas adicionales",
  },
  en: {
    summary: "Booking Summary",
    vehicle: "Vehicle",
    customer: "Customer",
    datetime: "Date & Time",
    pricing: "Pricing",
    notes: "Notes",
    total: "Total to Pay",
    includes: "Includes",
    capacity: "Capacity",
    duration: "Duration",
    date: "Date",
    time: "Time",
    name: "Name",
    email: "Email",
    phone: "Phone",
    noNotes: "No additional notes",
  },
}

export function BookingSummary({ vehicle, bookingData }: BookingSummaryProps) {
  const { language } = useApp()
  const t = translations[language]

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getDurationLabel = () => {
    if (!Array.isArray(vehicle.pricing)) return bookingData.duration

    const pricingOption = vehicle.pricing.find((p) => p.duration === bookingData.duration)
    return pricingOption?.label || bookingData.duration
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-black">{t.summary}</h3>

      {/* Vehicle Information */}
      <Card className="bg-white border border-gray-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-black flex items-center">
            {vehicle.type === "jetski" ? (
              <Zap className="h-5 w-5 text-gold mr-2" />
            ) : (
              <Ship className="h-5 w-5 text-gold mr-2" />
            )}
            {t.vehicle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-black text-lg">{vehicle.name}</h4>
            <p className="text-gray-600">{vehicle.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">{t.capacity}:</span>
              <div className="font-semibold text-black">{vehicle.capacity} personas</div>
            </div>
            <div>
              <span className="text-gray-500">{t.duration}:</span>
              <div className="font-semibold text-black">{getDurationLabel()}</div>
            </div>
          </div>

          <div>
            <span className="text-gray-500 text-sm">{t.includes}:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {Array.isArray(vehicle.includes) &&
                vehicle.includes.map((item, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {item}
                  </Badge>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date & Time */}
      <Card className="bg-white border border-gray-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-black flex items-center">
            <Calendar className="h-5 w-5 text-gold mr-2" />
            {t.datetime}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-gray-500 text-sm">{t.date}:</span>
              <div className="font-semibold text-black">{formatDate(bookingData.bookingDate)}</div>
            </div>
            <div>
              <span className="text-gray-500 text-sm">{t.time}:</span>
              <div className="font-semibold text-black flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {bookingData.startTime} - {bookingData.endTime}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Information */}
      <Card className="bg-white border border-gray-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-black flex items-center">
            <User className="h-5 w-5 text-gold mr-2" />
            {t.customer}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">{t.name}:</span>
              <div className="font-semibold text-black">{bookingData.customerName}</div>
            </div>
            <div>
              <span className="text-gray-500">{t.phone}:</span>
              <div className="font-semibold text-black flex items-center">
                <Phone className="h-4 w-4 mr-1" />
                {bookingData.customerPhone}
              </div>
            </div>
          </div>
          <div>
            <span className="text-gray-500 text-sm">{t.email}:</span>
            <div className="font-semibold text-black flex items-center">
              <Mail className="h-4 w-4 mr-1" />
              {bookingData.customerEmail}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {bookingData.notes && (
        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-black">{t.notes}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{bookingData.notes || t.noNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Total Price */}
      <Card className="bg-gold/10 border border-gold/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Euro className="h-6 w-6 text-gold mr-2" />
              <span className="text-xl font-semibold text-black">{t.total}</span>
            </div>
            <div className="text-3xl font-bold text-gold">€{bookingData.totalPrice}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
