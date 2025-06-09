"use client"
import { useRef, useState, useEffect } from "react"
import { SignatureCanvas as ReactSignatureCanvas } from "react-signature-canvas"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SignatureCanvasProps {
  onSignatureComplete: (signatureData: string) => void
  className?: string
}

export function SignatureCanvas({ onSignatureComplete, className = "" }: SignatureCanvasProps) {
  const sigCanvas = useRef<ReactSignatureCanvas>(null)
  const [isSigned, setIsSigned] = useState(false)
  const [isSmallScreen, setIsSmallScreen] = useState(false)

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768)
    }

    checkScreenSize()
    window.addEventListener("resize", checkScreenSize)

    return () => {
      window.removeEventListener("resize", checkScreenSize)
    }
  }, [])

  const clear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear()
      setIsSigned(false)
    }
  }

  const save = () => {
    if (sigCanvas.current) {
      if (sigCanvas.current.isEmpty()) {
        alert("Por favor, firme antes de continuar")
        return
      }

      try {
        // Obtener la firma como imagen base64
        const signatureData = sigCanvas.current.toDataURL("image/png")
        console.log("✅ Firma capturada correctamente")
        console.log(`📏 Tamaño de la firma: ${signatureData.length} caracteres`)
        console.log(`🔍 Vista previa: ${signatureData.substring(0, 50)}...`)

        // Enviar la firma al componente padre
        onSignatureComplete(signatureData)
        setIsSigned(true)
      } catch (error) {
        console.error("❌ Error al guardar la firma:", error)
        alert("Error al guardar la firma. Por favor, inténtelo de nuevo.")
      }
    }
  }

  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      <div className="w-full border-2 border-gray-300 rounded-md bg-white">
        <ReactSignatureCanvas
          ref={sigCanvas}
          penColor="black"
          canvasProps={{
            className: "signature-canvas w-full",
            style: {
              height: isSmallScreen ? "200px" : "150px",
              width: "100%",
              backgroundColor: "#fff",
            },
          }}
          onBegin={() => setIsSigned(true)}
        />
      </div>

      <div className="flex space-x-4 w-full justify-center">
        <Button type="button" variant="outline" onClick={clear} className="w-1/3">
          Borrar
        </Button>

        <Button
          type="button"
          onClick={save}
          disabled={!isSigned}
          className={cn("w-2/3", !isSigned && "opacity-50 cursor-not-allowed")}
        >
          Confirmar firma
        </Button>
      </div>
    </div>
  )
}
