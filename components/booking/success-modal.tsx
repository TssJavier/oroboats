"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

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
    setTimeout(onClose, 300) // Esperar a que termine la animación
  }

  if (!isOpen) return null

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
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
          <div className="bg-gold p-6 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="absolute top-2 right-2 text-black hover:bg-black/10"
            >
              ✕
            </Button>
            <div className="mb-4 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-white flex items-center justify-center mb-4">
                <span className="text-2xl">✓</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-black mb-2">¡Reserva Confirmada! 🎉</h2>
            <p className="text-black/80">¡Prepárate para momentos increíbles!</p>
          </div>

          {/* Contenido */}
          <div className="p-6 space-y-6">
            {/* Detalles de la reserva */}
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-semibold text-gray-900">Tu aventura será:</p>
                <p className="text-blue-600 font-medium">{formatDate(bookingData.bookingDate)}</p>
                <p className="text-sm text-gray-600">
                  De {bookingData.startTime} a {bookingData.endTime}
                </p>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <p className="font-semibold text-gray-900">Revisa tu email:</p>
                <p className="text-green-600 font-medium break-all">{bookingData.customerEmail}</p>
                <p className="text-sm text-gray-600">Te hemos enviado tu factura y detalles</p>
              </div>

              {bookingData.vehicleName && (
                <div className="p-3 bg-gold/10 rounded-lg">
                  <p className="font-semibold text-gray-900">Tu embarcación:</p>
                  <p className="text-gold font-medium">{bookingData.vehicleName}</p>
                </div>
              )}
            </div>

            {/* Mensaje motivacional */}
            <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
              <h3 className="font-bold text-gray-900 mb-2">🌊 ¡La aventura te espera! 🌊</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Prepárate para vivir momentos únicos en el agua. No olvides traer protector solar, toalla y muchas ganas
                de diversión.
              </p>
            </div>

            {/* Información adicional */}
            <div className="text-center space-y-2">
              <p className="text-xs text-gray-500">
                Total pagado: <span className="font-semibold">€{bookingData.totalPrice}</span>
              </p>
              <p className="text-xs text-gray-500">Si tienes alguna duda, contáctanos</p>
            </div>

            {/* Botón de cierre */}
            <Button
              onClick={handleClose}
              className="w-full bg-gold text-black hover:bg-black hover:text-white font-semibold py-3"
            >
              ¡Perfecto! 🚤
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
