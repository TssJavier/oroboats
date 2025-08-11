"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js"
import "chartjs-adapter-date-fns"
import { Home, BookOpen, TrendingUp, CalendarDays, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

// Registrar los componentes de Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, TimeScale)

// Definir interfaces para la estructura de datos esperada de la API
interface GeneralStat {
  page_type: string
  total_visits: number // Convertido a number
  unique_visitors: number // Convertido a number
}

interface DailyStat {
  date: string
  page_type: string
  visits: number // Convertido a number
  unique_visitors: number // Convertido a number
}

interface TopPage {
  page_url: string
  total_visits: number // Convertido a number
  unique_visitors: number // Convertido a number
}

interface HourlyStat {
  hour: number // Convertido a number
  total_visits: number // Convertido a number
  unique_visitors: number // Convertido a number
}

interface AnalyticsData {
  generalStats: GeneralStat[] // Ahora es un array
  dailyStats: DailyStat[]
  topPages: TopPage[]
  hourlyStats: HourlyStat[]
}

export default function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false) // Estado para controlar el montaje

  useEffect(() => {
    setIsMounted(true) // Marcar como montado en el cliente
    fetchAnalytics()
  }, [])

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/analytics") // La cookie HttpOnly se enviará automáticamente
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      const data: AnalyticsData = await response.json()

      // Procesar los datos para asegurar que los números sean números
      const processedData: AnalyticsData = {
        generalStats: data.generalStats.map((s) => ({
          ...s,
          total_visits: typeof s.total_visits === "string" ? Number.parseInt(s.total_visits) : s.total_visits,
          unique_visitors: typeof s.unique_visitors === "string" ? Number.parseInt(s.unique_visitors) : s.unique_visitors,
        })) as GeneralStat[], // Forzar el tipo después de la conversión
        dailyStats: data.dailyStats.map((d) => ({
          ...d,
          visits: typeof d.visits === "string" ? Number.parseInt(d.visits) : d.visits,
          unique_visitors: typeof d.unique_visitors === "string" ? Number.parseInt(d.unique_visitors) : d.unique_visitors,
        })) as DailyStat[],
        topPages: data.topPages.map((p) => ({
          ...p,
          total_visits: typeof p.total_visits === "string" ? Number.parseInt(p.total_visits) : p.total_visits,
          unique_visitors: typeof p.unique_visitors === "string" ? Number.parseInt(p.unique_visitors) : p.unique_visitors,
        })) as TopPage[],
        hourlyStats: data.hourlyStats.map((h) => ({
          ...h,
          hour: typeof h.hour === "string" ? Number.parseInt(h.hour) : h.hour, // Convertir la hora a número
          total_visits: typeof h.total_visits === "string" ? Number.parseInt(h.total_visits) : h.total_visits,
          unique_visitors: typeof h.unique_visitors === "string" ? Number.parseInt(h.unique_visitors) : h.unique_visitors,
        })) as HourlyStat[],
      }

      setAnalyticsData(processedData)
      toast.success("Datos de analíticas actualizados.")
    } catch (e) {
      console.error("Error fetching analytics data:", e)
      setError(
        `Error al cargar los datos de analíticas: ${e instanceof Error ? e.message : String(e)}. Intenta refrescar.`,
      )
      toast.error("Error al cargar los datos de analíticas.")
    } finally {
      setLoading(false)
    }
  }, [])

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </CardContent>
          </Card>
        ))}
        <Card className="md:col-span-2 lg:col-span-4 animate-pulse h-[300px]"></Card>
        <Card className="md:col-span-2 lg:col-span-2 animate-pulse h-[250px]"></Card>
        <Card className="md:col-span-2 lg:col-span-2 animate-pulse h-[250px]"></Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </CardContent>
          </Card>
        ))}
        <Card className="md:col-span-2 lg:col-span-4 animate-pulse h-[300px]"></Card>
        <Card className="md:col-span-2 lg:col-span-2 animate-pulse h-[250px]"></Card>
        <Card className="md:col-span-2 lg:col-span-2 animate-pulse h-[250px]"></Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="col-span-full bg-red-50 border border-red-200">
        <CardContent className="text-center py-4 text-red-800">
          <p>{error}</p>
          <Button onClick={fetchAnalytics} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" /> Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!analyticsData) {
    return (
      <Card className="col-span-full bg-gray-50 border border-gray-200">
        <CardContent className="text-center py-8 text-gray-600">
          <p>No hay datos de analíticas disponibles.</p>
          <Button onClick={fetchAnalytics} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" /> Cargar Datos
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Procesar datos para las tarjetas de resumen
  const homeStats =
    analyticsData.generalStats.find((s) => s.page_type === "home") ||
    ({ total_visits: 0, unique_visitors: 0 } as GeneralStat)
  const bookingStats =
    analyticsData.generalStats.find((s) => s.page_type === "reservar") ||
    ({ total_visits: 0, unique_visitors: 0 } as GeneralStat)

  const totalUniqueVisitors = homeStats.unique_visitors
  const bookingUniqueVisitors = bookingStats.unique_visitors
  const conversionRate = totalUniqueVisitors > 0 ? (bookingUniqueVisitors / totalUniqueVisitors) * 100 : 0

  // Preparar datos para el gráfico de visitas diarias
  const dailyLabels = analyticsData.dailyStats
    .filter((d) => d.page_type === "home")
    .map((d) => new Date(d.date).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }))
  const dailyVisits = analyticsData.dailyStats.filter((d) => d.page_type === "home").map((d) => d.visits)
  const dailyUniqueVisitors = analyticsData.dailyStats
    .filter((d) => d.page_type === "home")
    .map((d) => d.unique_visitors)

  const dailyChartData = {
    labels: dailyLabels,
    datasets: [
      {
        label: "Visitas Totales",
        data: dailyVisits,
        borderColor: "rgb(59, 130, 246)", // Azul vibrante
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        tension: 0.3,
        fill: false,
      },
      {
        label: "Visitantes Únicos",
        data: dailyUniqueVisitors,
        borderColor: "rgb(34, 197, 94)", // Verde brillante
        backgroundColor: "rgba(34, 197, 94, 0.5)",
        tension: 0.3,
        fill: false,
      },
    ],
  }

  const dailyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Visitas Diarias (Últimos 30 Días)",
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        type: "category" as const, // Usar 'category' para etiquetas de fecha formateadas
        title: {
          display: true,
          text: "Fecha",
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Número de Visitas",
        },
      },
    },
  }

  // Preparar datos para el gráfico de visitas por hora
  const hourlyLabels = analyticsData.hourlyStats.map((d) => `${d.hour}:00`)
  const hourlyVisits = analyticsData.hourlyStats.map((d) => d.total_visits)
  const hourlyUniqueVisitors = analyticsData.hourlyStats.map((d) => d.unique_visitors)

  const hourlyChartData = {
    labels: hourlyLabels,
    datasets: [
      {
        label: "Visitas Totales",
        data: hourlyVisits,
        backgroundColor: "rgba(168, 85, 247, 0.7)", // Púrpura
        borderColor: "rgb(168, 85, 247)",
        borderWidth: 1,
      },
      {
        label: "Visitantes Únicos",
        data: hourlyUniqueVisitors,
        backgroundColor: "rgba(251, 191, 36, 0.7)", // Amarillo/Oro
        borderColor: "rgb(251, 191, 36)",
        borderWidth: 1,
      },
    ],
  }

  const hourlyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Visitas por Hora (Últimas 24 Horas)",
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Hora del Día",
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Número de Visitas",
        },
      },
    },
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <Button onClick={fetchAnalytics} disabled={loading}>
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Cargando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" /> Refrescar Datos
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitas Home</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{homeStats.total_visits}</div>
            <p className="text-xs text-muted-foreground">{homeStats.unique_visitors} visitantes únicos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitas Reservar</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookingStats.total_visits}</div>
            <p className="text-xs text-muted-foreground">{bookingStats.unique_visitors} visitantes únicos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              {bookingUniqueVisitors} de {totalUniqueVisitors} visitaron reservar
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Período Analizado</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">30 Días</div>
            <p className="text-xs text-muted-foreground">Últimos 30 días de datos</p>
          </CardContent>
        </Card>
      </div>

      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>Visitas Diarias (Últimos 30 Días)</CardTitle>
          <p className="text-sm text-muted-foreground">Tendencia de visitas totales y visitantes únicos por día.</p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <Line data={dailyChartData} options={dailyChartOptions} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Visitas por Hora (Últimas 24 Horas)</CardTitle>
            <p className="text-sm text-muted-foreground">Distribución de visitas a lo largo del día.</p>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <Bar data={hourlyChartData} options={hourlyChartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Páginas Más Visitadas</CardTitle>
            <p className="text-sm text-muted-foreground">Las páginas más populares de tu sitio.</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analyticsData.topPages.length > 0 ? (
                analyticsData.topPages.map((page, index) => (
                  <li key={index} className="flex justify-between items-center text-sm">
                    <span className="font-medium">{page.page_url}</span>
                    <span className="text-muted-foreground">
                      {page.total_visits} visitas ({page.unique_visitors} únicos)
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-center text-gray-500 py-4">No hay datos de páginas.</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
