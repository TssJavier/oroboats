"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CreditCard, MapPin, CheckCircle, Shield } from "lucide-react"
import { useApp } from "@/components/providers"

interface PaymentOption {
  type: "full_payment" | "partial_payment"
  label: string
  description: string
  onlineAmount: number
  remainingAmount: number
  totalAmount: number
  securityDeposit: number
  securityDepositLocation: "online" | "on_site"
}

interface PaymentTypeSelectorProps {
  totalPrice: number
  vehicle: any
  securityDeposit?: number
  onPaymentTypeChange: (option: PaymentOption) => void
  selectedType?: "full_payment" | "partial_payment"
}

// Sistema de traducciones
const translations = {
  es: {
    title: "Elige tu forma de pago",
    subtitle: "Selecciona la opción que más te convenga",
    fullPayment: {
      label: "Completo",
      recommended: "Recomendado",
      description: "Paga todo ahora",
      shortDesc: "Todo ahora",
      advantage: "Todo pagado",
      advantageText: "Solo llega y disfruta",
    },
    partialPayment: {
      label: "Pago parcial",
      description: "Resto en sitio",
      shortDesc: "Ahora + sitio",
    },
    common: {
      payNowOnline: "Pagas ahora:",
      payOnSite: "En el sitio:",
      payOnSite2: "Deberás pagar al llegar al sitio:",
      includes: "Incluye:",
      rental: "alquiler",
      deposit: "fianza",
      remember: "Recuerda:",
      bringPayment: "Trae €{amount} para pagar en el sitio",
      depositReturn: "Fianza €{amount} reembolsable",
      remainingRental: "resto alquiler",
      total: "Total",
    },
  },
  en: {
    title: "Choose your payment method",
    subtitle: "Select the option that suits you best",
    fullPayment: {
      label: "Full payment",
      recommended: "Recommended",
      description: "Pay everything now",
      shortDesc: "All now",
      advantage: "✅ All paid",
      advantageText: "Just arrive and enjoy",
    },
    partialPayment: {
      label: "Partial payment",
      description: "Rest on site",
      shortDesc: "Now + site",
    },
    common: {
      payNowOnline: "Pay now:",
      payOnSite: "On site:",
      payOnSite2: "On site you would pay:",
      includes: "Includes:",
      rental: "rental",
      deposit: "deposit",
      remember: "Remember:",
      bringPayment: "Bring €{amount} to pay on site",
      depositReturn: "Deposit €{amount} refundable",
      remainingRental: "remaining rental",
      total: "Total",
    },
  },
}

export function PaymentTypeSelector({
  totalPrice,
  vehicle,
  securityDeposit = 0,
  onPaymentTypeChange,
  selectedType = "full_payment",
}: PaymentTypeSelectorProps) {
  // Obtener el idioma actual del contexto de la aplicación
  const { language = "es" } = useApp() || {}
  const t = translations[language]

  // Detectar tipo de vehículo
  const isJetski =
    vehicle?.type === "jetski" ||
    vehicle?.category?.toLowerCase().includes("jetski") ||
    vehicle?.name?.toLowerCase().includes("jetski") ||
    vehicle?.name?.toLowerCase().includes("moto")

  const vehicleType = isJetski ? "jetski" : "boat"
  const partialPaymentAmount = vehicleType === "jetski" ? 50 : 100

  // Crear opciones de pago
  const paymentOptions: PaymentOption[] = [
    {
      type: "full_payment",
      label: t.fullPayment.label,
      description: t.fullPayment.description,
      onlineAmount: totalPrice,
      remainingAmount: 0,
      totalAmount: totalPrice,
      securityDeposit: securityDeposit,
      securityDepositLocation: "online",
    },
  ]

  // Solo añadir opción de pago parcial si el precio total es mayor que el monto parcial
  if (totalPrice > partialPaymentAmount) {
    paymentOptions.push({
      type: "partial_payment",
      label: t.partialPayment.label,
      description: t.partialPayment.description,
      onlineAmount: partialPaymentAmount,
      remainingAmount: totalPrice - partialPaymentAmount + securityDeposit,
      totalAmount: totalPrice,
      securityDeposit: securityDeposit,
      securityDepositLocation: "on_site",
    })
  }

  const handleOptionSelect = (option: PaymentOption) => {
    console.log("🔄 User clicked payment option:", option.type, "Amount:", option.onlineAmount)
    onPaymentTypeChange(option)
  }

  // Si solo hay una opción Y no hay fianza, no mostrar selector
  if (paymentOptions.length === 1 && securityDeposit === 0) {
    return null
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header más compacto */}
      <div className="text-center">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{t.title}</h3>
        <p className="text-sm sm:text-base text-gray-600">{t.subtitle}</p>
      </div>

      {/* Grid optimizado para móvil - SIEMPRE 2 columnas */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {paymentOptions.map((option) => (
          <Card
            key={option.type}
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
              selectedType === option.type
                ? option.type === "full_payment"
                  ? "border-green-500 border-2 bg-green-50 shadow-lg"
                  : "border-blue-500 border-2 bg-blue-50 shadow-lg"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => handleOptionSelect(option)}
          >
            <CardContent className="p-3 sm:p-4">
              {/* Header compacto */}
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                  {option.type === "full_payment" ? (
                    <div className="p-1 sm:p-1.5 bg-green-100 rounded-full flex-shrink-0">
                      <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                    </div>
                  ) : (
                    <div className="p-1 sm:p-1.5 bg-blue-100 rounded-full flex-shrink-0">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-xs sm:text-sm text-gray-900 leading-tight truncate">
                      {option.label}
                    </h4>
                    {option.type === "full_payment" && (
                      <p className="text-xs text-green-600 font-medium leading-tight">{t.fullPayment.recommended}</p>
                    )}
                  </div>
                </div>
                {selectedType === option.type && (
                  <div
                    className={`p-0.5 sm:p-1 rounded-full flex-shrink-0 ${
                      option.type === "full_payment" ? "bg-green-500" : "bg-blue-500"
                    }`}
                  >
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                )}
              </div>

              {/* Descripción compacta */}
              <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 leading-tight">{option.description}</p>

              {/* Monto principal - MÁS PROMINENTE */}
              <div
                className={`text-center p-2 sm:p-3 rounded-lg mb-2 ${
                  option.type === "full_payment" ? "bg-green-100" : "bg-blue-100"
                }`}
              >
                <p className="text-xs text-gray-600 mb-0.5">{t.common.payNowOnline}</p>
                <p
                  className={`text-xl sm:text-2xl font-bold leading-tight ${
                    option.type === "full_payment" ? "text-green-700" : "text-blue-700"
                  }`}
                >
                  €{option.onlineAmount}
                </p>

                {/* Info adicional compacta */}
                {option.type === "full_payment" && option.securityDeposit > 0 && (
                  <div className="text-xs text-gray-500 mt-1 leading-tight">
                    <div>
                      €{option.totalAmount} {t.common.rental}
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <Shield className="h-2 w-2" />€{option.securityDeposit} {t.common.deposit}
                    </div>
                  </div>
                )}
              </div>

              {/* Info de pago parcial */}
              {option.type === "partial_payment" && (
                <div className="space-y-1 sm:space-y-2">
                  {/* Desglose compacto */}
                  <div className="bg-orange-50 border border-orange-200 rounded p-2">
                    <div className="text-xs text-orange-800 space-y-0.5">
                      <div className="flex justify-between">
                        <span>{t.common.payOnSite2}</span>
                        <span className="font-semibold">€{option.remainingAmount}</span>
                      </div>
                      {option.securityDeposit > 0 && (
                        <div className="text-xs text-orange-600 flex items-center gap-1">
                          <Shield className="h-2 w-2" />
                          <span>{t.common.depositReturn.replace("{amount}", option.securityDeposit.toString())}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Ventaja para pago completo */}
              {option.type === "full_payment" && (
                <div className="bg-green-50 border border-green-200 rounded p-2 mt-2">
                  <p className="text-xs text-green-800 font-medium leading-tight">{t.fullPayment.advantage}</p>
                  <p className="text-xs text-green-700 leading-tight">{t.fullPayment.advantageText}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Información adicional compacta */}
      {paymentOptions.some((opt) => opt.type === "partial_payment") && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-center">
            <p className="text-xs sm:text-sm text-blue-800 font-medium mb-1">
              💡 {t.common.total}: €{totalPrice}
              {securityDeposit > 0 && ` + €${securityDeposit} ${t.common.deposit}`}
            </p>
            <p className="text-xs text-blue-600">Elige la opción que más te convenga para tu reserva</p>
          </div>
        </div>
      )}
    </div>
  )
}
