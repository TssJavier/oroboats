"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, Users, TrendingUp, Calendar } from "lucide-react"

interface AnalyticsData {
  general: Array<{
    page_type: string
    total_visits: number
    unique_visitors: number
  }>
  daily: Array<{
    date: string
    page_type: string
    visits: number
    unique_visitors: number
  }>
  conversion: {
    home_visitors: number
    reservar_visitors: number
    conversion_rate: number
  }
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/analytics/stats")
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
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

  if (!data) {
    return <div className="text-center text-gray-500">No hay datos disponibles</div>
  }

  const homeStats = data.general.find((item) => item.page_type === "home")
  const reservarStats = data.general.find((item) => item.page_type === "reservar")

  return (
    <div className="space-y-6">
      {/* ✅ ESTADÍSTICAS PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitas Home</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{homeStats?.total_visits || 0}</div>
            <p className="text-xs text-muted-foreground">{homeStats?.unique_visitors || 0} visitantes únicos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Páginas Reservar</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reservarStats?.total_visits || 0}</div>
            <p className="text-xs text-muted-foreground">{reservarStats?.unique_visitors || 0} visitantes únicos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa Conversión</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.conversion.conversion_rate}%</div>
            <p className="text-xs text-muted-foreground">
              {data.conversion.reservar_visitors} de {data.conversion.home_visitors} visitaron reservar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Período</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">30d</div>
            <p className="text-xs text-muted-foreground">Últimos 30 días</p>
          </CardContent>
        </Card>
      </div>

      {/* ✅ ESTADÍSTICAS DIARIAS */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad Últimos 7 Días</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.daily.length === 0 ? (
              <p className="text-gray-500 text-center">No hay datos de los últimos 7 días</p>
            ) : (
              data.daily.map((day, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant={day.page_type === "home" ? "default" : "secondary"}>
                      {day.page_type === "home" ? "🏠 Home" : "📋 Reservar"}
                    </Badge>
                    <span className="text-sm text-gray-600">{day.date}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{day.visits} visitas</div>
                    <div className="text-xs text-gray-500">{day.unique_visitors} únicos</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
