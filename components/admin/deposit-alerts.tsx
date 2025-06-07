"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock, CheckCircle } from "lucide-react"

export function DepositAlerts() {
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkPendingDeposits()
  }, [])

  const checkPendingDeposits = async () => {
    try {
      const response = await fetch("/api/bookings")
      const data = await response.json()

      if (Array.isArray(data)) {
        // Filtrar reservas con fianza pendiente
        const pending = data
          .filter((item) => Number(item.booking.securityDeposit) > 0 && item.booking.inspectionStatus === "pending")
          .map((item) => ({
            id: item.booking.id,
            customer: item.booking.customerName,
            date: new Date(item.booking.bookingDate).toLocaleDateString("es-ES"),
            amount: item.booking.securityDeposit,
          }))

        setPendingDeposits(pending)
      }
    } catch (error) {
      console.error("Error checking deposits:", error)
    }
  }

  const runCleanup = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/deposits/cleanup", { method: "POST" })
      const data = await response.json()

      if (data.success) {
        alert(`✅ Procesadas ${data.processed} fianzas expiradas`)
        checkPendingDeposits() // Refrescar lista
      }
    } catch (error) {
      console.error("Error running cleanup:", error)
      alert("❌ Error al procesar fianzas")
    } finally {
      setLoading(false)
    }
  }

  if (pendingDeposits.length === 0) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4 flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-green-800">Todas las fianzas están al día</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-yellow-50 border-yellow-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-yellow-800">
          <AlertTriangle className="h-5 w-5 mr-2" />
          Fianzas Pendientes de Inspección
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pendingDeposits.map((deposit) => (
            <div key={deposit.id} className="flex justify-between items-center p-3 bg-white rounded border">
              <div>
                <div className="font-medium">
                  Reserva #{deposit.id} - {deposit.customer}
                </div>
                <div className="text-sm text-gray-600 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {deposit.date} • €{deposit.amount}
                </div>
              </div>
              <Badge className="bg-yellow-500 text-white">Pendiente</Badge>
            </div>
          ))}

          <div className="pt-3 border-t">
            <Button onClick={runCleanup} disabled={loading} className="w-full bg-yellow-600 hover:bg-yellow-700">
              {loading ? "Procesando..." : "Auto-Procesar Fianzas Expiradas"}
            </Button>
            <p className="text-xs text-gray-600 mt-2 text-center">
              Las fianzas de más de 7 días se devolverán automáticamente
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
