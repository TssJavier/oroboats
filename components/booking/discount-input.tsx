"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

interface DiscountInputProps {
  totalAmount: number
  onDiscountApplied: (discount: any) => void
}

export function DiscountInput({ totalAmount, onDiscountApplied }: DiscountInputProps) {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null)

  const validateCode = async () => {
    if (!code.trim()) {
      setError("Por favor, introduce un código de descuento")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/discount/validate?code=${encodeURIComponent(code)}&amount=${totalAmount}`)

      // Verificar si la respuesta es válida
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Response is not JSON")
      }

      const data = await response.json()
      console.log("🎫 Discount validation response:", data)

      if (data.valid) {
        setSuccess(`¡Código aplicado! ${data.description}`)
        setAppliedDiscount(data)
        onDiscountApplied({
          code: data.code,
          discountAmount: data.discountAmount,
          finalAmount: data.finalAmount,
          type: data.type,
          value: data.value,
        })
      } else {
        setError(data.error || "Código no válido")
        setAppliedDiscount(null)
        onDiscountApplied(null)
      }
    } catch (err) {
      console.error("Error validating discount code:", err)
      setError("Error al validar el código. Inténtalo de nuevo.")
      setAppliedDiscount(null)
      onDiscountApplied(null)
    } finally {
      setLoading(false)
    }
  }

  const removeDiscount = () => {
    setCode("")
    setSuccess("")
    setError("")
    setAppliedDiscount(null)
    onDiscountApplied(null)
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div>
            <label htmlFor="discount-code" className="block text-sm font-medium text-gray-700 mb-1">
              ¿Tienes un código de descuento?
            </label>
            <div className="flex space-x-2">
              <Input
                id="discount-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Introduce tu código"
                className="flex-grow"
                disabled={loading || !!appliedDiscount}
              />
              {appliedDiscount ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={removeDiscount}
                  className="shrink-0"
                  disabled={loading}
                >
                  Quitar
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={validateCode}
                  className="bg-gold text-black hover:bg-black hover:text-white shrink-0"
                  disabled={loading}
                >
                  {loading ? "..." : "Aplicar"}
                </Button>
              )}
            </div>
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          {success && <div className="text-green-600 text-sm">{success}</div>}


        </div>
      </CardContent>
    </Card>
  )
}

export default DiscountInput
