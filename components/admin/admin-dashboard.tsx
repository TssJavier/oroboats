"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VehicleManagement } from "./vehicle-management"
import { BookingManagement } from "./booking-management"
import { SettingsManagement } from "./settings-management"
import { AdminStats } from "./admin-stats"
import { AdminHeader } from "./admin-header"
import { Ship, Calendar, Settings, BarChart3 } from "lucide-react"

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("stats")

  return (
    <section className="py-24 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdminHeader />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-4xl mx-auto grid-cols-4 mb-16 bg-white border border-gray-200 h-16 p-2">
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
