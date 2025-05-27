"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { VehicleForm } from "./vehicle-form"
import { Plus, Edit, Trash2, Ship, Zap, Eye, EyeOff, AlertTriangle } from "lucide-react"
import Image from "next/image"

interface Vehicle {
  id: number
  name: string
  type: string
  capacity: number
  pricing: Array<{ duration: string; price: number; label: string }>
  includes: string[]
  fuelIncluded: boolean
  description: string
  image: string
  available: boolean
}

// Función para validar URLs
function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

// Función para validar URLs de imagen
function isValidImageUrl(url: string): boolean {
  if (!url) return false

  // Verificar si es una URL válida
  if (!isValidUrl(url) && !url.startsWith("/")) {
    return false
  }

  // Verificar extensiones de imagen comunes
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]
  const hasValidExtension = imageExtensions.some((ext) => url.toLowerCase().includes(ext))

  // Permitir rutas locales que empiecen con / o URLs válidas
  return url.startsWith("/") || hasValidExtension
}

// Componente para manejar imágenes con error
function SafeImage({
  src,
  alt,
  width,
  height,
  className,
}: {
  src: string
  alt: string
  width: number
  height: number
  className?: string
}) {
  const [imageError, setImageError] = useState(false)
  const [imageSrc, setImageSrc] = useState(src)

  // Resetear error cuando cambia la src
  useEffect(() => {
    setImageError(false)
    setImageSrc(src)
  }, [src])

  // Verificar si la URL es válida
  const isValid = isValidImageUrl(src)

  if (!isValid || imageError) {
    return (
      <div className={`${className} bg-gray-100 flex flex-col items-center justify-center text-gray-400`}>
        <AlertTriangle className="h-8 w-8 mb-2" />
        <span className="text-xs text-center px-2">{!isValid ? "URL inválida" : "Error al cargar imagen"}</span>
        <span className="text-xs text-gray-300 mt-1 px-2 break-all">
          {src.length > 30 ? `${src.substring(0, 30)}...` : src}
        </span>
      </div>
    )
  }

  return (
    <Image
      src={imageSrc || "/placeholder.svg"}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setImageError(true)}
      onLoad={() => setImageError(false)}
    />
  )
}

export function VehicleManagement() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      setError(null)
      const response = await fetch("/api/vehicles?all=true")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (Array.isArray(data)) {
        setVehicles(data)
      } else {
        console.error("API returned non-array data:", data)
        setVehicles([])
        setError("Error: Los datos recibidos no son válidos")
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error)
      setVehicles([])
      setError("Error al cargar los vehículos. Verifica la conexión a la base de datos.")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este producto?")) return

    try {
      const response = await fetch(`/api/vehicles/${id}`, { method: "DELETE" })
      if (response.ok) {
        fetchVehicles()
      } else {
        setError("Error al eliminar el producto")
      }
    } catch (error) {
      console.error("Error deleting vehicle:", error)
      setError("Error al eliminar el producto")
    }
  }

  const handleToggleAvailability = async (vehicle: Vehicle) => {
    try {
      const response = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: !vehicle.available }),
      })
      if (response.ok) {
        fetchVehicles()
      } else {
        setError("Error al actualizar la disponibilidad")
      }
    } catch (error) {
      console.error("Error toggling availability:", error)
      setError("Error al actualizar la disponibilidad")
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingVehicle(null)
    fetchVehicles()
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-black">Gestión de Productos</h2>
            <p className="text-gray-600">Administra tu flota de barcos y motos de agua</p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-black text-white hover:bg-gold hover:text-black transition-all duration-300 font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>

        <Card className="bg-red-50 border border-red-200">
          <CardContent className="text-center py-12">
            <div className="text-red-600 mb-4">⚠️ Error de Conexión</div>
            <h3 className="text-xl font-semibold text-red-800 mb-2">{error}</h3>
            <p className="text-red-600 mb-6">Verifica que la base de datos esté conectada y que las tablas existan.</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={fetchVehicles} className="bg-red-600 text-white hover:bg-red-700">
                Reintentar
              </Button>
              <Button
                onClick={() => setShowForm(true)}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Añadir Producto
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-black">Gestión de Productos</h2>
            <p className="text-gray-600">Cargando productos...</p>
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

  if (showForm) {
    return (
      <VehicleForm
        vehicle={editingVehicle}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setShowForm(false)
          setEditingVehicle(null)
        }}
      />
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-black">Gestión de Productos</h2>
          <p className="text-gray-600">Administra tu flota de barcos y motos de agua</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-black text-white hover:bg-gold hover:text-black transition-all duration-300 font-medium"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {Array.isArray(vehicles) && vehicles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <Card
              key={vehicle.id}
              className={`bg-white border transition-all duration-300 hover:shadow-lg ${
                vehicle.available ? "border-gray-200 hover:border-gold" : "border-red-200 opacity-75"
              }`}
            >
              <div className="relative">
                <div className="w-full h-48 bg-gray-50 flex items-center justify-center overflow-hidden">
                  <SafeImage
                    src={vehicle.image || "/placeholder.svg"}
                    alt={vehicle.name}
                    width={300}
                    height={200}
                    className="max-w-full max-h-full object-contain p-4"
                  />
                </div>
                <div className="absolute top-2 right-2 flex gap-2">
                  <Badge className={vehicle.available ? "bg-green-600 text-white" : "bg-red-600 text-white"}>
                    {vehicle.available ? "Disponible" : "No disponible"}
                  </Badge>
                  <Badge className="bg-gray-600 text-white">
                    {vehicle.type === "jetski" ? <Zap className="h-3 w-3" /> : <Ship className="h-3 w-3" />}
                  </Badge>
                </div>
                {/* Indicador de imagen inválida */}
                {!isValidImageUrl(vehicle.image) && (
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-orange-500 text-white text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Imagen inválida
                    </Badge>
                  </div>
                )}
              </div>

              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-black">{vehicle.name}</CardTitle>
                <CardDescription className="text-gray-600">{vehicle.description}</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Capacidad:</span>
                    <span className="font-semibold text-black">{vehicle.capacity} personas</span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-gray-500 text-sm">Precios:</span>
                    <div className="grid grid-cols-2 gap-2">
                      {Array.isArray(vehicle.pricing) &&
                        vehicle.pricing.map((price, index) => (
                          <div key={index} className="bg-gray-50 rounded p-2 text-center border border-gray-200">
                            <div className="text-sm font-bold text-gold">€{price.price}</div>
                            <div className="text-xs text-gray-600">{price.label}</div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-gray-500 text-sm">Incluye:</span>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(vehicle.includes) &&
                        vehicle.includes.map((item, index) => (
                          <Badge key={index} variant="outline" className="text-xs py-1 px-2">
                            {item}
                          </Badge>
                        ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingVehicle(vehicle)
                        setShowForm(true)
                      }}
                      className="flex-1 border-gray-300 hover:border-gold hover:text-gold"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleAvailability(vehicle)}
                      className="border-gray-300 hover:border-blue-500 hover:text-blue-500"
                    >
                      {vehicle.available ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(vehicle.id)}
                      className="border-gray-300 hover:border-red-500 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-white border border-gray-200">
          <CardContent className="text-center py-12">
            <Ship className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No hay productos</h3>
            <p className="text-gray-500 mb-6">Añade tu primer barco o moto de agua</p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-black text-white hover:bg-gold hover:text-black transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Añadir Producto
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
