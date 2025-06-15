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
        // Obtener la firma como imagen base64 con configuración optimizada
        const signatureData = sigCanvas.current.toDataURL("image/png", {
          // Reducir calidad para evitar archivos muy grandes
          quality: 0.8,
        })

        // Validar que la firma no esté vacía y tenga formato correcto
        if (!signatureData || !signatureData.startsWith("data:image/png;base64,")) {
          throw new Error("Formato de firma inválido")
        }

        // Verificar tamaño razonable (máximo 1MB)
        if (signatureData.length > 1024 * 1024) {
          console.warn("⚠️ Signature is large:", signatureData.length, "characters")
          // Intentar reducir calidad
          const reducedSignature = sigCanvas.current.toDataURL("image/png", { quality: 0.5 })
          if (reducedSignature.length < signatureData.length) {
            console.log("✅ Reduced signature size to:", reducedSignature.length)
            onSignatureComplete(reducedSignature)
            setIsSigned(true)
            return
          }
        }

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
          // Configuración optimizada para móviles
          dotSize={2}
          minWidth={1}
          maxWidth={3}
          throttle={16}
          velocityFilterWeight={0.7}
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
