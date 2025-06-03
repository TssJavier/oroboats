"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ImageUpload } from "./image-upload"
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react"

interface Vehicle {
  id?: number
  name: string
  type: string
  capacity: number
  pricing: Array<{ duration: string; price: number; label: string }>
  includes: string[]
  fuelIncluded: boolean
  description: string
  image: string
  available: boolean
  customDurationEnabled: boolean // NUEVO CAMPO
}

interface VehicleFormProps {
  vehicle?: Vehicle | null
  onSuccess: () => void
  onCancel: () => void
}

export function VehicleForm({ vehicle, onSuccess, onCancel }: VehicleFormProps) {
  const [formData, setFormData] = useState<Vehicle>({
    name: "",
    type: "jetski",
    capacity: 2,
    pricing: [{ duration: "30min", price: 0, label: "30 min" }],
    includes: [],
    fuelIncluded: true,
    description: "",
    image: "",
    available: true,
    customDurationEnabled: true, // NUEVO CAMPO
  })
  const [newInclude, setNewInclude] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (vehicle) {
      setFormData({
        ...vehicle,
        customDurationEnabled: vehicle.customDurationEnabled ?? true, // Valor por defecto
      })
    }
  }, [vehicle])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = vehicle ? `/api/vehicles/${vehicle.id}` : "/api/vehicles"
      const method = vehicle ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error saving vehicle:", error)
    } finally {
      setLoading(false)
    }
  }

  const addPricing = () => {
    setFormData({
      ...formData,
      pricing: [...formData.pricing, { duration: "", price: 0, label: "" }],
    })
  }

  const removePricing = (index: number) => {
    setFormData({
      ...formData,
      pricing: formData.pricing.filter((_, i) => i !== index),
    })
  }

  const updatePricing = (index: number, field: string, value: string | number) => {
    const newPricing = [...formData.pricing]
    newPricing[index] = { ...newPricing[index], [field]: value }
    setFormData({ ...formData, pricing: newPricing })
  }

  const addInclude = () => {
    if (newInclude.trim()) {
      setFormData({
        ...formData,
        includes: [...formData.includes, newInclude.trim()],
      })
      setNewInclude("")
    }
  }

  const removeInclude = (index: number) => {
    setFormData({
      ...formData,
      includes: formData.includes.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onCancel} className="border-gray-300">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h2 className="text-3xl font-bold text-black">{vehicle ? "Editar Producto" : "Nuevo Producto"}</h2>
          <p className="text-gray-600">
            {vehicle ? "Modifica los datos del producto" : "Añade un nuevo barco o moto de agua"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Información básica */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-black">Información Básica</CardTitle>
              <CardDescription>Datos principales del producto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del producto</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: GTX 130 Pro"
                  required
                  className="bg-gray-50 border-gray-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-md bg-gray-50"
                  required
                >
                  <option value="jetski">Moto de agua</option>
                  <option value="boat">Barco</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Capacidad (personas)</label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number.parseInt(e.target.value) })}
                  min="1"
                  max="20"
                  required
                  className="bg-gray-50 border-gray-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe las características del producto..."
                  rows={3}
                  required
                  className="bg-gray-50 border-gray-200"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.fuelIncluded}
                      onChange={(e) => setFormData({ ...formData, fuelIncluded: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Gasolina incluida</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.available}
                      onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Disponible</span>
                  </label>
                </div>

                {/* NUEVO CAMPO: Duración personalizada */}
                <div className="border-t pt-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.customDurationEnabled}
                      onChange={(e) => setFormData({ ...formData, customDurationEnabled: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Permitir duración personalizada</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Si está desactivado, los clientes solo podrán elegir las duraciones predefinidas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Imagen */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-black">Imagen del Producto</CardTitle>
              <CardDescription>Sube o selecciona una imagen para el producto</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload
                value={formData.image}
                onChange={(url) => setFormData({ ...formData, image: url })}
                vehicleType={formData.type as "boat" | "jetski"}
              />
            </CardContent>
          </Card>
        </div>

        {/* Precios */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-black">Precios</CardTitle>
            <CardDescription>Configura los precios por duración (Horario: 09:00 - 21:00)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {formData.pricing.map((price, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duración</label>
                  <Input
                    value={price.duration}
                    onChange={(e) => updatePricing(index, "duration", e.target.value)}
                    placeholder="30min, 1hour, halfday..."
                    className="bg-gray-50 border-gray-200"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio (€)</label>
                  <Input
                    type="number"
                    value={price.price}
                    onChange={(e) => updatePricing(index, "price", Number.parseInt(e.target.value))}
                    min="0"
                    className="bg-gray-50 border-gray-200"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Etiqueta</label>
                  <Input
                    value={price.label}
                    onChange={(e) => updatePricing(index, "label", e.target.value)}
                    placeholder="30 min, 1 hora..."
                    className="bg-gray-50 border-gray-200"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removePricing(index)}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addPricing}
              className="w-full border-gray-300 hover:border-gold hover:text-gold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Añadir precio
            </Button>
          </CardContent>
        </Card>

        {/* Incluye */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-black">¿Qué incluye?</CardTitle>
            <CardDescription>Servicios y elementos incluidos en el precio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-2">
              <Input
                value={newInclude}
                onChange={(e) => setNewInclude(e.target.value)}
                placeholder="Ej: Chalecos salvavidas"
                className="bg-gray-50 border-gray-200"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addInclude())}
              />
              <Button type="button" onClick={addInclude} variant="outline" className="border-gray-300">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.includes.map((item, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:border-red-300 hover:text-red-600 cursor-pointer"
                  onClick={() => removeInclude(index)}
                >
                  {item} ×
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Botones */}
        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={onCancel} className="border-gray-300">
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-black text-white hover:bg-gold hover:text-black transition-all duration-300 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Guardando..." : vehicle ? "Actualizar" : "Crear Producto"}
          </Button>
        </div>
      </form>
    </div>
  )
}
