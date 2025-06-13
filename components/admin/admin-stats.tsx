"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Euro, Calendar, Clock, TrendingUp, Ship, Filter, RefreshCw } from "lucide-react"

interface Booking {
  id: number
  customerName: string
  customerEmail: string
  totalPrice: string
  status: string
  createdAt: string
  isTestBooking?: boolean
  isManualBooking?: boolean
  salesPerson?: string
}

interface AdminStatsData {
  totalBookings: number
  totalRevenue: number
  pendingBookings: number
  todayBookings: number
  recentBookings: Booking[]
  testBookingsCount: number
  manualBookingsCount: number
  onlineBookingsCount: number
}

interface DateFilter {
  startDate: string
  endDate: string
  preset: string
}

export function AdminStats() {
  const [stats, setStats] = useState<AdminStatsData>({
    totalBookings: 0,
    totalRevenue: 0,
    pendingBookings: 0,
    todayBookings: 0,
    recentBookings: [],
    testBookingsCount: 0,
    manualBookingsCount: 0,
    onlineBookingsCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    startDate: "",
    endDate: "",
    preset: "all",
  })

  useEffect(() => {
    fetchStats()
  }, [dateFilter])

  // Función para establecer presets de fecha
  const setDatePreset = (preset: string) => {
    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    let startDate = ""
    let endDate = ""

    switch (preset) {
      case "today":
        startDate = startOfToday.toISOString().split("T")[0]
        endDate = startOfToday.toISOString().split("T")[0]
        break
      case "week":
        const startOfWeek = new Date(startOfToday)
        startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay())
        startDate = startOfWeek.toISOString().split("T")[0]
        endDate = today.toISOString().split("T")[0]
        break
      case "month":
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        startDate = startOfMonth.toISOString().split("T")[0]
        endDate = today.toISOString().split("T")[0]
        break
      case "year":
        const startOfYear = new Date(today.getFullYear(), 0, 1)
        startDate = startOfYear.toISOString().split("T")[0]
        endDate = today.toISOString().split("T")[0]
        break
      case "all":
      default:
        startDate = ""
        endDate = ""
        break
    }

    setDateFilter({
      startDate,
      endDate,
      preset,
    })
  }

  const fetchStats = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()

      // Añadir parámetros de fecha si están definidos
      if (dateFilter.startDate) {
        params.append("startDate", dateFilter.startDate)
      }
      if (dateFilter.endDate) {
        params.append("endDate", dateFilter.endDate)
      }

      // Siempre excluir reservas de prueba
      params.append("excludeTest", "true")

      const response = await fetch(`/api/admin/stats?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setStats({
          totalBookings: data.totalBookings || 0,
          totalRevenue: data.totalRevenue || 0,
          pendingBookings: data.pendingBookings || 0,
          todayBookings: data.todayBookings || 0,
          recentBookings: data.recentBookings || [],
          testBookingsCount: data.testBookingsCount || 0,
          manualBookingsCount: data.manualBookingsCount || 0,
          onlineBookingsCount: data.onlineBookingsCount || 0,
        })
      } else {
        console.error("Failed to fetch stats:", response.statusText)
      }
    } catch (err) {
      console.error("Error fetching stats:", err)
    } finally {
      setLoading(false)
    }
  }

  const formatDateRange = () => {
    if (!dateFilter.startDate && !dateFilter.endDate) {
      return "Todos los datos"
    }

    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    }

    if (dateFilter.startDate === dateFilter.endDate) {
      return formatDate(dateFilter.startDate)
    }

    return `${formatDate(dateFilter.startDate)} - ${formatDate(dateFilter.endDate)}`
  }

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Filtros skeleton */}
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Filtros de fecha */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-black flex items-center">
            <Filter className="h-5 w-5 text-gold mr-3" />
            Filtros de Fecha
          </CardTitle>
          <CardDescription>Filtra las estadísticas por rango de fechas • {formatDateRange()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            {/* Presets rápidos */}
            <div>
              <Label htmlFor="preset">Período</Label>
              <Select value={dateFilter.preset} onValueChange={(value) => setDatePreset(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los datos</SelectItem>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="week">Esta semana</SelectItem>
                  <SelectItem value="month">Este mes</SelectItem>
                  <SelectItem value="year">Este año</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fecha inicio */}
            <div>
              <Label htmlFor="startDate">Fecha inicio</Label>
              <Input
                id="startDate"
                type="date"
                value={dateFilter.startDate}
                onChange={(e) =>
                  setDateFilter((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                    preset: "custom",
                  }))
                }
              />
            </div>

            {/* Fecha fin */}
            <div>
              <Label htmlFor="endDate">Fecha fin</Label>
              <Input
                id="endDate"
                type="date"
                value={dateFilter.endDate}
                onChange={(e) =>
                  setDateFilter((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                    preset: "custom",
                  }))
                }
              />
            </div>

            {/* Botón limpiar */}
            <Button
              variant="outline"
              onClick={() => setDatePreset("all")}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Limpiar
            </Button>

            {/* Botón actualizar */}
            <Button onClick={fetchStats} className="bg-gold text-black hover:bg-gold/90">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border border-gray-200 hover:border-gold hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Reservas</CardTitle>
            <Calendar className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{stats.totalBookings}</div>
            <p className="text-xs text-gray-500">
              {stats.manualBookingsCount} manuales • {stats.onlineBookingsCount} online
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 hover:border-gold hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Ingresos Totales</CardTitle>
            <Euro className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">€{(stats.totalRevenue || 0).toFixed(2)}</div>
            <p className="text-xs text-gray-500">Pagos confirmados (sin pruebas)</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 hover:border-gold hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{stats.pendingBookings}</div>
            <p className="text-xs text-gray-500">Por confirmar</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 hover:border-gold hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Hoy</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{stats.todayBookings}</div>
            <p className="text-xs text-gray-500">Reservas de hoy</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-black flex items-center">
            <Calendar className="h-5 w-5 text-gold mr-3" />
            Reservas Recientes
          </CardTitle>
          <CardDescription>Las últimas reservas realizadas (excluyendo pruebas)</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentBookings.length > 0 ? (
            <div className="space-y-4">
              {stats.recentBookings.map((booking, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center">
                      <Ship className="h-5 w-5 text-black" />
                    </div>
                    <div>
                      <p className="font-semibold text-black">{booking.customerName}</p>
                      <p className="text-sm text-gray-600">{booking.customerEmail}</p>
                      {booking.salesPerson && <p className="text-xs text-gray-500">Comercial: {booking.salesPerson}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gold">€{booking.totalPrice}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        className={
                          booking.status === "confirmed"
                            ? "bg-green-600 text-white"
                            : booking.status === "pending"
                              ? "bg-yellow-600 text-white"
                              : "bg-gray-600 text-white"
                        }
                      >
                        {booking.status}
                      </Badge>
                      {booking.isManualBooking && <Badge className="bg-blue-600 text-white text-xs">Manual</Badge>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay reservas en el período seleccionado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
