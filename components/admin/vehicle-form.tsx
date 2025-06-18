"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ImageUpload } from "./image-upload"
import { ArrowLeft, Plus, Trash2, Save, Award, AlertCircle, Euro, Clock, Package } from "lucide-react"

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
  id?: number
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
  stock?: number // Nuevo campo para stock/inventario
}

interface VehicleFormProps {
  vehicle?: Vehicle | null
  onSuccess: () => void
  onCancel: () => void
}

// ✅ NUEVAS FRANJAS HORARIAS - IGUALES PARA BARCOS CON Y SIN LICENCIA
const TIME_SLOTS = {
  boat_no_license: [
    { duration: "halfday_10_14", label: "Medio día (10:00 - 14:00)", hours: 4, defaultPrice: 390 },
    { duration: "halfday_11_15", label: "Medio día (11:00 - 15:00)", hours: 4, defaultPrice: 390 },
    { duration: "halfday_12_16", label: "Medio día (12:00 - 16:00)", hours: 4, defaultPrice: 390 },
    { duration: "halfday_13_17", label: "Medio día (13:00 - 17:00)", hours: 4, defaultPrice: 390 },
    { duration: "halfday_14_18", label: "Medio día (14:00 - 18:00)", hours: 4, defaultPrice: 390 },
    { duration: "halfday_15_19", label: "Medio día (15:00 - 19:00)", hours: 4, defaultPrice: 390 },
    { duration: "halfday_16_20", label: "Medio día (16:00 - 20:00)", hours: 4, defaultPrice: 390 },
    { duration: "halfday_17_21", label: "Medio día (17:00 - 21:00)", hours: 4, defaultPrice: 390 },
    { duration: "fullday_10_21", label: "Día completo (10:00 - 21:00)", hours: 11, defaultPrice: 590 },
  ],
  boat_with_license: [
    { duration: "halfday_10_14", label: "Medio día (10:00 - 14:00)", hours: 4, defaultPrice: 390 },
    { duration: "halfday_11_15", label: "Medio día (11:00 - 15:00)", hours: 4, defaultPrice: 390 },
    { duration: "halfday_12_16", label: "Medio día (12:00 - 16:00)", hours: 4, defaultPrice: 390 },
    { duration: "halfday_13_17", label: "Medio día (13:00 - 17:00)", hours: 4, defaultPrice: 390 },
    { duration: "halfday_14_18", label: "Medio día (14:00 - 18:00)", hours: 4, defaultPrice: 390 },
    { duration: "halfday_15_19", label: "Medio día (15:00 - 19:00)", hours: 4, defaultPrice: 390 },
    { duration: "halfday_16_20", label: "Medio día (16:00 - 20:00)", hours: 4, defaultPrice: 390 },
    { duration: "halfday_17_21", label: "Medio día (17:00 - 21:00)", hours: 4, defaultPrice: 390 },
    { duration: "fullday_10_21", label: "Día completo (10:00 - 21:00)", hours: 11, defaultPrice: 590 },
  ],
  jetski_no_license: [
    { duration: "30min", label: "30 minutos", hours: 0.5, defaultPrice: 60 },
    { duration: "1hour", label: "1 hora", hours: 1, defaultPrice: 90 },
  ],
  jetski_with_license: [
    { duration: "30min", label: "30 minutos", hours: 0.5, defaultPrice: 60 },
    { duration: "1hour", label: "1 hora", hours: 1, defaultPrice: 90 },
    { duration: "2hour", label: "2 horas", hours: 2, defaultPrice: 160 },
    { duration: "halfday", label: "Medio día (4 horas)", hours: 4, defaultPrice: 250 },
    { duration: "fullday", label: "Día completo (8 horas)", hours: 8, defaultPrice: 400 },
  ],
}

// Características adicionales disponibles
const AVAILABLE_EXTRA_FEATURES: ExtraFeature[] = [
  {
    id: "photo_session",
    name: "Sesión de fotos",
    description: "Sesión fotográfica profesional durante el alquiler",
    enabled: false,
    price: 50,
  },
  {
    id: "bluetooth_music",
    name: "Música Bluetooth",
    description: "Sistema de sonido con conexión Bluetooth",
    enabled: false,
  },
  {
    id: "safety_ring",
    name: "Rosco de seguridad",
    description: "Rosco inflable para mayor seguridad",
    enabled: false,
  },
  {
    id: "champagne",
    name: "Champán",
    description: "Botella de champán incluida",
    enabled: false,
    price: 25,
  },
  {
    id: "snorkeling_gear",
    name: "Equipo de snorkel",
    description: "Máscaras y tubos de snorkel",
    enabled: false,
    price: 15,
  },
  {
    id: "cooler_drinks",
    name: "Nevera con bebidas",
    description: "Nevera portátil con bebidas frías",
    enabled: false,
    price: 20,
  },
]

export function VehicleForm({ vehicle, onSuccess, onCancel }: VehicleFormProps) {
  const [formData, setFormData] = useState<Vehicle>({
    name: "",
    type: "jetski",
    category: "jetski_no_license",
    requiresLicense: false,
    capacity: 2,
    pricing: [],
    availableDurations: [],
    includes: [],
    fuelIncluded: true,
    description: "",
    image: "",
    available: true,
    customDurationEnabled: false,
    extraFeatures: AVAILABLE_EXTRA_FEATURES.map((f) => ({ ...f })),
    securityDeposit: 0,
    manualDeposit: 0,
    stock: 1, // ✅ NUEVO: Stock por defecto
  })
  const [newInclude, setNewInclude] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (vehicle) {
      setFormData({
        ...vehicle,
        extraFeatures: vehicle.extraFeatures || AVAILABLE_EXTRA_FEATURES.map((f) => ({ ...f })),
        securityDeposit: vehicle.securityDeposit || 0,
        manualDeposit: vehicle.manualDeposit || 0,
        stock: vehicle.stock || 1, // ✅ NUEVO: Cargar stock existente
      })
    }
  }, [vehicle])

  // Actualizar categoría cuando cambia tipo o licencia
  useEffect(() => {
    const category = `${formData.type}_${formData.requiresLicense ? "with_license" : "no_license"}`
    if (category !== formData.category) {
      setFormData((prev) => ({
        ...prev,
        category,
        pricing: [], // Resetear precios cuando cambia categoría
        availableDurations: [],
      }))
    }
  }, [formData.type, formData.requiresLicense])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Preparar datos para envío
      const dataToSend = {
        ...formData,
        availableDurations: formData.pricing.map((p) => p.duration),
        extraFeatures: formData.extraFeatures || [],
        securityDeposit: formData.securityDeposit || 0,
        manualDeposit: formData.manualDeposit || 0,
        stock: formData.stock || 1, // ✅ NUEVO: Incluir stock
      }

      console.log("📤 Sending data:", dataToSend)

      const url = vehicle ? `/api/vehicles/${vehicle.id}` : "/api/vehicles"
      const method = vehicle ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      })

      if (response.ok) {
        console.log("✅ Operation successful")
        onSuccess()
      } else {
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }))
        console.error("❌ Server error:", errorData)
        setError(`Error ${response.status}: ${errorData.error || "Error desconocido"}`)
      }
    } catch (error) {
      console.error("❌ Connection error:", error)
      setError("Error de conexión: " + (error instanceof Error ? error.message : "Error desconocido"))
    } finally {
      setLoading(false)
    }
  }

  const generateTimeSlots = () => {
    const slots = TIME_SLOTS[formData.category as keyof typeof TIME_SLOTS] || []
    const newPricing = slots.map((slot) => ({
      duration: slot.duration,
      price: slot.defaultPrice || 0,
      label: slot.label,
    }))

    setFormData((prev) => ({
      ...prev,
      pricing: newPricing,
    }))
  }

  const updatePricing = (index: number, field: string, value: string | number) => {
    const newPricing = [...formData.pricing]
    newPricing[index] = { ...newPricing[index], [field]: value }
    setFormData({ ...formData, pricing: newPricing })
  }

  const addCustomPricing = () => {
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

  const updateExtraFeature = (featureId: string, field: keyof ExtraFeature, value: boolean | number) => {
    console.log("🔧 Updating extra feature:", featureId, field, value)
    setFormData((prev) => ({
      ...prev,
      extraFeatures:
        prev.extraFeatures?.map((feature) => (feature.id === featureId ? { ...feature, [field]: value } : feature)) ||
        [],
    }))
  }

  const availableSlots = TIME_SLOTS[formData.category as keyof typeof TIME_SLOTS] || []

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

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p>{error}</p>
          </div>
        </div>
      )}

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

              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Licencia</label>
                  <select
                    value={formData.requiresLicense ? "with" : "without"}
                    onChange={(e) => setFormData({ ...formData, requiresLicense: e.target.value === "with" })}
                    className="w-full p-2 border border-gray-200 rounded-md bg-gray-50"
                    required
                  >
                    <option value="without">Sin licencia</option>
                    <option value="with">Con licencia</option>
                  </select>
                </div>
              </div>

              {/* Mostrar categoría generada */}
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center">
                  <Award className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-800">
                    Categoría: <Badge className="ml-1 bg-blue-600 text-white">{formData.category}</Badge>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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

                {/* ✅ NUEVO: Campo de Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Package className="h-4 w-4 inline mr-1" />
                    Stock disponible
                  </label>
                  <Input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number.parseInt(e.target.value) })}
                    min="1"
                    max="100"
                    required
                    className="bg-gray-50 border-gray-200"
                  />
                  <p className="text-xs text-gray-500 mt-1">Número de unidades disponibles de este producto</p>
                </div>
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

        {/* Franjas horarias y precios */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-black flex items-center">
              <Clock className="h-5 w-5 text-gold mr-3" />
              Franjas Horarias y Precios
            </CardTitle>
            <CardDescription>
              Configura los precios para las franjas disponibles según la categoría seleccionada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* ✅ INFORMACIÓN ACTUALIZADA - SIN RESTRICCIONES */}
            {formData.type === "boat" && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-800 mb-1">Horarios de barcos actualizados</h4>
                    <p className="text-sm text-green-700">
                      {formData.requiresLicense
                        ? "Los barcos con licencia tienen 8 franjas de medio día (4h) + día completo (11h) disponibles."
                        : "Los barcos sin licencia tienen 8 franjas de medio día (4h) + día completo (11h) disponibles. Ya no hay restricciones de horario."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Botón para generar franjas automáticamente */}
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-gray-700">Franjas disponibles para: {formData.category}</h4>
                <p className="text-sm text-gray-500">{availableSlots.length} franjas horarias disponibles</p>
              </div>
              <Button
                type="button"
                onClick={generateTimeSlots}
                className="bg-gold text-black hover:bg-black hover:text-white"
              >
                <Clock className="h-4 w-4 mr-2" />
                Generar Franjas
              </Button>
            </div>

            {/* Lista de precios */}
            {formData.pricing.length > 0 ? (
              <div className="space-y-4">
                {formData.pricing.map((price, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end border-b pb-4 border-gray-200"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duración</label>
                      <Input
                        value={price.duration}
                        onChange={(e) => updatePricing(index, "duration", e.target.value)}
                        placeholder="30min, halfday..."
                        className="bg-gray-50 border-gray-200"
                        disabled={availableSlots.some((slot) => slot.duration === price.duration)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Etiqueta</label>
                      <Input
                        value={price.label}
                        onChange={(e) => updatePricing(index, "label", e.target.value)}
                        placeholder="30 minutos, Medio día..."
                        className="bg-gray-50 border-gray-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Precio (€)</label>
                      <Input
                        type="number"
                        value={price.price}
                        onChange={(e) => updatePricing(index, "price", Number.parseFloat(e.target.value))}
                        min="0"
                        step="0.01"
                        className="bg-gray-50 border-gray-200"
                      />
                    </div>
                    <div className="flex justify-end">
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
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No hay franjas horarias configuradas</p>
                <p className="text-sm text-gray-400">
                  Haz clic en "Generar Franjas" para crear las franjas automáticamente
                </p>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={addCustomPricing}
              className="w-full border-gray-300 hover:border-gold hover:text-gold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Añadir franja personalizada
            </Button>
          </CardContent>
        </Card>

        {/* Características adicionales */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-black">Características Adicionales</CardTitle>
            <CardDescription>Servicios extra que se pueden activar para este producto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.extraFeatures?.map((feature) => (
                <div key={feature.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <input
                          type="checkbox"
                          checked={feature.enabled}
                          onChange={(e) => updateExtraFeature(feature.id, "enabled", e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <span className="font-medium text-gray-900">{feature.name}</span>
                      </div>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                  {feature.enabled && feature.price !== undefined && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Precio adicional (€)</label>
                      <Input
                        type="number"
                        value={feature.price}
                        onChange={(e) => updateExtraFeature(feature.id, "price", Number.parseFloat(e.target.value))}
                        min="0"
                        step="0.01"
                        className="bg-gray-50 border-gray-200"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Fianza y servicios incluidos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Fianza */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-black flex items-center">
                <Euro className="h-5 w-5 text-gold mr-3" />
                Fianza
              </CardTitle>
              <CardDescription>Cantidad de fianza requerida para este producto</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Importe de la fianza (€)</label>
                <Input
                  type="number"
                  value={formData.securityDeposit}
                  onChange={(e) => setFormData({ ...formData, securityDeposit: Number.parseFloat(e.target.value) })}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="bg-gray-50 border-gray-200"
                />
                <p className="text-xs text-gray-500 mt-1">
                  La fianza se retiene temporalmente y se devuelve tras la devolución del vehículo en buen estado
                </p>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Fianza manual en sitio (€)</label>
                <Input
                  type="number"
                  value={formData.manualDeposit}
                  onChange={(e) => setFormData({ ...formData, manualDeposit: Number.parseFloat(e.target.value) })}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="bg-gray-50 border-gray-200"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Esta fianza se paga en el sitio y no se incluye en el precio online
                </p>
              </div>

            </CardContent>
          </Card>

          {/* Incluye */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-black">¿Qué incluye?</CardTitle>
              <CardDescription>Servicios y elementos incluidos en el precio base</CardDescription>
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
        </div>

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

export default VehicleForm
