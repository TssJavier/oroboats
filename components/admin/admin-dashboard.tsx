"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { VehicleManagement } from "./vehicle-management"
import { BookingManagement } from "./booking-management"
import { SettingsManagement } from "./settings-management"
import { AdminStats } from "./admin-stats"
import { AdminHeader } from "./admin-header"
//import { DepositAlerts } from "./deposit-alerts"
import { UserManagement } from "./user-management"
import { BeachManagement } from "./beach-management" // ✅ Importar BeachManagement
import { HotelManagement } from "./hotel-management" // ✅ NUEVO: Importar HotelManagement
import {
  Ship,
  Calendar,
  Settings,
  BarChart3,
  Shield,
  Percent,
  TrendingUp,
  ExternalLink,
  Users,
  MapPin,
  Hotel,
} from "lucide-react"
import { useRouter } from "next/navigation"

interface User {
  email: string
  isAdmin: boolean
  role?: "admin" | "comercial"
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("stats")
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Obtener información del usuario actual
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data.user) // ✅ USAR data.user para mantener compatibilidad
      }
    } catch (error) {
      console.error("Error fetching current user:", error)
    }
  }

  // ✅ COMPATIBILIDAD: Verificar admin usando isAdmin O role
  //const isAdmin = currentUser?.isAdmin === true || currentUser?.role === "admin"

  const quickActions = [
    {
      title: "Gestión de Fianzas",
      description: "Administra fianzas de seguridad y inspecciones",
      icon: Shield,
      href: "/admin/fianzas",
      color: "bg-blue-500 hover:bg-blue-600",
      allowedRoles: ["admin", "comercial"],
    },
    {
      title: "Códigos de Descuento",
      description: "Crear y gestionar códigos promocionales",
      icon: Percent,
      href: "/admin/codigos",
      color: "bg-green-500 hover:bg-green-600",
      allowedRoles: ["admin"], // Solo admin
    },
    {
      title: "Analytics Avanzado",
      description: "Métricas detalladas y reportes",
      icon: TrendingUp,
      href: "/admin/analytics",
      color: "bg-purple-500 hover:bg-purple-600",
      allowedRoles: ["admin", "comercial"],
    },
  ]

  const tabOptions = [
    { value: "stats", label: "Estadísticas", icon: BarChart3, allowedRoles: ["admin", "comercial"] },
    { value: "vehicles", label: "Productos", icon: Ship, allowedRoles: ["admin", "comercial"] },
    { value: "bookings", label: "Reservas", icon: Calendar, allowedRoles: ["admin", "comercial"] },
    { value: "beaches", label: "Playas", icon: MapPin, allowedRoles: ["admin"] }, // ✅ NUEVO: Gestión de Playas
    { value: "hotels", label: "Hoteles", icon: Hotel, allowedRoles: ["admin"] }, // ✅ NUEVO: Gestión de Hoteles
    { value: "users", label: "Comerciales", icon: Users, allowedRoles: ["admin"] }, // Solo admin
    { value: "settings", label: "Configuración", icon: Settings, allowedRoles: ["admin", "comercial"] },
  ]

  // ✅ FILTRAR SEGÚN PERMISOS
  const userRole = currentUser?.role || (currentUser?.isAdmin ? "admin" : "comercial")

  const filteredQuickActions = quickActions.filter((action) => action.allowedRoles.includes(userRole))

  const filteredTabOptions = tabOptions.filter((tab) => tab.allowedRoles.includes(userRole))

  const getCurrentTabLabel = () => {
    const currentTab = filteredTabOptions.find((tab) => tab.value === activeTab)
    return currentTab ? currentTab.label : "Seleccionar sección"
  }

  // Si el tab actual no está permitido para el usuario, cambiar a stats
  useEffect(() => {
    if (currentUser && !filteredTabOptions.some((tab) => tab.value === activeTab)) {
      setActiveTab("stats")
    }
  }, [currentUser, activeTab, filteredTabOptions])

  return (
    <section className="py-8 md:py-24 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <AdminHeader />

        {/* Alertas de fianzas pendientes 
        <div className="mb-8">
          <DepositAlerts />
        </div>*/}

        {/* Accesos Rápidos */}
        <div className="mb-8 md:mb-12">
          <h3 className="text-xl md:text-2xl font-bold text-black mb-4 md:mb-6">Accesos Rápidos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredQuickActions.map((action) => (
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
          {/* Mobile: Dropdown selector */}
          <div className="md:hidden mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              {" "}
              {/* Changed background and border */}
              <label className="block text-sm font-medium text-gray-700 mb-2">Sección del Panel</label>
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-full h-12 text-left border-2 border-blue-500 shadow-md">
                  {" "}
                  {/* Added border and shadow */}
                  <div className="flex items-center">
                    {filteredTabOptions.find((tab) => tab.value === activeTab)?.icon && (
                      <div className="mr-3">
                        {React.createElement(filteredTabOptions.find((tab) => tab.value === activeTab)!.icon, {
                          className: "h-5 w-5 text-gray-600",
                        })}
                      </div>
                    )}
                    <SelectValue placeholder="Seleccionar sección">{getCurrentTabLabel()}</SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {filteredTabOptions.map((tab) => (
                    <SelectItem key={tab.value} value={tab.value}>
                      <div className="flex items-center">
                        <tab.icon className="h-4 w-4 mr-3 text-gray-600" />
                        {tab.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Desktop: Tabs normales */}
          <TabsList
            className={`hidden md:grid w-full max-w-5xl mx-auto mb-16 bg-white border border-gray-200 h-16 p-2`}
            style={{ gridTemplateColumns: `repeat(${filteredTabOptions.length}, 1fr)` }}
          >
            {filteredTabOptions.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="data-[state=active]:bg-black data-[state=active]:text-white text-gray-600 hover:text-black transition-colors text-lg font-semibold h-12 rounded-lg"
              >
                <tab.icon className="h-5 w-5 mr-3" />
                {tab.label}
              </TabsTrigger>
            ))}
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

          {/* ✅ NUEVO: Contenido para la gestión de playas */}
          <TabsContent value="beaches" className="mt-0">
            <BeachManagement />
          </TabsContent>

          {/* ✅ NUEVO: Contenido para la gestión de hoteles */}
          <TabsContent value="hotels" className="mt-0">
            <HotelManagement />
          </TabsContent>

          <TabsContent value="users" className="mt-0">
            <UserManagement />
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <SettingsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}
