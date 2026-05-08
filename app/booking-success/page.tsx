"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { OroLoading } from "@/components/ui/oro-loading"
import { SuccessModal } from "@/components/booking/success-modal"

interface BookingDetails {
  customerEmail: string
  bookingDate: string
  startTime: string
  endTime: string
  vehicleName?: string
  totalPrice: number
  securityDeposit?: number
  paymentType?: "full_payment" | "partial_payment"
  amountPaid?: number
  amountPending?: number
}

function BookingSuccessInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentIntent = searchParams.get("payment_intent")
  const redirectStatus = searchParams.get("redirect_status")

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null)
  const calledRef = useRef(false)

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    const confirm = async () => {
      if (!paymentIntent) {
        setStatus("error")
        setErrorMessage("Falta el identificador del pago en la URL.")
        return
      }

      if (redirectStatus && redirectStatus !== "succeeded") {
        setStatus("error")
        setErrorMessage(
          redirectStatus === "failed"
            ? "El pago no se ha completado. Inténtalo de nuevo."
            : `Estado del pago: ${redirectStatus}`,
        )
        return
      }

      try {
        const response = await fetch("/api/confirm-booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentIntentId: paymentIntent }),
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          setStatus("error")
          setErrorMessage(data.error || "No se pudo confirmar la reserva.")
          return
        }

        setBookingDetails(data.bookingDetails)
        setStatus("success")
      } catch (err) {
        console.error("❌ Error confirming booking on success page:", err)
        setStatus("error")
        setErrorMessage("Error de conexión confirmando la reserva.")
      }
    }

    confirm()
  }, [paymentIntent, redirectStatus])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold mx-auto mb-4"></div>
            <p className="text-lg font-medium mb-1">Confirmando tu reserva…</p>
            <p className="text-sm text-gray-500">Esto solo tarda un instante.</p>
          </CardContent>
        </Card>
        <OroLoading />
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <p className="text-lg font-semibold text-red-600">No pudimos confirmar la reserva</p>
            <p className="text-sm text-gray-600">{errorMessage}</p>
            <p className="text-xs text-gray-500">
              Si has visto un cargo en tu cuenta y no recibes confirmación por email en unos minutos, contacta con
              soporte indicando este identificador: <span className="font-mono">{paymentIntent}</span>
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={() => router.push("/")} className="bg-gold text-black hover:bg-black hover:text-white">
                Volver al inicio
              </Button>
              <Button variant="outline" onClick={() => router.push("/contact")}>
                Contactar con soporte
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!bookingDetails) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <SuccessModal
        isOpen={true}
        onClose={() => router.push("/")}
        bookingData={bookingDetails}
      />
    </div>
  )
}

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold"></div>
        </div>
      }
    >
      <BookingSuccessInner />
    </Suspense>
  )
}
