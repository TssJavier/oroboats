"use client"

import { CardContent } from "@/components/ui/card"
import { CardTitle } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import { Card } from "@/components/ui/card"
import dynamic from "next/dynamic" // Importar dynamic de next/dynamic

// Importar AnalyticsDashboard dinámicamente con ssr: false usando ruta relativa
const AnalyticsDashboard = dynamic(
  () => import("../../../components/admin/analytics-dashboard").then((mod) => mod.default), // ✅ CORREGIDO: Usar mod.default
  {
    ssr: false, // Esto asegura que el componente solo se renderice en el cliente
    loading: () => (
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
    ),
  },
)

export default function AnalyticsPage() {
  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
      <div>
        <h2 className="text-3xl md:text-4xl font-bold text-black">Analíticas OroBoats</h2>
        <p className="text-lg text-gray-600 mt-2">Visión general del rendimiento de tu sitio web.</p>
      </div>
      <AnalyticsDashboard /> {/* Renderizar el componente de analíticas */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Visitas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            No hay visitas registradas. Asegúrate de que la tabla se creó correctamente.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
