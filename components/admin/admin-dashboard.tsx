"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { VehicleManagement } from "./vehicle-management"
import { BookingManagement } from "./booking-management"
import { SettingsManagement } from "./settings-management"
import { AdminStats } from "./admin-stats"
import { AdminHeader } from "./admin-header"
import { PricingSettings } from "./pricing-settings"
import { DepositAlerts } from "./deposit-alerts"
import {
  Ship,
  Calendar,
  Settings,
  BarChart3,
  DollarSign,
  Shield,
  Percent,
  TrendingUp,
  ExternalLink,
} from "lucide-react"
import { useRouter } from "next/navigation"

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("stats")
  const router = useRouter()

  const quickActions = [
    {
      title: "Gestión de Fianzas",
      description: "Administra fianzas de seguridad y inspecciones",
      icon: Shield,
      href: "/admin/fianzas",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "Códigos de Descuento",
      description: "Crear y gestionar códigos promocionales",
      icon: Percent,
      href: "/admin/codigos",
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      title: "Analytics Avanzado",
      description: "Métricas detalladas y reportes",
      icon: TrendingUp,
      href: "/admin/analytics",
      color: "bg-purple-500 hover:bg-purple-600",
    },
  ]

  return (
    <section className="py-24 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdminHeader />

        {/* Alertas de fianzas pendientes */}
        <div className="mb-8">
          <DepositAlerts />
        </div>

        {/* Accesos Rápidos */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-black mb-6">Accesos Rápidos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action) => (
              <Card
                key={action.href}
                className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-gray-300"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <action.icon className="h-8 w-8 text-gray-600" />
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-2">{action.title}</CardTitle>
                  <CardDescription className="mb-4">{action.description}</CardDescription>
                  <Button onClick={() => router.push(action.href)} className={`w-full text-white ${action.color}`}>
                    Acceder
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-5xl mx-auto grid-cols-5 mb-16 bg-white border border-gray-200 h-16 p-2">
            <TabsTrigger
              value="stats"
              className="data-[state=active]:bg-black data-[state=active]:text-white text-gray-600 hover:text-black transition-colors text-lg font-semibold h-12 rounded-lg"
            >
              <BarChart3 className="h-5 w-5 mr-3" />
              Estadísticas
            </TabsTrigger>
            <TabsTrigger
              value="vehicles"
              className="data-[state=active]:bg-black data-[state=active]:text-white text-gray-600 hover:text-black transition-colors text-lg font-semibold h-12 rounded-lg"
            >
              <Ship className="h-5 w-5 mr-3" />
              Productos
            </TabsTrigger>
            <TabsTrigger
              value="pricing"
              className="data-[state=active]:bg-black data-[state=active]:text-white text-gray-600 hover:text-black transition-colors text-lg font-semibold h-12 rounded-lg"
            >
              <DollarSign className="h-5 w-5 mr-3" />
              Precios
            </TabsTrigger>
            <TabsTrigger
              value="bookings"
              className="data-[state=active]:bg-black data-[state=active]:text-white text-gray-600 hover:text-black transition-colors text-lg font-semibold h-12 rounded-lg"
            >
              <Calendar className="h-5 w-5 mr-3" />
              Reservas
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-black data-[state=active]:text-white text-gray-600 hover:text-black transition-colors text-lg font-semibold h-12 rounded-lg"
            >
              <Settings className="h-5 w-5 mr-3" />
              Configuración
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="mt-0">
            <AdminStats />
          </TabsContent>

          <TabsContent value="vehicles" className="mt-0">
            <VehicleManagement />
          </TabsContent>

          <TabsContent value="pricing" className="mt-0">
            <PricingSettings />
          </TabsContent>

          <TabsContent value="bookings" className="mt-0">
            <BookingManagement />
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <SettingsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}
