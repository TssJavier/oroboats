"use client"

import { Badge } from "@/components/ui/badge"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Edit, Trash2, RefreshCw, MapPin, AlertCircle, Save } from "lucide-react"
import { toast } from "sonner"

interface BeachLocation {
  id: string // Usaremos un slug como ID (ej: "la-herradura-granada")
  name: string // Nombre legible (ej: "La Herradura, Granada")
}

export function BeachManagement() {
  const [locations, setLocations] = useState<BeachLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newLocationName, setNewLocationName] = useState("")
  const [editingLocation, setEditingLocation] = useState<BeachLocation | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      setError(null)
      setLoading(true)
      const response = await fetch("/api/locations") // Asumimos este endpoint
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (Array.isArray(data)) {
        setLocations(data)
      } else {
        setError("Error: Los datos recibidos no son válidos")
      }
    } catch (err) {
      console.error("Error fetching locations:", err)
      setError("Error al cargar las ubicaciones. Verifica la conexión a la base de datos.")
    } finally {
      setLoading(false)
    }
  }

  const createLocation = async () => {
    if (!newLocationName.trim()) {
      toast.error("El nombre de la playa no puede estar vacío.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const newId = newLocationName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
      const response = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: newId, name: newLocationName.trim() }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al crear la ubicación.")
      }
      toast.success("Playa añadida correctamente.")
      setNewLocationName("")
      fetchLocations()
    } catch (err) {
      console.error("Error creating location:", err)
      toast.error(err instanceof Error ? err.message : "Error al crear la ubicación.")
      setError(err instanceof Error ? err.message : "Error al crear la ubicación.")
    } finally {
      setSaving(false)
    }
  }

  const updateLocation = async () => {
    if (!editingLocation || !editingLocation.name.trim()) {
      toast.error("El nombre de la playa no puede estar vacío.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const response = await fetch(`/api/locations/${editingLocation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingLocation.name.trim() }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al actualizar la ubicación.")
      }
      toast.success("Playa actualizada correctamente.")
      setEditingLocation(null)
      fetchLocations()
    } catch (err) {
      console.error("Error updating location:", err)
      toast.error(err instanceof Error ? err.message : "Error al actualizar la ubicación.")
      setError(err instanceof Error ? err.message : "Error al actualizar la ubicación.")
    } finally {
      setSaving(false)
    }
  }

  const deleteLocation = async (id: string) => {
    if (
      !confirm(
        "¿Estás seguro de que quieres eliminar esta playa? Esto podría afectar a vehículos y reservas asociadas.",
      )
    ) {
      return
    }
    setLoading(true) // Usamos loading general para indicar que algo está pasando
    setError(null)
    try {
      const response = await fetch(`/api/locations/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al eliminar la ubicación.")
      }
      toast.success("Playa eliminada correctamente.")
      fetchLocations()
    } catch (err) {
      console.error("Error deleting location:", err)
      toast.error(err instanceof Error ? err.message : "Error al eliminar la ubicación.")
      setError(err instanceof Error ? err.message : "Error al eliminar la ubicación.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <h2 className="text-3xl font-bold text-black">Gestión de Playas</h2>
        <p className="text-gray-600">Cargando ubicaciones...</p>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </CardHeader>
          <CardContent>
            <div className="h-10 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <h2 className="text-3xl font-bold text-black">Gestión de Playas</h2>
        <p className="text-gray-600">Administra las ubicaciones de tus operaciones</p>
        <Card className="bg-red-50 border border-red-200">
          <CardContent className="text-center py-12">
            <div className="text-red-600 mb-4">⚠️ Error de Conexión</div>
            <h3 className="text-xl font-semibold text-red-800 mb-2">{error}</h3>
            <p className="text-red-600 mb-6">Verifica la conexión a la base de datos o la API de ubicaciones.</p>
            <Button onClick={fetchLocations} className="bg-red-600 text-white hover:bg-red-700">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-black">Gestión de Playas</h2>
        <p className="text-gray-600">Administra las ubicaciones de tus operaciones (ej: La Herradura, Carboneras)</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p>{error}</p>
          </div>
        </div>
      )}

      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-black">Añadir Nueva Playa</CardTitle>
          <CardDescription>Introduce el nombre de una nueva ubicación de playa</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Input
            value={newLocationName}
            onChange={(e) => setNewLocationName(e.target.value)}
            placeholder="Ej: Carboneras, Almería"
            className="flex-1 bg-gray-50 border-gray-200"
            disabled={saving}
          />
          <Button
            onClick={createLocation}
            disabled={saving || !newLocationName.trim()}
            className="bg-black text-white hover:bg-gold hover:text-black"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Añadiendo...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Añadir Playa
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-black">Playas Existentes</CardTitle>
          <CardDescription>Edita o elimina las ubicaciones de playa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {locations.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay playas configuradas. Añade una arriba.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50"
                >
                  {editingLocation?.id === location.id ? (
                    <>
                      <Input
                        value={editingLocation.name}
                        onChange={(e) => setEditingLocation({ ...editingLocation, name: e.target.value })}
                        className="flex-1 bg-white border-gray-300"
                      />
                      <Button
                        onClick={updateLocation}
                        disabled={saving || !editingLocation.name.trim()}
                        size="sm"
                        className="bg-green-600 text-white hover:bg-green-700"
                      >
                        {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      </Button>
                      <Button
                        onClick={() => setEditingLocation(null)}
                        variant="outline"
                        size="sm"
                        className="border-gray-300"
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <MapPin className="h-5 w-5 text-gold flex-shrink-0" />
                      <span className="flex-1 font-medium text-gray-800">{location.name}</span>
                      <Badge variant="outline" className="text-xs text-gray-500 hidden sm:block">
                        {location.id}
                      </Badge>
                      <Button
                        onClick={() => setEditingLocation(location)}
                        variant="outline"
                        size="sm"
                        className="border-gray-300 hover:border-gold hover:text-gold"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => deleteLocation(location.id)}
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
