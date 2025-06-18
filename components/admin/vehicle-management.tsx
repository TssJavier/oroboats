"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { VehicleForm } from "./vehicle-form"
import { ManualBookingModal } from "./manual-booking-modal"
import {
  Edit,
  Trash2,
  Plus,
  Ship,
  Zap,
  Users,
  Euro,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Calendar,
  Package,
  PauseCircle,
  CheckCircle,
} from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

interface PricingOption {
  duration: string
  price: number
  label: string
}

interface ExtraFeature {
  id: string
  name: string
  description: string
  enabled: boolean
  price?: number
}

interface Vehicle {
  id: number
  name: string
  type: string
  category: string
  requiresLicense: boolean
  capacity: number
  pricing: PricingOption[]
  availableDurations: string[]
  includes: string[]
  fuelIncluded: boolean
  description: string
  image: string
  available: boolean
  customDurationEnabled: boolean
  extraFeatures?: ExtraFeature[]
  securityDeposit?: number
  manualDeposit?: number
  stock?: number
}

// ✅ NUEVO: Interfaz para grupos de vehículos
interface VehicleGroups {
  availableJetskis: Vehicle[]
  availableBoats: Vehicle[]
  unavailableJetskis: Vehicle[]
  unavailableBoats: Vehicle[]
}

export function VehicleManagement() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showManualBooking, setShowManualBooking] = useState(false)
  const [selectedVehicleForBooking, setSelectedVehicleForBooking] = useState<Vehicle | null>(null)
  const [showPauseAllModal, setShowPauseAllModal] = useState(false)
  const [pausingAll, setPausingAll] = useState(false)

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      setError(null)
      setLoading(true)

      console.log("🚗 Fetching vehicles from API...")
      const response = await fetch("/api/vehicles?all=true")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("✅ Vehicles fetched:", data)

      if (Array.isArray(data)) {
        setVehicles(data)
      } else {
        console.error("❌ API returned non-array data:", data)
        setError("Error: Los datos recibidos no son válidos")
      }
    } catch (error) {
      console.error("❌ Error fetching vehicles:", error)
      setError("Error al cargar los vehículos. Verifica la conexión a la base de datos.")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (vehicle: Vehicle) => {
    console.log("✏️ Editing vehicle:", vehicle)
    setEditingVehicle(vehicle)
    setShowForm(true)
  }

  const handleManualBooking = (vehicle: Vehicle) => {
    console.log("📅 Creating manual booking for:", vehicle.name)
    setSelectedVehicleForBooking(vehicle)
    setShowManualBooking(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este vehículo?")) {
      return
    }

    setDeletingId(id)
    console.log("🗑️ Attempting to delete vehicle with ID:", id)

    try {
      const response = await fetch(`/api/vehicles/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("🔄 Delete response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("❌ Delete failed with error:", errorData)

        if (response.status === 500) {
          throw new Error("Error del servidor. Verifica que la base de datos esté conectada y que las tablas existan.")
        } else if (response.status === 404) {
          throw new Error("El vehículo no existe o ya fue eliminado.")
        } else {
          throw new Error(errorData.error || `Error ${response.status}: No se pudo eliminar el vehículo`)
        }
      }

      const result = await response.json()
      console.log("✅ Vehicle deleted successfully:", result)

      toast.success("Vehículo eliminado correctamente")
      await fetchVehicles()
    } catch (error) {
      console.error("❌ Error deleting vehicle:", error)
      const errorMessage = error instanceof Error ? error.message : "Error desconocido al eliminar el vehículo"
      toast.error(errorMessage)
      setError(errorMessage)
    } finally {
      setDeletingId(null)
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingVehicle(null)
    fetchVehicles()
    toast.success(editingVehicle ? "Vehículo actualizado correctamente" : "Vehículo creado correctamente")
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingVehicle(null)
  }

  const handleManualBookingSuccess = () => {
    setShowManualBooking(false)
    setSelectedVehicleForBooking(null)
  }

  const handleManualBookingClose = () => {
    setShowManualBooking(false)
    setSelectedVehicleForBooking(null)
  }

  const toggleAvailability = async (vehicle: Vehicle) => {
    try {
      const response = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...vehicle,
          available: !vehicle.available,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar disponibilidad")
      }

      toast.success(`Vehículo ${!vehicle.available ? "activado" : "desactivado"} correctamente`)
      fetchVehicles()
    } catch (error) {
      console.error("Error updating availability:", error)
      toast.error("Error al actualizar la disponibilidad")
    }
  }

  const pauseAllVehicles = async () => {
    setPausingAll(true)
    try {
      // Obtener solo los vehículos que están disponibles
      const availableVehicles = vehicles.filter((v) => v.available)

      if (availableVehicles.length === 0) {
        toast.info("No hay vehículos disponibles para pausar")
        setShowPauseAllModal(false)
        setPausingAll(false)
        return
      }

      console.log(`🔄 Pausando ${availableVehicles.length} vehículos...`)

      // Actualizar cada vehículo disponible
      const promises = availableVehicles.map((vehicle) =>
        fetch(`/api/vehicles/${vehicle.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...vehicle,
            available: false,
          }),
        }),
      )

      const results = await Promise.allSettled(promises)

      // Contar éxitos y fallos
      const successful = results.filter((r) => r.status === "fulfilled").length
      const failed = results.filter((r) => r.status === "rejected").length

      if (failed > 0) {
        toast.warning(`${successful} vehículos pausados, ${failed} fallos`)
      } else {
        toast.success(`${successful} vehículos pausados correctamente`)
      }

      fetchVehicles()
    } catch (error) {
      console.error("Error pausando todos los vehículos:", error)
      toast.error("Error al pausar los vehículos")
    } finally {
      setShowPauseAllModal(false)
      setPausingAll(false)
    }
  }

  const isValidImageUrl = (url: string): boolean => {
    if (!url) return false
    try {
      new URL(url)
      return true
    } catch {
      return url.startsWith("/")
    }
  }

  // ✅ NUEVO: Función para agrupar vehículos por disponibilidad y tipo
  const groupVehicles = (vehicles: Vehicle[]): VehicleGroups => {
    return vehicles.reduce(
      (groups, vehicle) => {
        const isJetski =
          vehicle.type === "jetski" ||
          vehicle.category?.toLowerCase().includes("jetski") ||
          vehicle.name?.toLowerCase().includes("jetski") ||
          vehicle.name?.toLowerCase().includes("moto")

        if (vehicle.available) {
          if (isJetski) {
            groups.availableJetskis.push(vehicle)
          } else {
            groups.availableBoats.push(vehicle)
          }
        } else {
          if (isJetski) {
            groups.unavailableJetskis.push(vehicle)
          } else {
            groups.unavailableBoats.push(vehicle)
          }
        }
        return groups
      },
      {
        availableJetskis: [],
        availableBoats: [],
        unavailableJetskis: [],
        unavailableBoats: [],
      } as VehicleGroups,
    )
  }

  // ✅ NUEVO: Componente para renderizar un vehículo
  const VehicleCard = ({ vehicle }: { vehicle: Vehicle }) => (
    <Card key={vehicle.id} className="bg-white border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="relative">
        <div className="h-48 bg-gray-50 flex items-center justify-center overflow-hidden rounded-t-lg">
          {isValidImageUrl(vehicle.image) ? (
            <Image
              src={vehicle.image || "/placeholder.svg"}
              alt={vehicle.name}
              width={300}
              height={200}
              className="max-w-full max-h-full object-contain p-4"
            />
          ) : (
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-2" />
              <span className="text-sm text-orange-600">URL inválida</span>
            </div>
          )}
        </div>

        <div className="absolute top-2 right-2 flex gap-2">
          <Badge className={vehicle.available ? "bg-green-500 text-white" : "bg-gray-500 text-white"}>
            {vehicle.available ? "Disponible" : "No disponible"}
          </Badge>
          {!isValidImageUrl(vehicle.image) && <Badge className="bg-orange-500 text-white">Imagen inválida</Badge>}
        </div>

        <div className="absolute top-2 left-2">
          <Badge className={`${vehicle.requiresLicense ? "bg-blue-600" : "bg-green-600"} text-white`}>
            {vehicle.requiresLicense ? "Licencia requerida" : "Sin licencia"}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-black flex items-center">
          {vehicle.type === "boat" ? (
            <Ship className="h-5 w-5 mr-2 text-gold" />
          ) : (
            <Zap className="h-5 w-5 mr-2 text-gold" />
          )}
          {vehicle.name}
        </CardTitle>
        <CardDescription className="text-sm text-gray-600">{vehicle.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center text-gray-500">
            <Users className="h-4 w-4 mr-1" />
            <span>Capacidad: {vehicle.capacity}</span>
          </div>
          <div className="flex items-center text-gray-500">
            <Package className="h-4 w-4 mr-1" />
            <span>Stock: {vehicle.stock || 1}</span>
          </div>
        </div>

        {vehicle.pricing && vehicle.pricing.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm text-gray-500 flex items-center">
              <Euro className="h-4 w-4 mr-1" />
              Precios:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {vehicle.pricing.slice(0, 2).map((price, index) => (
                <div key={index} className="bg-gray-50 rounded p-2 text-center">
                  <div className="text-lg font-bold text-gold">€{price.price}</div>
                  <div className="text-xs text-gray-600">{price.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {vehicle.securityDeposit && vehicle.securityDeposit > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded p-2">
            <span className="text-sm text-blue-800 font-medium">Fianza: €{vehicle.securityDeposit}</span>
          </div>
        )}

        {vehicle.manualDeposit && vehicle.manualDeposit > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
            <span className="text-sm text-yellow-800 font-medium">Fianza en sitio: €{vehicle.manualDeposit}</span>
          </div>
        )}


        {vehicle.stock && vehicle.stock > 1 && (
          <div className="bg-green-50 border border-green-200 rounded p-2">
            <span className="text-sm text-green-800 font-medium">📦 {vehicle.stock} unidades disponibles</span>
          </div>
        )}

        {/* Botón de Reserva Manual */}
        <div className="bg-gold/10 border border-gold/30 rounded p-3">
          <Button
            onClick={() => handleManualBooking(vehicle)}
            className="w-full bg-gold text-black hover:bg-gold/90 font-medium"
            size="sm"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Reserva Manual
          </Button>
          <p className="text-xs text-gray-600 mt-1 text-center">Para clientes que vienen físicamente</p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => handleEdit(vehicle)}
            variant="outline"
            size="sm"
            className="flex-1 border-gray-300 hover:border-gold hover:text-gold"
          >
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>

          <Button
            onClick={() => toggleAvailability(vehicle)}
            variant="outline"
            size="sm"
            className={`border-gray-300 ${vehicle.available
                ? "hover:border-gray-500 hover:text-gray-700"
                : "hover:border-green-500 hover:text-green-600"
              }`}
          >
            {vehicle.available ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>

          <Button
            onClick={() => handleDelete(vehicle.id)}
            variant="outline"
            size="sm"
            disabled={deletingId === vehicle.id}
            className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
          >
            {deletingId === vehicle.id ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  // ✅ NUEVO: Componente para renderizar una sección de vehículos
  const VehicleSection = ({
    title,
    vehicles,
    icon,
    color,
  }: {
    title: string
    vehicles: Vehicle[]
    icon: React.ReactNode
    color: string
  }) => {
    if (vehicles.length === 0) return null

    return (
      <div className="mb-8">
        <div className={`flex items-center gap-2 mb-4 pb-2 border-b ${color}`}>
          {icon}
          <h3 className="text-xl font-bold">{title}</h3>
          <Badge className="ml-2">{vehicles.length}</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      </div>
    )
  }

  if (showForm) {
    return <VehicleForm vehicle={editingVehicle} onSuccess={handleFormSuccess} onCancel={handleFormCancel} />
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-black">Gestión de Productos</h2>
            <p className="text-gray-600">Administra tu flota de barcos y motos de agua</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-black">Gestión de Productos</h2>
            <p className="text-gray-600">Administra tu flota de barcos y motos de agua</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-black text-white hover:bg-gold hover:text-black">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>

        <Card className="bg-red-50 border border-red-200">
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-800 mb-2">Error al cargar productos</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={fetchVehicles} className="bg-red-600 text-white hover:bg-red-700">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
              <Button onClick={() => setShowForm(true)} variant="outline" className="border-red-300 text-red-600">
                <Plus className="h-4 w-4 mr-2" />
                Añadir Producto
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ✅ NUEVO: Agrupar vehículos
  const vehicleGroups = groupVehicles(vehicles)
  const availableVehiclesCount = vehicleGroups.availableJetskis.length + vehicleGroups.availableBoats.length

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-black">Gestión de Productos</h2>
            <p className="text-gray-600">Administra tu flota de barcos y motos de agua</p>
          </div>
          <div className="flex gap-2">
            {availableVehiclesCount > 0 && (
              <Button
                onClick={() => setShowPauseAllModal(true)}
                variant="outline"
                className="border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400"
              >
                <PauseCircle className="h-4 w-4 mr-2" />
                Pausar todo
              </Button>
            )}
            <Button onClick={() => setShowForm(true)} className="bg-black text-white hover:bg-gold hover:text-black">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
            </Button>
          </div>
        </div>

        {vehicles.length === 0 ? (
          <Card className="bg-gray-50 border border-gray-200">
            <CardContent className="text-center py-12">
              <Ship className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No hay productos</h3>
              <p className="text-gray-500 mb-4">Comienza añadiendo tu primer barco o moto de agua</p>
              <Button onClick={() => setShowForm(true)} className="bg-black text-white hover:bg-gold hover:text-black">
                <Plus className="h-4 w-4 mr-2" />
                Añadir Primer Producto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div>
            {/* ✅ NUEVO: Sección de productos disponibles */}
            {availableVehiclesCount > 0 && (
              <div className="mb-12">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <h2 className="text-xl font-bold text-green-800 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Productos Disponibles ({availableVehiclesCount})
                  </h2>
                </div>

                <VehicleSection
                  title="Motos de Agua Disponibles"
                  vehicles={vehicleGroups.availableJetskis}
                  icon={<Zap className="h-5 w-5 text-blue-600" />}
                  color="border-blue-200"
                />

                <VehicleSection
                  title="Barcos Disponibles"
                  vehicles={vehicleGroups.availableBoats}
                  icon={<Ship className="h-5 w-5 text-blue-600" />}
                  color="border-blue-200"
                />
              </div>
            )}

            {/* ✅ NUEVO: Sección de productos no disponibles */}
            {vehicleGroups.unavailableJetskis.length + vehicleGroups.unavailableBoats.length > 0 && (
              <div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <h2 className="text-xl font-bold text-gray-700 flex items-center">
                    <EyeOff className="h-5 w-5 mr-2" />
                    Productos No Disponibles (
                    {vehicleGroups.unavailableJetskis.length + vehicleGroups.unavailableBoats.length})
                  </h2>
                </div>

                <VehicleSection
                  title="Motos de Agua No Disponibles"
                  vehicles={vehicleGroups.unavailableJetskis}
                  icon={<Zap className="h-5 w-5 text-gray-600" />}
                  color="border-gray-200"
                />

                <VehicleSection
                  title="Barcos No Disponibles"
                  vehicles={vehicleGroups.unavailableBoats}
                  icon={<Ship className="h-5 w-5 text-gray-600" />}
                  color="border-gray-200"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Reserva Manual */}
      <ManualBookingModal
        vehicle={selectedVehicleForBooking}
        isOpen={showManualBooking}
        onClose={handleManualBookingClose}
        onSuccess={handleManualBookingSuccess}
      />

      {/* Modal de confirmación para pausar todos los vehículos */}
      {showPauseAllModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4">Pausar todos los vehículos</h3>
            <p className="text-gray-700 mb-6">
              Vas a poner todos los vehículos en "No disponibles", quitándolos de la tienda. ¿Estás seguro?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowPauseAllModal(false)} disabled={pausingAll}>
                No, cancelar
              </Button>
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={pauseAllVehicles}
                disabled={pausingAll}
              >
                {pausingAll ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <PauseCircle className="h-4 w-4 mr-2" />
                    Sí, pausar todo
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
