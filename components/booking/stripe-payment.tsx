"use client"

import React from "react"
import type { ReactElement } from "react"
import { useState, useRef } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SuccessModal } from "./success-modal"
import { DiscountInput } from "./discount-input"
import { PaymentTypeSelector } from "./payment-type-selector"
import { OroLoading } from "@/components/ui/oro-loading"

// 🔍 DETECTAR ENTORNO Y CONFIGURAR STRIPE
const isProduction = process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production"
const stripePublishableKey = isProduction
  ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE
  : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST

console.log("🌍 Stripe client environment:", {
  isProduction,
  hasKey: !!stripePublishableKey,
  keyPrefix: stripePublishableKey?.substring(0, 7),
})

const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null

interface PaymentOption {
  type: "full_payment" | "partial_payment"
  label: string
  description: string
  onlineAmount: number
  remainingAmount: number
  totalAmount: number
  securityDepositLocation: "online" | "on_site"
}

interface StripePaymentProps {
  amount: number
  securityDeposit?: number
  bookingData: any
  onSuccess: () => void
  onError: (error: string) => void
}

// Componente interno que maneja el pago con Elements
function PaymentFormWithElements({
  amount,
  securityDeposit = 0,
  bookingData,
  onSuccess,
  onError,
  clientSecret,
  environment,
  onRetry,
  paymentOption,
}: StripePaymentProps & {
  clientSecret: string
  environment: string
  onRetry: () => void
  paymentOption: PaymentOption
}): ReactElement {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    // Verificaciones antes de proceder
    if (!stripe) {
      onError("Stripe no está cargado")
      return
    }

    if (!elements) {
      onError("Elementos de pago no están cargados")
      return
    }

    if (!clientSecret) {
      onError("No se pudo preparar el pago. Intenta de nuevo.")
      return
    }

    setLoading(true)
    setPaymentProcessing(true)

    try {
      console.log("🔄 Confirming payment with clientSecret:", clientSecret.substring(0, 20) + "...")
      console.log("🔄 Payment option:", paymentOption)

      // Confirmar pago con Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking-success`,
        },
        redirect: "if_required",
      })

      if (error) {
        console.error("❌ Payment failed:", error)
        onError(error.message || "Error en el pago")
        setPaymentProcessing(false)
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        console.log("✅ Payment succeeded:", paymentIntent.id)

        // Calcular montos correctamente
        const amountPaidOnline =
          paymentOption.type === "partial_payment"
            ? paymentOption.onlineAmount // Solo 50€ o 100€
            : amount // Precio completo del alquiler

        const amountPendingOnSite = paymentOption.remainingAmount // Resto + fianza si es parcial

        // MOSTRAR CLARAMENTE LOS DATOS QUE SE ENVÍAN
        console.log("💰 Sending payment confirmation with:", {
          paymentIntentId: paymentIntent.id,
          paymentType: paymentOption.type,
          amountPaid: amountPaidOnline,
          amountPending: amountPendingOnSite,
        })

        // Confirmar reserva en backend con información de pago parcial
        const confirmResponse = await fetch("/api/confirm-booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            paymentType: paymentOption.type,
            amountPaid: amountPaidOnline,
            amountPending: amountPendingOnSite,
          }),
        })

        if (confirmResponse.ok) {
          // Mostrar modal de éxito
          setShowSuccessModal(true)
          setPaymentProcessing(false)
        } else {
          const errorData = await confirmResponse.json()
          onError(errorData.error || "Error confirmando la reserva")
          setPaymentProcessing(false)
        }
      }
    } catch (err) {
      console.error("❌ Payment error:", err)
      onError("Error procesando el pago")
      setPaymentProcessing(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* ✅ CORREGIDO: Ajustado el Card para mejor visualización en móviles */}
      <Card className="w-full mx-auto">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle>Pago Seguro</CardTitle>
          <p className="text-sm text-gray-600">Acepta tarjetas, PayPal y más</p>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ✅ CORREGIDO: Contenedor con altura mínima para evitar saltos */}
            <div className="p-3 sm:p-4 border border-gray-200 rounded-lg bg-gray-50 min-h-[280px]">
              <PaymentElement
                options={{
                  layout: {
                    type: "tabs",
                    defaultCollapsed: false,
                    spacedAccordionItems: false,
                  },
                  wallets: {
                    applePay: "auto",
                    googlePay: "auto",
                  },
                }}
              />
            </div>

            <div className="flex items-center justify-center text-sm text-gray-500">Pago seguro con cifrado SSL</div>

            <Button
              type="submit"
              disabled={!stripe || loading}
              className="w-full bg-gold text-black hover:bg-black hover:text-white transition-all duration-300 font-medium text-lg py-3"
            >
              {loading ? "Procesando..." : `Pagar €${paymentOption.onlineAmount}`}
            </Button>

            {paymentOption.type === "partial_payment" && (
              <div className="text-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-700 font-medium">
                  ⚠️ Recuerda: Deberás pagar €{paymentOption.remainingAmount} al llegar al sitio
                </p>
                <p className="text-xs text-orange-600 mt-1">(Incluye resto del alquiler + fianza)</p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* ✅ CORREGIDO: Asegurar que el modal de éxito tenga prioridad sobre Stripe */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false)
          onSuccess()
        }}
        bookingData={{
          customerEmail: bookingData.customerEmail,
          bookingDate: bookingData.bookingDate,
          startTime: bookingData.startTime,
          endTime: bookingData.endTime,
          vehicleName: bookingData.vehicleName,
          totalPrice: amount,
          securityDeposit: securityDeposit,
          paymentType: paymentOption.type,
          amountPaid: paymentOption.type === "partial_payment" ? paymentOption.onlineAmount : amount,
          amountPending: paymentOption.remainingAmount,
        }}
      />

      {/* ✅ CORREGIDO: Asegurar que el indicador de carga tenga prioridad sobre todo */}
      {paymentProcessing && <OroLoading />}
    </>
  )
}

// Componente principal que maneja la lógica de descuentos y payment intent
function PaymentForm({
  amount,
  securityDeposit = 0,
  bookingData,
  onSuccess,
  onError,
}: StripePaymentProps): ReactElement {
  const [loading, setLoading] = useState(false)
  const [clientSecret, setClientSecret] = useState<string>("")
  const [finalAmount, setFinalAmount] = useState(amount)
  const [discountData, setDiscountData] = useState<any>(null)
  const [error, setError] = useState<string>("")
  const [environment, setEnvironment] = useState<string>("unknown")
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)

  // Estado simple para el tipo de pago seleccionado
  const [selectedPaymentType, setSelectedPaymentType] = useState<"full_payment" | "partial_payment">("full_payment")

  // Detectar tipo de vehículo correctamente
  const isJetski =
    bookingData.vehicleType === "jetski" ||
    bookingData.vehicleCategory?.toLowerCase().includes("jetski") ||
    bookingData.vehicleName?.toLowerCase().includes("jetski") ||
    bookingData.vehicleName?.toLowerCase().includes("moto")

  const vehicleType = isJetski ? "jetski" : "boat"
  const partialPaymentAmount = vehicleType === "jetski" ? 50 : 100

  // Calcular la opción de pago actual basada en el tipo seleccionado
  const currentPaymentOption: PaymentOption = React.useMemo(() => {
    if (selectedPaymentType === "full_payment") {
      return {
        type: "full_payment",
        label: "Pago completo",
        description: "Paga todo ahora y olvídate de problemas",
        onlineAmount: finalAmount + securityDeposit,
        remainingAmount: 0,
        totalAmount: finalAmount,
        securityDepositLocation: "online",
      }
    } else {
      return {
        type: "partial_payment",
        label: `Pago parcial (${partialPaymentAmount}€ ahora)`,
        description: "No olvides traer efectivo exacto o tarjeta de crédito",
        onlineAmount: partialPaymentAmount,
        remainingAmount: finalAmount - partialPaymentAmount + securityDeposit,
        totalAmount: finalAmount,
        securityDepositLocation: "on_site",
      }
    }
  }, [selectedPaymentType, finalAmount, securityDeposit, partialPaymentAmount])

  // Usar ref para evitar re-renders innecesarios
  const lastCreatedAmountRef = useRef<number>(0)
  const isCreatingPaymentIntentRef = useRef<boolean>(false)

  // Verificar si es reserva gratuita (100% descuento)
  const isFreeBooking = finalAmount <= 0

  console.log("🔍 Payment form state:", {
    vehicleName: bookingData.vehicleName,
    detectedType: vehicleType,
    partialAmount: partialPaymentAmount,
    selectedType: selectedPaymentType,
    currentAmount: currentPaymentOption.onlineAmount,
    finalAmount,
    isFreeBooking,
    isCreating: isCreatingPaymentIntentRef.current,
  })

  // Solo crear payment intent cuando realmente es necesario
  React.useEffect(() => {
    if (
      !isFreeBooking &&
      currentPaymentOption.onlineAmount !== lastCreatedAmountRef.current &&
      !isCreatingPaymentIntentRef.current
    ) {
      console.log("💳 Creating payment intent for amount:", currentPaymentOption.onlineAmount)
      lastCreatedAmountRef.current = currentPaymentOption.onlineAmount
      createPaymentIntent(currentPaymentOption.onlineAmount)
    }
  }, [currentPaymentOption.onlineAmount, isFreeBooking])

  const createPaymentIntent = async (onlineAmount: number) => {
    if (isCreatingPaymentIntentRef.current) {
      console.log("⏳ Payment intent creation already in progress, skipping...")
      return
    }

    try {
      isCreatingPaymentIntentRef.current = true
      setError("")
      setClientSecret("")
      setLoading(true)

      console.log("🔄 Creating payment intent for amount:", onlineAmount)
      console.log("🔄 Payment type:", selectedPaymentType)

      // PREPARAR DATOS PARA EL PAYMENT INTENT
      const paymentData = {
        amount: onlineAmount,
        paymentType: currentPaymentOption.type,
        amountPaid: currentPaymentOption.type === "partial_payment" ? currentPaymentOption.onlineAmount : finalAmount,
        amountPending: currentPaymentOption.remainingAmount,
        bookingData: {
          ...bookingData,
          finalAmount: finalAmount,
          securityDeposit: securityDeposit,
          discountCode: discountData?.code,
          discountAmount: discountData?.discountAmount,
          originalPrice: discountData ? amount : undefined,
          // CRÍTICO: Incluir información de pago parcial en bookingData
          paymentType: currentPaymentOption.type,
          amountPaid: currentPaymentOption.type === "partial_payment" ? currentPaymentOption.onlineAmount : finalAmount,
          amountPending: currentPaymentOption.remainingAmount,
        },
      }

      console.log("💳 Payment data:", paymentData)

      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("❌ API Error:", errorData)
        setEnvironment(errorData.environment || "unknown")
        throw new Error(errorData.details || errorData.error || "Error creating payment intent")
      }

      const { clientSecret: cs, paymentIntentId: piId, environment: env } = await response.json()

      if (!cs) {
        throw new Error("No client secret received from server")
      }

      console.log("✅ Payment intent created successfully:", { piId, hasClientSecret: !!cs })

      setClientSecret(cs)
      setEnvironment(env)
    } catch (error) {
      console.error("❌ Error creating payment intent:", error)
      const errorMessage = error instanceof Error ? error.message : "Error preparando el pago"
      setError(errorMessage)
      onError(errorMessage)
    } finally {
      setLoading(false)
      isCreatingPaymentIntentRef.current = false
    }
  }

  const handleDiscountApplied = (discount: any) => {
    setDiscountData(discount)
    const newAmount = discount ? discount.finalAmount : amount
    setFinalAmount(newAmount)
  }

  // Función simplificada para cambio de tipo de pago
  const handlePaymentTypeChange = (option: PaymentOption) => {
    console.log("🔄 Payment type changed to:", option.type, "Amount:", option.onlineAmount)
    setSelectedPaymentType(option.type)
  }

  // Manejar reserva gratuita (sin Stripe)
  const handleFreeBooking = async () => {
    setLoading(true)
    setPaymentProcessing(true)

    try {
      console.log("🎁 Processing free booking...")

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...bookingData,
          finalAmount: 0,
          securityDeposit: securityDeposit,
          discountCode: discountData?.code,
          discountAmount: discountData?.discountAmount,
          originalPrice: amount,
          paymentStatus: "free_booking",
          paymentType: "full_payment",
          amountPaid: 0,
          amountPending: 0,
        }),
      })

      if (response.ok) {
        console.log("✅ Free booking created successfully")
        setShowSuccessModal(true)
      } else {
        const errorData = await response.json()
        onError(errorData.error || "Error creando reserva gratuita")
      }
    } catch (error) {
      console.error("❌ Error creating free booking:", error)
      onError("Error procesando reserva gratuita")
    } finally {
      setLoading(false)
      setPaymentProcessing(false)
    }
  }

  // Mostrar error si no se puede crear el payment intent
  if (error && !isFreeBooking) {
    return (
      <div className="space-y-6">
        <DiscountInput totalAmount={amount} onDiscountApplied={handleDiscountApplied} />
        {/* ✅ CORREGIDO: Ajustado el Card para mejor visualización en móviles */}
        <Card className="w-full mx-auto">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="text-red-600 mb-4">
              <p className="font-semibold">Error de configuración</p>
              <p className="text-sm">{error}</p>
              {environment && <p className="text-xs mt-2 text-gray-500">Entorno: {environment}</p>}
            </div>
            <Button onClick={() => createPaymentIntent(currentPaymentOption.onlineAmount)} variant="outline">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Mostrar loading mientras se crea el payment intent
  if (loading || (!clientSecret && !isFreeBooking)) {
    return (
      <div className="space-y-6">
        <DiscountInput totalAmount={amount} onDiscountApplied={handleDiscountApplied} />
        {/* ✅ CORREGIDO: Ajustado el Card para mejor visualización en móviles */}
        <Card className="w-full mx-auto">
          <CardContent className="p-4 sm:p-6 text-center">
            <p className="mb-2">Preparando pago...</p>
            {environment && <p className="text-xs mt-2 text-gray-500">Entorno: {environment}</p>}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      {/* ✅ CORREGIDO: Eliminado padding horizontal para evitar desbordamiento */}
      <div className="space-y-6">
        {/* Indicador de entorno */}
        {environment === "test" && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-3">
              <div className="text-yellow-800">
                <span className="text-sm font-medium">Modo de prueba - No se cobrará dinero real</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Código de descuento */}
        <DiscountInput totalAmount={amount} onDiscountApplied={handleDiscountApplied} />

        {/* Selector de tipo de pago */}
        {!isFreeBooking && (
          <PaymentTypeSelector
            totalPrice={finalAmount}
            vehicle={{
              name: bookingData.vehicleName,
              type: bookingData.vehicleType,
              category: bookingData.vehicleCategory,
            }}
            securityDeposit={securityDeposit}
            selectedType={selectedPaymentType}
            onPaymentTypeChange={handlePaymentTypeChange}
          />
        )}

        {/* Formulario de pago o confirmación gratuita */}
        {isFreeBooking ? (
          <Card className="w-full mx-auto">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle>Reserva Gratuita</CardTitle>
              <p className="text-sm text-gray-600">¡Tu reserva es completamente gratuita!</p>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="p-4 border border-green-200 rounded-lg bg-green-50 text-center mb-6">
                <p className="text-green-800 font-medium">¡Reserva 100% gratuita!</p>
                <p className="text-green-600 text-sm">No se requiere pago</p>
              </div>
              <Button
                onClick={handleFreeBooking}
                disabled={loading}
                className="w-full bg-gold text-black hover:bg-black hover:text-white transition-all duration-300 font-medium text-lg py-3"
              >
                {loading ? "Procesando..." : "Confirmar Reserva Gratuita"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          // ✅ CORREGIDO: Ajustado Elements para mejor visualización en móviles
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe" as const,
                variables: {
                  colorPrimary: "#D4AF37",
                  // ✅ CORREGIDO: Ajustar espaciado para móviles
                  spacingUnit: "4px",
                  borderRadius: "8px",
                },
                rules: {
                  ".Tab": {
                    padding: "8px",
                  },
                  ".Input": {
                    padding: "10px",
                  },
                },
              },
              // ✅ CORREGIDO: Asegurar que Stripe se muestre correctamente en móviles
              loader: "auto",
            }}
          >
            <PaymentFormWithElements
              amount={finalAmount}
              securityDeposit={securityDeposit}
              bookingData={bookingData}
              onSuccess={onSuccess}
              onError={onError}
              clientSecret={clientSecret}
              environment={environment}
              onRetry={() => createPaymentIntent(currentPaymentOption.onlineAmount)}
              paymentOption={currentPaymentOption}
            />
          </Elements>
        )}
      </div>

      {/* Modal de éxito para reservas gratuitas */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false)
          onSuccess()
        }}
        bookingData={{
          customerEmail: bookingData.customerEmail,
          bookingDate: bookingData.bookingDate,
          startTime: bookingData.startTime,
          endTime: bookingData.endTime,
          vehicleName: bookingData.vehicleName,
          totalPrice: finalAmount,
          securityDeposit: securityDeposit,
          paymentType: "full_payment",
          amountPaid: 0,
          amountPending: 0,
        }}
      />

      {/* ✅ CORREGIDO: Asegurar que el indicador de carga tenga prioridad sobre todo */}
      {paymentProcessing && <OroLoading />}
    </>
  )
}

export function StripePayment(props: StripePaymentProps): ReactElement {
  if (!stripePromise) {
    return (
      <Card className="w-full mx-auto">
        <CardContent className="p-4 sm:p-6 text-center">
          <div className="text-red-600">
            <p className="font-semibold">Error de configuración</p>
            <p className="text-sm">Stripe no está configurado correctamente</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return <PaymentForm {...props} />
}
