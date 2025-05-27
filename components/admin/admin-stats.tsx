"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Euro, Calendar, Clock, TrendingUp, Ship } from "lucide-react"

interface Booking {
  id: number
  customerName: string
  customerEmail: string
  totalPrice: string
  status: string
  createdAt: string
}

interface AdminStatsData {
  totalBookings: number
  totalRevenue: number
  pendingBookings: number
  todayBookings: number
  recentBookings: Booking[]
}

export function AdminStats() {
  const [stats, setStats] = useState<AdminStatsData>({
    totalBookings: 0,
    totalRevenue: 0,
    pendingBookings: 0,
    todayBookings: 0,
    recentBookings: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats")
      if (response.ok) {
        const data = await response.json()
        setStats({
          totalBookings: data.totalBookings || 0,
          totalRevenue: data.totalRevenue || 0,
          pendingBookings: data.pendingBookings || 0,
          todayBookings: data.todayBookings || 0,
          recentBookings: data.recentBookings || [],
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

  if (loading) {
    return (
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
    )
  }

  if (!stats) return <div>Error cargando estadísticas</div>

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border border-gray-200 hover:border-gold hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Reservas</CardTitle>
            <Calendar className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{stats.totalBookings}</div>
            <p className="text-xs text-gray-500">Todas las reservas</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 hover:border-gold hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Ingresos Totales</CardTitle>
            <Euro className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">€{(stats.totalRevenue || 0).toFixed(2)}</div>
            <p className="text-xs text-gray-500">Pagos confirmados</p>
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
          <CardDescription>Las últimas reservas realizadas</CardDescription>
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
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gold">€{booking.totalPrice}</p>
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
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay reservas recientes</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
