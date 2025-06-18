"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Calendar, Clock, Mail, CreditCard, Shield, MapPin, X } from "lucide-react"
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

    setTimeout(() => {
      onClose()
      setNavigationLoading(false)
    }, 1000)
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
    return time.substring(0, 5)
  }

  const isPartialPayment = bookingData.paymentType === "partial_payment"

  // ✅ ARREGLO: Calcular el precio total correctamente
  const displayTotalPrice = bookingData.totalPrice || 0
  const displayAmountPaid = isPartialPayment ? bookingData.amountPaid || 0 : displayTotalPrice
  const displayAmountPending = isPartialPayment ? bookingData.amountPending || 0 : 0

  console.log("🔍 Success Modal Debug:", {
    totalPrice: bookingData.totalPrice,
    amountPaid: bookingData.amountPaid,
    amountPending: bookingData.amountPending,
    paymentType: bookingData.paymentType,
    isPartialPayment,
    displayTotalPrice,
    displayAmountPaid,
    displayAmountPending,
  })

  return (
    <>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div
          className={`absolute inset-0 bg-black transition-opacity duration-300 ${
            isVisible ? "opacity-50" : "opacity-0"
          }`}
          onClick={handleClose}
        />

        <Card
          className={`relative w-full max-w-sm transform transition-all duration-300 ${
            isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
          } max-h-[85vh] overflow-y-auto`}
        >
          <CardContent className="p-0">
            {/* Header compacto con gradiente */}
            <div className="bg-gradient-to-r from-gold via-yellow-400 to-gold p-4 text-center rounded-t-lg relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="absolute top-2 right-2 text-black hover:bg-black/10 h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-black mb-1">¡Reserva Confirmada!</h2>
              <p className="text-black/80 text-xs">Procesada exitosamente</p>
            </div>

            {/* Contenido en grid compacto */}
            <div className="p-4 space-y-3">
              {/* Info principal en grid 2x2 */}
              <div className="grid grid-cols-2 gap-3">
                {/* Fecha */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center mb-1">
                    <Calendar className="h-3 w-3 text-blue-600 mr-1" />
                    <span className="text-xs font-medium text-blue-800">Fecha</span>
                  </div>
                  <p className="text-xs text-blue-700 font-semibold">{formatDate(bookingData.bookingDate)}</p>
                </div>

                {/* Horario */}
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center mb-1">
                    <Clock className="h-3 w-3 text-green-600 mr-1" />
                    <span className="text-xs font-medium text-green-800">Horario</span>
                  </div>
                  <p className="text-xs text-green-700 font-semibold">
                    {formatTime(bookingData.startTime)} - {formatTime(bookingData.endTime)}
                  </p>
                </div>

                {/* Precio pagado */}
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="flex items-center mb-1">
                    <CreditCard className="h-3 w-3 text-purple-600 mr-1" />
                    <span className="text-xs font-medium text-purple-800">
                      {isPartialPayment ? "Pagado ahora" : "Total pagado"}
                    </span>
                  </div>
                  <p className="text-xs text-purple-700 font-bold">€{displayAmountPaid}</p>
                </div>

                {/* Pendiente o Fianza */}
                {isPartialPayment && displayAmountPending > 0 ? (
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="flex items-center mb-1">
                      <MapPin className="h-3 w-3 text-orange-600 mr-1" />
                      <span className="text-xs font-medium text-orange-800">Pendiente</span>
                    </div>
                    <p className="text-xs text-orange-700 font-bold">€{displayAmountPending}</p>
                  </div>
                ) : bookingData.securityDeposit && bookingData.securityDeposit > 0 ? (
                  <div className="bg-cyan-50 p-3 rounded-lg">
                    <div className="flex items-center mb-1">
                      <Shield className="h-3 w-3 text-cyan-600 mr-1" />
                      <span className="text-xs font-medium text-cyan-800">Fianza</span>
                    </div>
                    <p className="text-xs text-cyan-700 font-bold">€{bookingData.securityDeposit}</p>
                  </div>
                ) : null}
              </div>

              {/* ✅ TOTAL DEL ALQUILER - SIEMPRE VISIBLE */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CreditCard className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm font-bold text-green-800">Total del alquiler</span>
                  </div>
                  <p className="text-lg font-bold text-green-700">€{displayTotalPrice}</p>
                </div>
                {isPartialPayment && (
                  <div className="mt-2 text-xs text-green-600">
                    Pagado: €{displayAmountPaid} | Pendiente: €{displayAmountPending}
                  </div>
                )}
              </div>

              {/* Vehículo */}
              {bookingData.vehicleName && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-gray-600 mb-1">Vehículo:</p>
                  <p className="text-sm font-bold text-gray-800">{bookingData.vehicleName}</p>
                </div>
              )}

              {/* Email */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center mb-1">
                  <Mail className="h-3 w-3 text-gray-600 mr-1" />
                  <span className="text-xs font-medium text-gray-600">Confirmación enviada a:</span>
                </div>
                <p className="text-xs text-gray-800 break-all">{bookingData.customerEmail}</p>
              </div>

              {/* Información adicional para pago parcial */}
              {isPartialPayment && displayAmountPending > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-orange-800 mb-1">💰 Pago pendiente en sitio</p>
                  <p className="text-xs text-orange-700">
                    Recuerda traer €{displayAmountPending} (efectivo o tarjeta) al recoger el vehículo.
                  </p>
                </div>
              )}

              {/* Información de fianza */}
              {bookingData.securityDeposit && bookingData.securityDeposit > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-blue-800 mb-1">🛡️ Sobre la fianza</p>
                  <p className="text-xs text-blue-700">
                    Se devolverá €{bookingData.securityDeposit} al finalizar si no hay daños.
                  </p>
                </div>
              )}

              {/* Nota importante */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-700">
                  <span className="font-medium">Importante:</span> Revisa tu email para todos los detalles.
                </p>
              </div>

              {/* Botón de cierre */}
              <Button
                onClick={handleClose}
                className="w-full bg-gradient-to-r from-gold to-yellow-500 text-black hover:from-black hover:to-gray-800 hover:text-white font-medium py-2 h-10"
              >
                Entendido
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {navigationLoading && <OroLoading />}
    </>
  )
}
