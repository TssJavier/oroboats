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
//const isProduction = process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production"
const isProduction = process.env.NEXT_PUBLIC_ENVIRONMENT === "production"

const stripePublishableKey = isProduction
  ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE
  : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST

console.log("🌍 Stripe client environment:", {
  isProduction,
  hasKey: !!stripePublishableKey,
  keyPrefix: stripePublishableKey?.substring(0, 7),
  domain: typeof window !== "undefined" ? window.location.hostname : "server",
})

// ✅ CONFIGURACIÓN STRIPE SIMPLE
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
  const [elementReady, setElementReady] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements || !clientSecret) {
      onError("Stripe no está listo. Intenta recargar la página.")
      return
    }

    setLoading(true)
    setPaymentProcessing(true)

    try {
      console.log("🔄 Confirming payment...")

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

        // Confirmar reserva en backend
        const confirmResponse = await fetch("/api/confirm-booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            paymentType: paymentOption.type,
            amountPaid: paymentOption.onlineAmount,
            amountPending: paymentOption.remainingAmount,
          }),
        })

        if (confirmResponse.ok) {
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
      <Card className="w-full mx-auto">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle>💳 Pago Seguro</CardTitle>
          <p className="text-sm text-gray-600">Procesado por Stripe</p>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ✅ ÁREA DEL PAYMENT ELEMENT CON INDICADOR DE CARGA */}
            <div className="p-4 border border-gray-200 rounded-lg bg-white min-h-[300px] relative">
              {!elementReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Cargando formulario de pago...</p>
                  </div>
                </div>
              )}

              <PaymentElement
                options={{
                  layout: "tabs",
                  defaultValues: {
                    billingDetails: {
                      email: bookingData.customerEmail || "",
                    },
                  },
                }}
                onReady={() => {
                  console.log("✅ PaymentElement ready")
                  setElementReady(true)
                }}
                onLoadError={(error) => {
                  console.error("❌ PaymentElement load error:", error)
                  setElementReady(true) // Mostrar el error en lugar del loading
                  onError("Error cargando el formulario de pago. Intenta recargar la página.")
                }}
                onFocus={() => {
                  console.log("🎯 PaymentElement focused")
                }}
                onChange={(event) => {
                  console.log("🔄 PaymentElement changed:", event.complete)
                }}
              />
            </div>

            <div className="text-center text-sm text-gray-500">🔒 Pago seguro con cifrado SSL</div>

            <Button
              type="submit"
              disabled={!stripe || !elementReady || loading}
              className="w-full bg-gold text-black hover:bg-black hover:text-white transition-all duration-300 font-medium text-lg py-3"
            >
              {loading ? "Procesando..." : `Pagar €${paymentOption.onlineAmount}`}
            </Button>

            {paymentOption.type === "partial_payment" && (
              <div className="text-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-700 font-medium">
                  ⚠️ Recuerda: Deberás pagar €{paymentOption.remainingAmount} al llegar
                </p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

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
          amountPaid: paymentOption.onlineAmount,
          amountPending: paymentOption.remainingAmount,
        }}
      />

      {paymentProcessing && <OroLoading />}
    </>
  )
}

// Componente principal
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

  const [selectedPaymentType, setSelectedPaymentType] = useState<"full_payment" | "partial_payment">("full_payment")

  const isJetski =
    bookingData.vehicleType === "jetski" ||
    bookingData.vehicleCategory?.toLowerCase().includes("jetski") ||
    bookingData.vehicleName?.toLowerCase().includes("jetski") ||
    bookingData.vehicleName?.toLowerCase().includes("moto")

  const vehicleType = isJetski ? "jetski" : "boat"
  const partialPaymentAmount = vehicleType === "jetski" ? 50 : 100

  const currentPaymentOption: PaymentOption = React.useMemo(() => {
    if (selectedPaymentType === "full_payment") {
      return {
        type: "full_payment",
        label: "Pago completo",
        description: "Paga todo ahora",
        onlineAmount: finalAmount + securityDeposit,
        remainingAmount: 0,
        totalAmount: finalAmount,
        securityDepositLocation: "online",
      }
    } else {
      return {
        type: "partial_payment",
        label: `Pago parcial (${partialPaymentAmount}€ ahora)`,
        description: "Resto al llegar",
        onlineAmount: partialPaymentAmount,
        remainingAmount: finalAmount - partialPaymentAmount + securityDeposit,
        totalAmount: finalAmount,
        securityDepositLocation: "on_site",
      }
    }
  }, [selectedPaymentType, finalAmount, securityDeposit, partialPaymentAmount])

  const lastCreatedAmountRef = useRef<number>(0)
  const isCreatingPaymentIntentRef = useRef<boolean>(false)
  const isFreeBooking = finalAmount <= 0

  React.useEffect(() => {
    if (
      !isFreeBooking &&
      currentPaymentOption.onlineAmount !== lastCreatedAmountRef.current &&
      !isCreatingPaymentIntentRef.current
    ) {
      lastCreatedAmountRef.current = currentPaymentOption.onlineAmount
      createPaymentIntent(currentPaymentOption.onlineAmount)
    }
  }, [currentPaymentOption.onlineAmount, isFreeBooking])

  const createPaymentIntent = async (onlineAmount: number) => {
    if (isCreatingPaymentIntentRef.current) return

    try {
      isCreatingPaymentIntentRef.current = true
      setError("")
      setClientSecret("")
      setLoading(true)

      // ✅ USAR TU API ORIGINAL SIN CAMBIOS
      const paymentData = {
        amount: onlineAmount,
        paymentType: currentPaymentOption.type,
        amountPaid: currentPaymentOption.onlineAmount,
        amountPending: currentPaymentOption.remainingAmount,
        bookingData: {
          ...bookingData,
          finalAmount: finalAmount,
          securityDeposit: securityDeposit,
          discountCode: discountData?.code,
          paymentType: currentPaymentOption.type,
          amountPaid: currentPaymentOption.onlineAmount,
          amountPending: currentPaymentOption.remainingAmount,
        },
      }

      console.log("💳 Creating payment intent with your API:", paymentData)

      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("❌ API Error:", errorData)
        throw new Error(errorData.error || errorData.details || "Error creating payment intent")
      }

      const { clientSecret: cs, environment: env } = await response.json()

      console.log("🔍 Stripe (Frontend):", {
        clientSecret: cs?.substring(0, 15) + "...",
        publishableKeyPrefix: stripePublishableKey?.substring(0, 10),
        environment: environment,
      })




      if (typeof cs !== "string" || !cs.startsWith("pi_")) {
        throw new Error("Invalid client secret received")
      }


      console.log("✅ Payment intent created successfully")
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

  const handlePaymentTypeChange = (option: PaymentOption) => {
    setSelectedPaymentType(option.type)
  }

  const handleFreeBooking = async () => {
    setLoading(true)
    setPaymentProcessing(true)

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...bookingData,
          finalAmount: 0,
          paymentStatus: "free_booking",
          paymentType: "full_payment",
          amountPaid: 0,
          amountPending: 0,
        }),
      })

      if (response.ok) {
        setShowSuccessModal(true)
      } else {
        const errorData = await response.json()
        onError(errorData.error || "Error creando reserva gratuita")
      }
    } catch (error) {
      onError("Error procesando reserva gratuita")
    } finally {
      setLoading(false)
      setPaymentProcessing(false)
    }
  }

  if (error && !isFreeBooking) {
    return (
      <div className="space-y-6">
        <DiscountInput totalAmount={amount} onDiscountApplied={handleDiscountApplied} />
        <Card className="w-full mx-auto">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="text-red-600 mb-4">
              <p className="font-semibold">Error de configuración</p>
              <p className="text-sm">{error}</p>
            </div>
            <Button onClick={() => createPaymentIntent(currentPaymentOption.onlineAmount)} variant="outline">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading || (!clientSecret && !isFreeBooking)) {
    return (
      <div className="space-y-6">
        <DiscountInput totalAmount={amount} onDiscountApplied={handleDiscountApplied} />
        <Card className="w-full mx-auto">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mx-auto mb-2"></div>
            <p className="mb-2">Preparando pago seguro...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <DiscountInput totalAmount={amount} onDiscountApplied={handleDiscountApplied} />

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
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret: clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#D4AF37",
                  spacingUnit: "4px",
                  borderRadius: "8px",
                },
              },
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
