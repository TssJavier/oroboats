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

// ✅ CONFIGURACIÓN STRIPE CORREGIDA Y FUNCIONAL
const getStripeConfig = () => {
  const nodeEnv = process.env.NODE_ENV
  const publicEnv = process.env.NEXT_PUBLIC_ENVIRONMENT

  // ✅ LÓGICA SIMPLIFICADA: Solo usar LIVE si ambos son production
  const shouldUseLive = nodeEnv === "production" && publicEnv === "production"

  const publishableKey = shouldUseLive
    ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE
    : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

  console.log("🔍 Stripe client config:", {
    nodeEnv,
    publicEnv,
    shouldUseLive,
    keyPrefix: publishableKey?.substring(0, 7),
    keyExists: !!publishableKey,
  })

  return {
    publishableKey,
    isProduction: shouldUseLive,
  }
}

const stripeConfig = getStripeConfig()
const stripePromise = stripeConfig.publishableKey ? loadStripe(stripeConfig.publishableKey) : null

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
  manualDeposit?: number
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
  depositClientSecret,
  depositPaymentIntentId,
  environment,
  onRetry,
  paymentOption,
}: StripePaymentProps & {
  clientSecret: string
  depositClientSecret: string | null
  depositPaymentIntentId: string | null
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
  const [elementError, setElementError] = useState<string>("")

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements || !clientSecret) {
      onError("Stripe no está listo. Intenta recargar la página.")
      return
    }

    setLoading(true)
    setPaymentProcessing(true)

    try {
      console.log("🔍 Validating booking data before payment...")

      const validationResponse = await fetch("/api/validate-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      })

      if (!validationResponse.ok) {
        const validationError = await validationResponse.json()
        console.error("❌ Booking validation failed:", validationError)
        onError(validationError.error || "Error validando los datos de reserva")
        setPaymentProcessing(false)
        setLoading(false)
        return
      }

      console.log("✅ Booking validation passed, proceeding with payment...")

      const returnUrl = `${window.location.origin}/booking-success`

      // ✅ PASO 1: CONFIRMAR PAGO DEL ALQUILER (MONTO CORRECTO)
      console.log("💳 Confirming payment for amount:", paymentOption.onlineAmount)
      const { error: rentalError, paymentIntent: rentalIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: "if_required",
      })

      if (rentalError) {
        console.error("❌ Payment failed:", rentalError)
        onError(rentalError.message || "Error en el pago")
        setPaymentProcessing(false)
        setLoading(false)
        return
      }

      if (!rentalIntent || rentalIntent.status !== "succeeded") {
        onError("Error: El pago no se completó correctamente")
        setPaymentProcessing(false)
        setLoading(false)
        return
      }

      console.log("✅ Payment succeeded:", {
        id: rentalIntent.id,
        amount: rentalIntent.amount / 100,
        paymentType: paymentOption.type,
      })

      // ✅ PASO 2: CONFIRMAR AUTORIZACIÓN DE FIANZA (solo para pago completo)
      let depositConfirmed = false
      if (
        depositClientSecret &&
        depositPaymentIntentId &&
        securityDeposit > 0 &&
        paymentOption.type === "full_payment"
      ) {
        try {
          console.log("🛡️ Confirming DEPOSIT authorization...")

          const paymentMethod = rentalIntent.payment_method as string

          if (paymentMethod) {
            const { error: depositError, paymentIntent: depositIntent } = await stripe.confirmPayment({
              clientSecret: depositClientSecret,
              confirmParams: {
                payment_method: paymentMethod,
                return_url: returnUrl,
              },
              redirect: "if_required",
            })

            if (depositError) {
              console.error("⚠️ Deposit authorization failed:", depositError)
              console.warn("⚠️ Continuing without deposit authorization")
            } else if (depositIntent && depositIntent.status === "requires_capture") {
              console.log("✅ Deposit authorization succeeded:", depositIntent.id)
              depositConfirmed = true
            } else {
              console.warn("⚠️ Unexpected deposit status:", depositIntent?.status)
            }
          }
        } catch (depositError) {
          console.error("⚠️ Error confirming deposit:", depositError)
          console.warn("⚠️ Continuing without deposit authorization")
        }
      }

      // ✅ PASO 3: CONFIRMAR BOOKING CON MONTOS CORRECTOS
      const confirmResponse = await fetch("/api/confirm-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId: rentalIntent.id,
          depositPaymentIntentId: depositConfirmed ? depositPaymentIntentId : null,
          paymentType: paymentOption.type,
          amountPaid: paymentOption.onlineAmount, // ✅ MONTO CORRECTO PAGADO
          amountPending: paymentOption.remainingAmount, // ✅ MONTO CORRECTO PENDIENTE
          liabilityWaiverId: bookingData.liabilityWaiverId,
        }),
      })

      if (confirmResponse.ok) {
        const result = await confirmResponse.json()
        console.log("✅ Booking confirmed with CORRECT amounts:", result)
        setShowSuccessModal(true)
        setPaymentProcessing(false)
      } else {
        const errorData = await confirmResponse.json()
        console.error("❌ Booking confirmation failed:", errorData)
        onError(errorData.error || "Error confirmando la reserva")
        setPaymentProcessing(false)
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
          <CardTitle>💳 Pago {paymentOption.type === "partial_payment" ? "Parcial" : "Completo"}</CardTitle>
          <p className="text-sm text-gray-600">
            Procesado por Stripe {stripeConfig.isProduction ? "(Producción)" : "(Test)"}
          </p>
          {paymentOption.type === "partial_payment" && (
            <p className="text-xs text-blue-600">
              💰 Pagas €{paymentOption.onlineAmount} ahora, €{paymentOption.remainingAmount} en el sitio
            </p>
          )}
          {securityDeposit > 0 && paymentOption.type === "full_payment" && (
            <p className="text-xs text-blue-600">🛡️ Fianza €{securityDeposit} - Autorización sin cargo</p>
          )}

          {bookingData.manualDeposit && bookingData.manualDeposit > 0 && (
            <p className="text-xs text-yellow-600">🏷️ Fianza manual en sitio: €{bookingData.manualDeposit}</p>
          )}
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-4 border border-gray-200 rounded-lg bg-white min-h-[300px] relative">
              {!elementReady && !elementError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Cargando formulario de pago...</p>
                  </div>
                </div>
              )}

              {elementError && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-lg border border-red-200">
                  <div className="text-center p-4">
                    <p className="text-red-600 font-semibold mb-2">Error cargando el formulario de pago</p>
                    <p className="text-red-500 text-sm mb-4">{elementError}</p>
                    <Button onClick={onRetry} variant="outline" size="sm">
                      Reintentar
                    </Button>
                  </div>
                </div>
              )}

              {!elementError && (
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
                    setElementError("")
                  }}
                  onLoadError={(error) => {
                    console.error("❌ PaymentElement load error:", error)
                    setElementReady(false)
                    setElementError(
                      error.error?.message || "Error cargando el formulario de pago. Intenta recargar la página.",
                    )
                  }}
                />
              )}
            </div>

            <div className="text-center text-sm text-gray-500">🔒 Pago seguro con cifrado SSL</div>

            <Button
              type="submit"
              disabled={!stripe || !elementReady || loading || !!elementError}
              className="w-full bg-gold text-black hover:bg-black hover:text-white transition-all duration-300 font-medium text-lg py-3"
            >
              {loading ? "Procesando pago..." : `Pagar €${paymentOption.onlineAmount}`}
            </Button>

            {/* ✅ INFORMACIÓN CLARA SOBRE EL PAGO */}
            <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 font-medium mb-2">
                {paymentOption.type === "partial_payment" ? "💰 Pago Parcial:" : "💳 Pago Completo:"}
              </p>
              <div className="space-y-1 text-sm text-blue-600">
                <div>• Cobro ahora: €{paymentOption.onlineAmount}</div>
                {paymentOption.remainingAmount > 0 && <div>• Pendiente en sitio: €{paymentOption.remainingAmount}</div>}
                {securityDeposit > 0 && paymentOption.type === "full_payment" && (
                  <div>• Fianza autorizada: €{securityDeposit} (sin cargo)</div>
                )}
                {securityDeposit > 0 && paymentOption.type === "partial_payment" && (
                  <div>• Fianza en sitio: €{securityDeposit} (efectivo/tarjeta)</div>
                )}

                {bookingData.manualDeposit && bookingData.manualDeposit > 0 && (
                  <div>• Fianza en sitio: €{bookingData.manualDeposit} (manual)</div>
                )}
              </div>
            </div>
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
          totalPrice: amount, // ✅ PRECIO TOTAL DEL ALQUILER
          securityDeposit: securityDeposit,
          paymentType: paymentOption.type,
          amountPaid: paymentOption.onlineAmount, // ✅ MONTO CORRECTO PAGADO
          amountPending: paymentOption.remainingAmount, // ✅ MONTO CORRECTO PENDIENTE
        }}
      />

      {paymentProcessing && <OroLoading />}
    </>
  )
}

// Componente principal CON TODA LA FUNCIONALIDAD RESTAURADA
function PaymentForm({
  amount,
  securityDeposit = 0,
  bookingData,
  onSuccess,
  onError,
}: StripePaymentProps): ReactElement {
  const [loading, setLoading] = useState(false)
  const [clientSecret, setClientSecret] = useState<string>("")
  const [depositClientSecret, setDepositClientSecret] = useState<string | null>(null)
  const [depositPaymentIntentId, setDepositPaymentIntentId] = useState<string | null>(null)
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
        onlineAmount: finalAmount, // ✅ PRECIO TOTAL DEL ALQUILER
        remainingAmount: 0,
        totalAmount: finalAmount,
        securityDepositLocation: "online",
      }
    } else {
      return {
        type: "partial_payment",
        label: `Pago parcial (${partialPaymentAmount}€ ahora)`,
        description: "Resto al llegar",
        onlineAmount: partialPaymentAmount, // ✅ SOLO EL MONTO PARCIAL
        remainingAmount: finalAmount - partialPaymentAmount, // ✅ SIN INCLUIR FIANZA AQUÍ
        totalAmount: finalAmount,
        securityDepositLocation: "on_site",
      }
    }
  }, [selectedPaymentType, finalAmount, partialPaymentAmount])

  const lastCreatedPaymentTypeRef = useRef<string>("")
  const isCreatingPaymentIntentRef = useRef<boolean>(false)
  const isFreeBooking = finalAmount <= 0

  React.useEffect(() => {
    if (
      !isFreeBooking &&
      selectedPaymentType !== lastCreatedPaymentTypeRef.current &&
      !isCreatingPaymentIntentRef.current
    ) {
      lastCreatedPaymentTypeRef.current = selectedPaymentType
      createPaymentIntent()
    }
  }, [selectedPaymentType, finalAmount, isFreeBooking])

  const createPaymentIntent = async () => {
    if (isCreatingPaymentIntentRef.current) return

    try {
      isCreatingPaymentIntentRef.current = true
      setError("")
      setClientSecret("")
      setDepositClientSecret(null)
      setDepositPaymentIntentId(null)
      setLoading(true)

      const paymentData = {
        amount: finalAmount, // ✅ PRECIO TOTAL DEL ALQUILER
        securityDeposit: securityDeposit,
        paymentType: selectedPaymentType, // ✅ TIPO DE PAGO SELECCIONADO
        bookingData: {
          ...bookingData,
          finalAmount: finalAmount,
          securityDeposit: securityDeposit,
          discountCode: discountData?.code,
          paymentType: selectedPaymentType,
          vehicleType: vehicleType,
          customerName: bookingData.customerName,
          customerEmail: bookingData.customerEmail,
          customerPhone: bookingData.customerPhone,
          vehicleId: bookingData.vehicleId,
          vehicleName: bookingData.vehicleName,
          bookingDate: bookingData.bookingDate,
          startTime: bookingData.startTime,
          endTime: bookingData.endTime,
          liabilityWaiverId: bookingData.liabilityWaiverId,
        },
      }

      console.log("💳 Creating payment intent with CORRECT amounts:", {
        totalRentalAmount: finalAmount,
        paymentType: selectedPaymentType,
        expectedChargeAmount: currentPaymentOption.onlineAmount,
        depositAmount: securityDeposit,
      })

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

      const data = await response.json()

      if (!data.clientSecret || !data.clientSecret.startsWith("pi_")) {
        throw new Error("Invalid client secret received")
      }

      console.log("✅ Payment intent created with CORRECT amounts:", {
        clientSecret: data.clientSecret.substring(0, 20) + "...",
        depositClientSecret: data.depositClientSecret?.substring(0, 20) + "..." || "none",
        debug: data.debug,
      })

      setClientSecret(data.clientSecret)
      setDepositClientSecret(data.depositClientSecret)
      setDepositPaymentIntentId(data.depositPaymentIntentId)
      setEnvironment(data.environment)
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
      const validationResponse = await fetch("/api/validate-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      })

      if (!validationResponse.ok) {
        const validationError = await validationResponse.json()
        onError(validationError.error || "Error validando los datos de reserva")
        return
      }

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
          liabilityWaiverId: bookingData.liabilityWaiverId,
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
            <Button onClick={() => createPaymentIntent()} variant="outline">
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
            <p className="mb-2">Preparando pago con montos correctos...</p>
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
                {loading ? "Validando y procesando..." : "Confirmar Reserva Gratuita"}
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
              depositClientSecret={depositClientSecret}
              depositPaymentIntentId={depositPaymentIntentId}
              environment={environment}
              onRetry={() => createPaymentIntent()}
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
            <p className="text-xs mt-2">Clave pública: {stripeConfig.publishableKey ? "✅ Configurada" : "❌ Falta"}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return <PaymentForm {...props} />
}
