"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Calendar, Clock, Mail, CreditCard, Shield } from "lucide-react"

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  bookingData: {
    customerEmail: string
    bookingDate: string
    startTime: string
    endTime: string
    vehicleName?: string
    totalPrice: number
    securityDeposit?: number
  }
}

export function SuccessModal({ isOpen, onClose, bookingData }: SuccessModalProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    }
  }, [isOpen])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300) // Wait for animation
  }

  if (!isOpen) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (time: string) => {
    return time.substring(0, 5) // Remove seconds if present
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isVisible ? "opacity-50" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <Card
        className={`relative w-full max-w-md mx-auto transform transition-all duration-300 ${
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <CardContent className="p-0">
          {/* Header */}
          <div className="bg-gold p-6 text-center rounded-t-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="absolute top-2 right-2 text-black hover:bg-black/10"
            >
              ✕
            </Button>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-black mb-2">¡Reserva Confirmada!</h2>
            <p className="text-black/80">Tu reserva ha sido procesada exitosamente</p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Booking details */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Fecha:</span>
                <span>{formatDate(bookingData.bookingDate)}</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Horario:</span>
                <span>
                  {formatTime(bookingData.startTime)} - {formatTime(bookingData.endTime)}
                </span>
              </div>

              {bookingData.vehicleName && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-medium">Vehículo:</span>
                  <span>{bookingData.vehicleName}</span>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm">
                <CreditCard className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Precio del alquiler:</span>
                <span className="font-semibold">€{bookingData.totalPrice}</span>
              </div>

              {/* Security deposit info */}
              {bookingData.securityDeposit && bookingData.securityDeposit > 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Fianza (reembolsable):</span>
                  <span className="font-semibold text-blue-600">€{bookingData.securityDeposit}</span>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Confirmación enviada a:</span>
                <span className="break-all">{bookingData.customerEmail}</span>
              </div>
            </div>

            {/* Security deposit information */}
            {bookingData.securityDeposit && bookingData.securityDeposit > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800 mb-1">Información sobre la fianza</p>
                    <p className="text-blue-700">
                      La fianza de €{bookingData.securityDeposit} se devolverá al finalizar la reserva, siempre que no haya daños por uso irresponsable.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Additional information */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Importante:</span> Revisa tu email para obtener todos los detalles de tu
                reserva. Si tienes alguna pregunta, no dudes en contactarnos.
              </p>
            </div>

            {/* Close button */}
            <Button onClick={handleClose} className="w-full bg-gold text-black hover:bg-black hover:text-white">
              Entendido
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
