"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function DiscountTest() {
  const [discountCode, setDiscountCode] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testDiscount = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/discount/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: discountCode,
          totalPrice: 100, // Precio de prueba
        }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: "Error de conexión" })
    } finally {
      setLoading(false)
    }
  }

  const testBooking = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: "1",
          customerName: "Test User",
          customerEmail: "test@example.com",
          customerPhone: "+34600000000",
          bookingDate: "2024-12-25",
          startTime: "10:00",
          endTime: "12:00",
          duration: "2hour",
          totalPrice: 100,
          discountCode: discountCode || undefined,
          securityDeposit: 50,
        }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: "Error creando reserva" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white border rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">🧪 Test de Códigos de Descuento</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Código de descuento:</label>
          <input
            type="text"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
            placeholder="ADMIN100"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={testDiscount} disabled={loading} className="flex-1">
            {loading ? "⏳" : "🔍"} Validar Código
          </Button>
          <Button onClick={testBooking} disabled={loading} className="flex-1">
            {loading ? "⏳" : "📅"} Test Reserva
          </Button>
        </div>

        {result && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <h4 className="font-medium mb-2">Resultado:</h4>
            <pre className="text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>


    </div>
  )
}
