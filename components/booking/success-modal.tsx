"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Calendar, Clock, Mail, CreditCard, Shield, MapPin } from "lucide-react"
import { OroLoading } from "@/components/ui/oro-loading"

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
    // Campos para pago parcial
    paymentType?: "full_payment" | "partial_payment"
    amountPaid?: number
    amountPending?: number
  }
}

export function SuccessModal({ isOpen, onClose, bookingData }: SuccessModalProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [navigationLoading, setNavigationLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    }
  }, [isOpen])

  const handleClose = () => {
    setNavigationLoading(true)
    setIsVisible(false)

    // Mostrar loading antes de navegar
    setTimeout(() => {
      onClose()
      setNavigationLoading(false)
    }, 1500) // Esperar 1.5 segundos antes de navegar
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

  // Determinar si es pago parcial
  const isPartialPayment = bookingData.paymentType === "partial_payment"

  return (
    <>
      {/* Modal con z-index máximo y centrado perfecto */}
      <div
        className="fixed inset-0 z-[99999] flex items-center justify-center p-0"
        style={{
          touchAction: "none", // Prevenir scroll en dispositivos táctiles
        }}
      >
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black transition-opacity duration-300 ${
            isVisible ? "opacity-50" : "opacity-0"
          }`}
          onClick={handleClose}
        />

        {/* Modal con ancho optimizado y centrado */}
        <Card
          className={`relative w-[98%] max-w-[400px] transform transition-all duration-300 ${
            isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
          } max-h-[90vh] overflow-y-auto ml-[10px] mr-[90px] `}
        >
          {/* Para moverlo horizontalmente: cambia el valor de `mx-auto` por márgenes específicos como `ml-[valor]` o `mr-[valor]` */}
          <CardContent className="p-0">
            {/* Header */}
            <div className="bg-gold p-5 text-center rounded-t-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="absolute top-2 right-2 text-black hover:bg-black/10"
              >
                ✕
              </Button>
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-black mb-1">¡Reserva Confirmada!</h2>
              <p className="text-black/80 text-sm">Tu reserva ha sido procesada exitosamente</p>
            </div>

            {/* Contenido con padding optimizado */}
            <div className="p-5 space-y-4">
              {/* Booking details - Estructura más compacta */}
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0 mt-1" />
                  <div>
                    <span className="font-medium text-sm">Fecha:</span>
                    <div className="text-gray-800 text-sm">{formatDate(bookingData.bookingDate)}</div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-gray-500 flex-shrink-0 mt-1" />
                  <div>
                    <span className="font-medium text-sm">Horario:</span>
                    <div className="text-gray-800 text-sm">
                      {formatTime(bookingData.startTime)} - {formatTime(bookingData.endTime)}
                    </div>
                  </div>
                </div>

                {bookingData.vehicleName && (
                  <div className="flex items-start gap-2">
                    <div className="w-4 flex-shrink-0" /> {/* Espacio para alineación */}
                    <div>
                      <span className="font-medium text-sm">Vehículo:</span>
                      <div className="text-gray-800 text-sm">{bookingData.vehicleName}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <CreditCard className="h-4 w-4 text-gray-500 flex-shrink-0 mt-1" />
                  <div>
                    <span className="font-medium text-sm">Precio del alquiler:</span>
                    <div className="text-gray-800 font-semibold text-sm">€{bookingData.totalPrice}</div>
                  </div>
                </div>

                {/* Información de pago parcial */}
                {isPartialPayment && typeof bookingData.amountPaid === "number" && (
                  <div className="flex items-start gap-2">
                    <CreditCard className="h-4 w-4 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                      <span className="font-medium text-sm">Pagado ahora:</span>
                      <div className="text-green-600 font-semibold text-sm">€{bookingData.amountPaid}</div>
                    </div>
                  </div>
                )}

                {/* Monto pendiente */}
                {isPartialPayment && typeof bookingData.amountPending === "number" && bookingData.amountPending > 0 && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-orange-500 flex-shrink-0 mt-1" />
                    <div>
                      <span className="font-medium text-sm">A pagar en sitio:</span>
                      <div className="text-orange-600 font-semibold text-sm">€{bookingData.amountPending}</div>
                    </div>
                  </div>
                )}

                {/* Security deposit info */}
                {bookingData.securityDeposit && bookingData.securityDeposit > 0 && (
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-blue-500 flex-shrink-0 mt-1" />
                    <div>
                      <span className="font-medium text-sm">Fianza (reembolsable):</span>
                      <div className="text-blue-600 font-semibold text-sm">€{bookingData.securityDeposit}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-gray-500 flex-shrink-0 mt-1" />
                  <div>
                    <span className="font-medium text-sm">Confirmación enviada a:</span>
                    <div className="text-gray-800 break-words text-sm">{bookingData.customerEmail}</div>
                  </div>
                </div>
              </div>

              {/* Información de pago parcial */}
              {isPartialPayment && typeof bookingData.amountPending === "number" && bookingData.amountPending > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium text-orange-800">Pago pendiente en sitio</p>
                      <p className="text-orange-700">
                        Recuerda que deberás pagar €{bookingData.amountPending} al recoger el vehículo. Puedes pagar con
                        tarjeta o efectivo.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Security deposit information */}
              {bookingData.securityDeposit && bookingData.securityDeposit > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium text-blue-800">Información sobre la fianza</p>
                      <p className="text-blue-700">
                        La fianza de €{bookingData.securityDeposit} se devolverá al finalizar la reserva, siempre que no
                        haya daños por uso irresponsable.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional information */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-700">
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

      {/* Indicador de carga durante la navegación */}
      {navigationLoading && <OroLoading />}
    </>
  )
}
