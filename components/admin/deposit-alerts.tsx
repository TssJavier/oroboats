"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock, CheckCircle, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"

export function DepositAlerts() {
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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
            createdAt: new Date(item.booking.createdAt),
            daysAgo: Math.floor((Date.now() - new Date(item.booking.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
          }))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) // Más recientes primero

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
      } else {
        alert("ℹ️ No hay fianzas expiradas para procesar")
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
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-800">Todas las fianzas están al día</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/fianzas")}
            className="text-green-700 border-green-300 hover:bg-green-100"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Ver Fianzas
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-yellow-50 border-yellow-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-yellow-800">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Fianzas Pendientes ({pendingDeposits.length})
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/fianzas")}
            className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Gestionar Todas
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Lista con scroll - máximo 3 visibles */}
          <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
            {pendingDeposits.map((deposit) => (
              <div
                key={deposit.id}
                className="flex justify-between items-center p-3 bg-white rounded border hover:shadow-sm transition-shadow"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    Reserva #{deposit.id} - {deposit.customer}
                  </div>
                  <div className="text-xs text-gray-600 flex items-center mt-1">
                    <Clock className="h-3 w-3 mr-1" />
                    {deposit.date} • €{deposit.amount}
                    {deposit.daysAgo > 0 && (
                      <span className="ml-2 text-orange-600">
                        ({deposit.daysAgo} día{deposit.daysAgo !== 1 ? "s" : ""})
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {deposit.daysAgo >= 7 && <Badge className="bg-orange-500 text-white text-xs">Expirada</Badge>}
                  <Badge className="bg-yellow-500 text-white text-xs">Pendiente</Badge>
                </div>
              </div>
            ))}
          </div>

          {/* Botones de acción */}
          <div className="pt-3 border-t space-y-2">
            <Button
              onClick={runCleanup}
              disabled={loading}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
              size="sm"
            >
              {loading ? "Procesando..." : "Auto-Procesar Fianzas Expiradas"}
            </Button>
            <p className="text-xs text-gray-600 text-center">
              Las fianzas de más de 7 días se devolverán automáticamente
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
