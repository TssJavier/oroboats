"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

function DiscountTest() {
  const [discountCode, setDiscountCode] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Generar fecha futura (mañana)
  const getTomorrowDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split("T")[0] // YYYY-MM-DD
  }

  // Generar hora futura (en 2 horas)
  const getFutureTime = () => {
    const future = new Date()
    future.setHours(future.getHours() + 2)
    return future.toTimeString().slice(0, 5) // HH:MM
  }

  const testDiscount = async () => {
    setLoading(true)
    try {
      console.log("🧪 Testing discount code:", discountCode)

      const response = await fetch("/api/discount/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: discountCode,
          amount: 100,
        }),
      })

      const data = await response.json()
      console.log("📝 Response:", data)
      setResult(data)
    } catch (error) {
      console.error("❌ Error:", error)
      setResult({ error: "Error de conexión" })
    } finally {
      setLoading(false)
    }
  }

  const testBooking = async () => {
    setLoading(true)
    try {
      const futureDate = getTomorrowDate()
      const startTime = getFutureTime()
      const endTime = "18:00"

      // Crear time_slot combinando horas
      const timeSlot = `${startTime}-${endTime}`

      console.log("🧪 Testing booking with:", { futureDate, timeSlot })

      // ✅ USAR LA NUEVA RUTA DE TEST
      const response = await fetch("/api/test-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: 1,
          customerName: "Test User",
          customerEmail: "test@example.com",
          customerPhone: "+34600000000",
          bookingDate: futureDate,
          startTime: startTime,
          endTime: endTime,
          timeSlot: timeSlot, // ✅ Campo obligatorio
          duration: "2hour",
          totalPrice: 100,
          discountCode: discountCode || undefined,
          discountAmount: result?.discountAmount || 0,
          originalPrice: result?.discountAmount ? 100 : undefined,
          securityDeposit: 50,
          status: "pending",
          paymentStatus: "pending",
        }),
      })

      const data = await response.json()
      console.log("📝 Booking response:", data)
      setResult(data)
    } catch (error) {
      console.error("❌ Booking error:", error)
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
            placeholder=""
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
            <h4 className="font-medium mb-2">{result.error ? "❌ Error:" : "✅ Resultado:"}</h4>
            <pre className="text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <h4 className="font-medium mb-2">📋 Códigos para probar:</h4>
        <ul className="space-y-1">

        </ul>

        <div className="mt-4 p-2 bg-green-50 rounded text-xs">
          <p>
            ✅ <strong>Sistema de descuentos:</strong> FUNCIONANDO
          </p>
          <p>
            ✅ <strong>Reservas:</strong> Usando API directa
          </p>
        </div>
      </div>
    </div>
  )
}

export default function TestDescuentosPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold text-center mb-8">🧪 Test de Sistema de Descuentos</h1>
      <DiscountTest />
    </div>
  )
}
