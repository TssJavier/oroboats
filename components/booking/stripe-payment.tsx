"use client"

import React from "react"

import type { ReactElement } from "react"

import { useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SuccessModal } from "./success-modal"
import { DiscountInput } from "./discount-input"

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

interface StripePaymentProps {
  amount: number
  bookingData: any
  onSuccess: () => void
  onError: (error: string) => void
}

// Componente interno que maneja el pago con Elements
function PaymentFormWithElements({
  amount,
  bookingData,
  onSuccess,
  onError,
  clientSecret,
  environment,
  onRetry,
}: StripePaymentProps & {
  clientSecret: string
  environment: string
  onRetry: () => void
}): ReactElement {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

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

    try {
      console.log("🔄 Confirming payment with clientSecret:", clientSecret.substring(0, 20) + "...")

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
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        console.log("✅ Payment succeeded:", paymentIntent.id)

        // Confirmar reserva en backend
        const confirmResponse = await fetch("/api/confirm-booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
        })

        if (confirmResponse.ok) {
          // Mostrar modal de éxito en lugar de alert
          setShowSuccessModal(true)
        } else {
          const errorData = await confirmResponse.json()
          onError(errorData.error || "Error confirmando la reserva")
        }
      }
    } catch (err) {
      console.error("❌ Payment error:", err)
      onError("Error procesando el pago")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Pago Seguro</CardTitle>
          <p className="text-sm text-gray-600">Acepta tarjetas, PayPal y más</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <PaymentElement
                options={{
                  layout: "tabs",
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
              {loading ? "Procesando..." : `Pagar €${amount}`}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Modal de éxito */}
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
        }}
      />
    </>
  )
}

// Componente principal que maneja la lógica de descuentos y payment intent
function PaymentForm({ amount, bookingData, onSuccess, onError }: StripePaymentProps): ReactElement {
  const [loading, setLoading] = useState(false)
  const [clientSecret, setClientSecret] = useState<string>("")
  const [paymentIntentId, setPaymentIntentId] = useState<string>("")
  const [finalAmount, setFinalAmount] = useState(amount)
  const [discountData, setDiscountData] = useState<any>(null)
  const [error, setError] = useState<string>("")
  const [environment, setEnvironment] = useState<string>("unknown")
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Verificar si es reserva gratuita (100% descuento)
  const isFreeBooking = finalAmount <= 0

  // Crear Payment Intent cuando se monta el componente (solo si no es gratis)
  React.useEffect(() => {
    if (!isFreeBooking) {
      createPaymentIntent(finalAmount)
    }
  }, [finalAmount, isFreeBooking])

  const createPaymentIntent = async (payAmount: number) => {
    try {
      setError("")
      setClientSecret("") // Limpiar clientSecret anterior
      setLoading(true)
      console.log("🔄 Creating payment intent for amount:", payAmount)

      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: payAmount,
          bookingData: {
            ...bookingData,
            finalAmount: payAmount,
            discountCode: discountData?.code,
            discountAmount: discountData?.discountAmount,
            originalPrice: discountData ? amount : undefined,
          },
          metadata: {
            customerEmail: bookingData.customerEmail,
            vehicleId: bookingData.vehicleId,
          },
        }),
      })

      console.log("📡 Response status:", response.status)

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
      setPaymentIntentId(piId)
      setEnvironment(env)
    } catch (error) {
      console.error("❌ Error creating payment intent:", error)
      const errorMessage = error instanceof Error ? error.message : "Error preparando el pago"
      setError(errorMessage)
      onError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDiscountApplied = (discount: any) => {
    setDiscountData(discount)
    if (discount) {
      setFinalAmount(discount.finalAmount)
    } else {
      setFinalAmount(amount)
    }
  }

  // Manejar reserva gratuita (sin Stripe)
  const handleFreeBooking = async () => {
    setLoading(true)
    try {
      console.log("🎁 Processing free booking...")

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...bookingData,
          finalAmount: 0,
          discountCode: discountData?.code,
          discountAmount: discountData?.discountAmount,
          originalPrice: amount,
          paymentStatus: "free_booking",
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
    }
  }

  // Mostrar error si no se puede crear el payment intent
  if (error && !isFreeBooking) {
    return (
      <div className="space-y-6">
        <DiscountInput totalAmount={amount} onDiscountApplied={handleDiscountApplied} />
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <div className="text-red-600 mb-4">
              <p className="font-semibold">Error de configuración</p>
              <p className="text-sm">{error}</p>
              {environment && <p className="text-xs mt-2 text-gray-500">Entorno: {environment}</p>}
            </div>
            <Button onClick={() => createPaymentIntent(finalAmount)} variant="outline">
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
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <p className="mb-2">Preparando pago...</p>
            {environment && <p className="text-xs mt-2 text-gray-500">Entorno: {environment}</p>}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
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

        {/* Resumen de precio */}
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <div className="space-y-2">
              {discountData && (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Precio original:</span>
                    <span>€{amount}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Descuento ({discountData.code}):</span>
                    <span>-€{discountData.discountAmount}</span>
                  </div>
                  <hr className="my-2" />
                </>
              )}
              <div className="flex justify-between font-bold text-lg">
                <span>Total a pagar:</span>
                <span className={isFreeBooking ? "text-green-600" : ""}>
                  {isFreeBooking ? "¡GRATIS!" : `€${finalAmount}`}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulario de pago o confirmación gratuita */}
        {isFreeBooking ? (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Reserva Gratuita</CardTitle>
              <p className="text-sm text-gray-600">¡Tu reserva es completamente gratuita!</p>
            </CardHeader>
            <CardContent>
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
          // Renderizar el formulario de pago con Elements
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe" as const,
                variables: {
                  colorPrimary: "#D4AF37",
                },
              },
            }}
          >
            <PaymentFormWithElements
              amount={finalAmount}
              bookingData={bookingData}
              onSuccess={onSuccess}
              onError={onError}
              clientSecret={clientSecret}
              environment={environment}
              onRetry={() => createPaymentIntent(finalAmount)}
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
        }}
      />
    </>
  )
}

export function StripePayment(props: StripePaymentProps): ReactElement {
  if (!stripePromise) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
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
