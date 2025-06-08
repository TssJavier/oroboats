"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Shield, AlertTriangle } from "lucide-react"
import { useApp } from "@/components/providers"

interface LiabilityWaiverProps {
  customerName: string
  customerEmail: string
  onWaiverSigned: (waiverId: number) => void
  onBack: () => void
}

const translations = {
  es: {
    title: "Exención de Responsabilidad",
    subtitle: "Documento requerido para proceder con la reserva",
    readCarefully: "Por favor, lee cuidadosamente el siguiente documento:",
    iAccept: "He leído y acepto los términos de la exención de responsabilidad",
    signDocument: "Firmar Documento",
    back: "Volver",
    signing: "Firmando...",
    mustAccept: "Debes aceptar los términos para continuar",
    signatureInfo:
      "Al hacer clic en 'Firmar Documento', tu nombre será registrado como firma digital junto con la fecha, hora y dirección IP.",
    legalNotice: "Este documento tiene validez legal y es vinculante.",
  },
  en: {
    title: "Liability Waiver",
    subtitle: "Required document to proceed with booking",
    readCarefully: "Please read the following document carefully:",
    iAccept: "I have read and accept the terms of the liability waiver",
    signDocument: "Sign Document",
    back: "Back",
    signing: "Signing...",
    mustAccept: "You must accept the terms to continue",
    signatureInfo:
      "By clicking 'Sign Document', your name will be recorded as a digital signature along with date, time, and IP address.",
    legalNotice: "This document has legal validity and is binding.",
  },
}

const WAIVER_PREVIEW_ES = `
EXENCIÓN DE RESPONSABILIDAD Y ASUNCIÓN DE RIESGO
ALQUILER DE EMBARCACIONES Y MOTOS ACUÁTICAS

Al firmar este documento, usted acepta:

1. ASUNCIÓN DE RIESGO
Las actividades náuticas conllevan riesgos inherentes que pueden resultar en lesiones personales, daños a la propiedad o incluso la muerte.

2. EXENCIÓN DE RESPONSABILIDAD
Libera a OroBoats de cualquier reclamación por lesiones, daños o muerte que puedan surgir del uso del equipo alquilado.

3. COMPETENCIA Y EXPERIENCIA
Declara tener la experiencia necesaria para operar el equipo de manera segura.

4. CUMPLIMIENTO DE NORMAS
Se compromete a cumplir con todas las leyes marítimas y normas de seguridad.

5. RESPONSABILIDAD POR DAÑOS
Acepta ser responsable de cualquier daño al equipo por negligencia o mal uso.

6. CONDICIONES MÉDICAS
Declara no tener condiciones médicas que afecten su capacidad de operación.

Este es un resumen. El documento completo se generará al firmar.
`

const WAIVER_PREVIEW_EN = `
LIABILITY WAIVER AND ASSUMPTION OF RISK
BOAT AND JET SKI RENTAL

By signing this document, you accept:

1. ASSUMPTION OF RISK
Nautical activities carry inherent risks that may result in personal injury, property damage, or death.

2. LIABILITY WAIVER
You release OroBoats from any claims for injuries, damages, or death that may arise from equipment use.

3. COMPETENCE AND EXPERIENCE
You declare having the necessary experience to operate equipment safely.

4. COMPLIANCE WITH REGULATIONS
You commit to comply with all maritime laws and safety standards.

5. LIABILITY FOR DAMAGES
You accept responsibility for any equipment damage due to negligence or misuse.

6. MEDICAL CONDITIONS
You declare having no medical conditions affecting your operation ability.

This is a summary. The complete document will be generated upon signing.
`

export function LiabilityWaiver({ customerName, customerEmail, onWaiverSigned, onBack }: LiabilityWaiverProps) {
  const { language } = useApp()
  const t = translations[language]

  const [accepted, setAccepted] = useState(false)
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState("")

  const waiverPreview = language === "es" ? WAIVER_PREVIEW_ES : WAIVER_PREVIEW_EN

  const handleSign = async () => {
    if (!accepted) {
      setError(t.mustAccept)
      return
    }

    setSigning(true)
    setError("")

    try {
      const response = await fetch("/api/liability-waiver", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName,
          customerEmail,
          language,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create waiver")
      }

      const data = await response.json()
      onWaiverSigned(data.waiverId)
    } catch (error) {
      console.error("Error signing waiver:", error)
      setError("Error al firmar el documento. Inténtalo de nuevo.")
    } finally {
      setSigning(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-black mb-2">{t.title}</h3>
        <p className="text-gray-600">{t.subtitle}</p>
      </div>

      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-black flex items-center">
            <Shield className="h-5 w-5 text-blue-600 mr-2" />
            {t.readCarefully}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96 w-full border rounded-lg p-4 bg-gray-50">
            <div className="whitespace-pre-line text-sm text-gray-700 leading-relaxed">{waiverPreview}</div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Información sobre la firma digital */}
      <Card className="bg-blue-50 border border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="text-blue-800 font-medium mb-1">{t.legalNotice}</p>
              <p className="text-blue-700">{t.signatureInfo}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checkbox de aceptación */}
      <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
        <Checkbox
          id="accept-waiver"
          checked={accepted}
          onCheckedChange={(checked) => {
            setAccepted(checked === true)
            setError("")
          }}
          className="mt-1"
        />
        <label htmlFor="accept-waiver" className="text-sm text-gray-700 cursor-pointer">
          {t.iAccept}
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Botones de navegación */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-between pt-4">
        <Button variant="outline" onClick={onBack} className="border-gray-300 w-full sm:w-auto" disabled={signing}>
          {t.back}
        </Button>

        <Button
          onClick={handleSign}
          disabled={!accepted || signing}
          className="bg-blue-600 text-white hover:bg-blue-700 w-full sm:w-auto"
        >
          {signing ? t.signing : t.signDocument}
          <FileText className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
