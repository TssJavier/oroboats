"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SignatureCanvas } from "@/components/booking/signature-canvas"
import { getWaiverContent } from "@/lib/waiver-content"

interface LiabilityWaiverProps {
  customerName: string
  customerEmail: string
  customerDni: string
  manualDeposit: number
  onWaiverSigned: (waiverId: number) => void
  className?: string
  onBack: () => void
  // ✅ NUEVO: datos de la reserva para mostrar en el contrato que firma el cliente
  vehicleName?: string
  beachLocationId?: string
}

export function LiabilityWaiver({ customerName, customerEmail, customerDni, manualDeposit, onWaiverSigned, className = "", vehicleName, beachLocationId }: LiabilityWaiverProps) {
  const [agreed, setAgreed] = useState(false)
  const [signatureData, setSignatureData] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // ✅ NUEVO: nombre de la playa resuelto a partir del beachLocationId
  const [beachName, setBeachName] = useState<string>("")

  useEffect(() => {
    if (!beachLocationId) return
    let cancelled = false
    fetch("/api/locations")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (cancelled || !Array.isArray(data)) return
        const match = data.find((loc: { id: string; name: string }) => loc.id === beachLocationId)
        if (match?.name) setBeachName(match.name)
      })
      .catch((err) => console.error("Error resolviendo el nombre de la playa:", err))
    return () => {
      cancelled = true
    }
  }, [beachLocationId])

  console.log("🔍 DEBUG - LiabilityWaiver received:", {
    customerName,
    customerEmail,
    manualDeposit,
    manualDepositType: typeof manualDeposit,
  })

  

  const handleSignatureComplete = (data: string) => {
    console.log("✅ Firma recibida del componente SignatureCanvas")
    console.log(`📏 Tamaño de la firma: ${data.length} caracteres`)
    setSignatureData(data)
  }

  const handleSubmit = async () => {
    if (!agreed) {
      setError("Debe aceptar los términos y condiciones")
      return
    }

    if (!signatureData) {
      setError("Se requiere su firma digital")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      console.log("🚀 Enviando waiver al servidor...")
      console.log(`📏 Tamaño de la firma a enviar: ${signatureData.length} caracteres`)

      const response = await fetch("/api/liability-waiver", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerDni,
          signatureData,
          manualDeposit,
          beachLocationName: beachName || null, // ✅ NUEVO: para incluir la playa en el texto guardado
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar el documento")
      }

      console.log("✅ Waiver creado exitosamente:", data)
      onWaiverSigned(data.waiverId)
    } catch (err) {
      console.error("❌ Error al enviar el waiver:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setIsSubmitting(false)
    }
  }

  console.log("🔍 DEBUG - Before getWaiverContent:", {
    language: "es",
    customerName,
    ip: "127.0.0.1",
    manualDeposit,
    manualDepositFormatted: (typeof manualDeposit === 'number' ? manualDeposit : 0).toFixed(2) + " €",

  })
  // Generar contenido del waiver (incluye la playa/ubicación en el cuerpo legal si está disponible)
  const waiverContent = getWaiverContent("es", customerName, "127.0.0.1", manualDeposit, beachName)

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold">Exención de Responsabilidad</h3>

      {/* ✅ NUEVO: Resumen de la reserva que se está firmando */}
      {(vehicleName || beachName) && (
        <div className="rounded-md border border-gray-200 bg-blue-50 p-3 text-sm">
          <p className="font-semibold text-gray-800 mb-1">Estás firmando el contrato para:</p>
          {vehicleName && (
            <p className="text-gray-700">
              <span className="font-medium">Vehículo:</span> {vehicleName}
            </p>
          )}
          {beachName && (
            <p className="text-gray-700">
              <span className="font-medium">Playa / Ubicación:</span> {beachName}
            </p>
          )}
        </div>
      )}

      <ScrollArea className="h-64 border rounded-md p-4 bg-gray-50">
        <div className="whitespace-pre-wrap">{waiverContent}</div>
      </ScrollArea>

      <div className="flex items-start space-x-2 mt-4">
        <Checkbox id="terms" checked={agreed} onCheckedChange={(checked) => setAgreed(!!checked)} />
        <label
          htmlFor="terms"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          He leído y acepto los términos y condiciones
        </label>
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium mb-2">Firma digital:</p>
        <SignatureCanvas onSignatureComplete={handleSignatureComplete} className="mb-2" />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <Button onClick={handleSubmit} disabled={!agreed || !signatureData || isSubmitting} className="w-full">
        {isSubmitting ? "Enviando..." : "Firmar y continuar"}
      </Button>
    </div>
  )
}
