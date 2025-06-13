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
      label: "Pago completo",
      recommended: "Recomendado",
      description: "Paga todo ahora y olvídate de problemas",
      advantage: "Ventaja:",
      advantageText: "Todo pagado. Solo llega y disfruta.",
    },
    partialPayment: {
      label: "Paga {amount}€ ahora",
      description: "El resto (€{amount}) lo pagas en el sitio",
    },
    common: {
      payNowOnline: "Pagas ahora online:",
      includes: "Incluye:",
      rental: "alquiler",
      deposit: "fianza reembolsable",
      remember: "Recuerda:",
      bringPayment: "Trae €{amount} en efectivo o tarjeta para pagar en el sitio",
      depositReturn: "Al finalizar, se te devolverán €{amount} de fianza",
      remainingRental: "resto del alquiler",
    },
  },
  en: {
    title: "Choose your payment method",
    subtitle: "Select the option that suits you best",
    fullPayment: {
      label: "Full payment",
      recommended: "Recommended",
      description: "Pay everything now and forget about problems",
      advantage: "Advantage:",
      advantageText: "Everything paid. Just arrive and enjoy.",
    },
    partialPayment: {
      label: "Pay {amount}€ now",
      description: "The rest (€{amount}) you pay on site",
    },
    common: {
      payNowOnline: "You pay now online:",
      includes: "Includes:",
      rental: "rental",
      deposit: "refundable deposit",
      remember: "Remember:",
      bringPayment: "Bring €{amount} in cash or card to pay on site",
      depositReturn: "At the end, €{amount} of deposit will be returned to you",
      remainingRental: "remaining rental",
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
      onlineAmount: totalPrice + securityDeposit,
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
      label: t.partialPayment.label.replace("{amount}", partialPaymentAmount.toString()),
      description: t.partialPayment.description.replace(
        "{amount}",
        (totalPrice - partialPaymentAmount + securityDeposit).toString(),
      ),
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

  // Si solo hay una opción, no mostrar selector
  if (paymentOptions.length === 1) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{t.title}</h3>
        <p className="text-gray-600">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {option.type === "full_payment" ? (
                    <div className="p-2 bg-green-100 rounded-full">
                      <CreditCard className="h-6 w-6 text-green-600" />
                    </div>
                  ) : (
                    <div className="p-2 bg-blue-100 rounded-full">
                      <MapPin className="h-6 w-6 text-blue-600" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-lg text-gray-900">{option.label}</h4>
                    {option.type === "full_payment" && (
                      <p className="text-sm text-green-600 font-medium">{t.fullPayment.recommended}</p>
                    )}
                  </div>
                </div>
                {selectedType === option.type && (
                  <div
                    className={`p-1 rounded-full ${option.type === "full_payment" ? "bg-green-500" : "bg-blue-500"}`}
                  >
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>

              {/* Descripción principal */}
              <p className="text-gray-700 mb-4 font-medium">{option.description}</p>

              {/* Desglose del precio pendiente para pago parcial */}
              {option.type === "partial_payment" && option.securityDeposit > 0 && (
                <div className="flex flex-col mb-3 text-xs text-gray-500">
                  <span>
                    {t.common.includes} €{option.totalAmount - partialPaymentAmount} {t.common.remainingRental}
                  </span>
                  <span className="flex items-center">
                    <Shield className="h-3 w-3 mr-0.5 inline" />€{option.securityDeposit} {t.common.deposit}
                  </span>
                </div>
              )}

              {/* Monto principal */}
              <div
                className={`text-center p-4 rounded-lg mb-2 ${
                  option.type === "full_payment" ? "bg-green-100" : "bg-blue-100"
                }`}
              >
                <p className="text-sm text-gray-600 mb-1">{t.common.payNowOnline}</p>
                <p
                  className={`text-3xl font-bold ${
                    option.type === "full_payment" ? "text-green-700" : "text-blue-700"
                  }`}
                >
                  €{option.onlineAmount}
                </p>

                {/* Desglose del precio en texto pequeño para pago completo */}
                {option.type === "full_payment" && option.securityDeposit > 0 && (
                  <div className="flex items-center justify-center gap-1 mt-1 text-xs text-gray-500">
                    <span>
                      {t.common.includes} €{option.totalAmount} {t.common.rental}
                    </span>
                    <span>+</span>
                    <span className="flex items-center">
                      <Shield className="h-3 w-3 mr-0.5 inline" />€{option.securityDeposit} {t.common.deposit}
                    </span>
                  </div>
                )}
              </div>

              {/* Recordatorio para pago parcial */}
              {option.type === "partial_payment" && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-3">
                  <p className="text-sm text-orange-800 font-medium mb-1">{t.common.remember}</p>
                  <p className="text-sm text-orange-700">
                    {t.common.bringPayment.replace("{amount}", option.remainingAmount.toString())}
                  </p>
                  {option.securityDeposit > 0 && (
                    <div className="mt-2 pt-2 border-t border-orange-200">
                      <p className="text-sm text-orange-700 flex items-center">
                        <Shield className="h-4 w-4 mr-1 text-orange-600" />
                        {t.common.depositReturn.replace("{amount}", option.securityDeposit.toString())}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Ventaja para pago completo */}
              {option.type === "full_payment" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                  <p className="text-sm text-green-800 font-medium mb-1">✅ {t.fullPayment.advantage}</p>
                  <p className="text-sm text-green-700">{t.fullPayment.advantageText}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
