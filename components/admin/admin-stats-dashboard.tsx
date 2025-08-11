"use client"

import { Button } from "@/components/ui/button"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Calendar, Clock, AlertTriangle } from "lucide-react"

interface BookingStats {
  totalBookings: number
  totalRevenue: number
  pendingBookings: number
  todayBookings: number
  testBookingsCount: number
  manualBookingsCount: number
  onlineBookingsCount: number
  recentBookings: Array<{
    id: number
    customerName: string
    customerEmail: string
    totalPrice: string
    status: string
    createdAt: string
    isTestBooking: boolean
    isManualBooking: boolean
    salesPerson?: string
  }>
}

export function AdminStatsDashboard() {
  const [stats, setStats] = useState<BookingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      // ✅ CORREGIDO: Llamar a la ruta de API correcta
      const response = await fetch("/api/admin/stats")
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`HTTP error! Status: ${response.status}. Details: ${errorData.error || "Unknown error"}`)
      }
      const result: BookingStats = await response.json()
      setStats(result)
      console.log("✅ Client: Booking stats received and set:", result)
    } catch (err) {
      console.error("❌ Client: Error fetching booking stats:", err)
      setError(err instanceof Error ? err.message : "Error al cargar las estadísticas de reservas.")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-600 text-white"
      case "pending":
        return "bg-yellow-600 text-white"
      case "cancelled":
        return "bg-red-700 text-white"
      case "completed":
        return "bg-green-700 text-white"
      default:
        return "bg-gray-600 text-white"
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        <p>Error: {error}</p>
        <p>Por favor, revisa los logs del servidor y la conexión a la base de datos.</p>
        <Button onClick={fetchStats} className="mt-4">
          Reintentar
        </Button>
      </div>
    )
  }

  if (!stats) {
    return <div className="text-center text-gray-500">No hay datos disponibles</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">Reservas reales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Ingresos de reservas completadas/confirmadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reservas Pendientes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingBookings}</div>
            <p className="text-xs text-muted-foreground">Esperando confirmación</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reservas Hoy</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayBookings}</div>
            <p className="text-xs text-muted-foreground">Reservas para hoy</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Tipo de Reservas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded-md">
              <span className="text-sm font-medium">Online</span>
              <Badge className="bg-blue-600 text-white">{stats.onlineBookingsCount}</Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-orange-50 rounded-md">
              <span className="text-sm font-medium">Manuales</span>
              <Badge className="bg-orange-600 text-white">{stats.manualBookingsCount}</Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-purple-50 rounded-md">
              <span className="text-sm font-medium">De Prueba</span>
              <Badge className="bg-purple-600 text-white">{stats.testBookingsCount}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimas 10 Reservas</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentBookings.length === 0 ? (
              <p className="text-gray-500 text-center">No hay reservas recientes.</p>
            ) : (
              <div className="space-y-3">
                {stats.recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-semibold text-sm">{booking.customerName}</div>
                      <div className="text-xs text-gray-600">
                        €{booking.totalPrice} - {new Date(booking.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(booking.status)} text-xs`}>{booking.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
