"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tag, CheckCircle, XCircle, Loader2 } from "lucide-react"
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
      const data = await response.json()

      if (response.ok && data.valid) {
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
        setError(data.message || "Código no válido")
        setAppliedDiscount(null)
        onDiscountApplied(null)
      }
    } catch (err) {
      console.error("Error validating discount code:", err)
      setError("Error al validar el código")
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
              <div className="relative flex-grow">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  id="discount-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Introduce tu código"
                  className="pl-9"
                  disabled={loading || !!appliedDiscount}
                />
              </div>
              {appliedDiscount ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={removeDiscount}
                  className="shrink-0"
                  disabled={loading}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Quitar
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={validateCode}
                  className="bg-gold text-black hover:bg-black hover:text-white shrink-0"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
                </Button>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-center text-red-500 text-sm">
              <XCircle className="h-4 w-4 mr-1" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center text-green-600 text-sm">
              <CheckCircle className="h-4 w-4 mr-1" />
              {success}
            </div>
          )}

          {/*<div className="text-xs text-gray-500">
            <p>Prueba estos códigos:</p>
            <ul className="list-disc list-inside mt-1">
              <li>VERANO2024: 15% de descuento</li>
              <li>ADMIN100: €100 de descuento</li>
              <li>BIENVENIDO: 10% de descuento</li>
            </ul>
          </div>*/}
        </div>
      </CardContent>
    </Card>
  )
}

// También exportar como default por si acaso
export default DiscountInput
