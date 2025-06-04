import { neon } from "@neondatabase/serverless"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, Users, TrendingUp, Calendar } from "lucide-react"

const sql = neon(process.env.DATABASE_URL!)

async function getAnalytics() {
  try {
    // ✅ ESTADÍSTICAS BÁSICAS
    const stats = await sql`
      SELECT 
        page_type,
        COUNT(*) as total_visits,
        COUNT(DISTINCT visitor_ip) as unique_visitors
      FROM page_analytics 
      WHERE visited_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY page_type
    `

    // ✅ ACTIVIDAD DIARIA
    const dailyStats = await sql`
      SELECT 
        DATE(visited_at) as date,
        page_type,
        COUNT(*) as visits,
        COUNT(DISTINCT visitor_ip) as unique_visitors
      FROM page_analytics 
      WHERE visited_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(visited_at), page_type
      ORDER BY date DESC, page_type
    `

    // ✅ ÚLTIMAS VISITAS
    const recentVisits = await sql`
      SELECT 
        page_type,
        page_url,
        visitor_ip,
        visited_at
      FROM page_analytics 
      ORDER BY visited_at DESC 
      LIMIT 10
    `

    return { stats, dailyStats, recentVisits }
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return { stats: [], dailyStats: [], recentVisits: [] }
  }
}

export default async function AnalyticsPage() {
  const { stats, dailyStats, recentVisits } = await getAnalytics()

  const homeStats = stats.find((s) => s.page_type === "home")
  const reservarStats = stats.find((s) => s.page_type === "reservar")

  const homeVisitors = Number(homeStats?.unique_visitors || 0)
  const reservarVisitors = Number(reservarStats?.unique_visitors || 0)
  const conversionRate = homeVisitors > 0 ? ((reservarVisitors / homeVisitors) * 100).toFixed(1) : "0"

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">📊 Analíticas OroBoats</h1>
        <Badge variant="outline" className="text-sm">
          Últimos 30 días
        </Badge>
      </div>

      {/* ✅ ESTADÍSTICAS PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">🏠 Visitas Home</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{homeStats?.total_visits || 0}</div>
            <p className="text-xs text-muted-foreground">{homeStats?.unique_visitors || 0} visitantes únicos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">📋 Páginas Reservar</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reservarStats?.total_visits || 0}</div>
            <p className="text-xs text-muted-foreground">{reservarStats?.unique_visitors || 0} visitantes únicos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">📈 Conversión</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {reservarVisitors} de {homeVisitors} fueron a reservar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">📅 Total Datos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentVisits.length > 0 ? "✅" : "❌"}</div>
            <p className="text-xs text-muted-foreground">{recentVisits.length > 0 ? "Funcionando" : "Sin datos"}</p>
          </CardContent>
        </Card>
      </div>

      {/* ✅ ACTIVIDAD DIARIA */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Actividad Últimos 7 Días</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyStats.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay datos de los últimos 7 días</p>
              <p className="text-sm text-gray-400 mt-2">Visita tu página web para generar datos de prueba</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dailyStats.map((day, index) => (
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ✅ ÚLTIMAS VISITAS */}
      <Card>
        <CardHeader>
          <CardTitle>🕐 Últimas Visitas</CardTitle>
        </CardHeader>
        <CardContent>
          {recentVisits.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay visitas registradas</p>
              <p className="text-sm text-gray-400 mt-2">Asegúrate de que la tabla se creó correctamente</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentVisits.map((visit, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-3">
                    <Badge variant={visit.page_type === "home" ? "default" : "secondary"} className="text-xs">
                      {visit.page_type === "home" ? "🏠" : "📋"}
                    </Badge>
                    <span className="text-sm">{visit.page_url}</span>
                    <span className="text-xs text-gray-500">{visit.visitor_ip}</span>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(visit.visited_at).toLocaleString("es-ES")}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ✅ INSTRUCCIONES */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">💡 Cómo probar</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              Visita tu página principal: <code className="bg-blue-100 px-1 rounded">https://oroboats.com/</code>
            </li>
            <li>
              Visita una página de reserva:{" "}
              <code className="bg-blue-100 px-1 rounded">https://oroboats.com/reservar/1</code>
            </li>
            <li>Espera 1-2 minutos y recarga esta página</li>
            <li>Deberías ver las visitas registradas arriba</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
