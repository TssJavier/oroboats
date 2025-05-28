"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Save, Plus, Trash2, Calculator, Clock, Euro } from "lucide-react"

interface PricingRule {
  id?: number
  vehicleId: number
  duration: string
  price: number
  label: string
  isDefault?: boolean
}

interface Vehicle {
  id: number
  name: string
  type: string
}

export function PricingSettings() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null)
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [customRatePerMinute, setCustomRatePerMinute] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchVehicles()
  }, [])

  useEffect(() => {
    if (selectedVehicle) {
      fetchPricingRules(selectedVehicle)
    }
  }, [selectedVehicle])

  const fetchVehicles = async () => {
    try {
      const response = await fetch("/api/vehicles?all=true")
      if (response.ok) {
        const data = await response.json()
        setVehicles(data)
        if (data.length > 0) {
          setSelectedVehicle(data[0].id)
        }
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPricingRules = async (vehicleId: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/pricing/${vehicleId}`)
      if (response.ok) {
        const data = await response.json()
        setPricingRules(data.pricingRules || [])
        setCustomRatePerMinute(data.customRatePerMinute || 0)
      }
    } catch (error) {
      console.error("Error fetching pricing rules:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      if (!selectedVehicle) return

      const response = await fetch(`/api/pricing/${selectedVehicle}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pricingRules,
          customRatePerMinute,
        }),
      })

      if (response.ok) {
        setSuccess("Configuración de precios guardada correctamente")
      } else {
        setError("Error al guardar la configuración de precios")
      }
    } catch (error) {
      console.error("Error saving pricing rules:", error)
      setError("Error al guardar la configuración de precios")
    } finally {
      setSaving(false)
    }
  }

  const addPricingRule = () => {
    if (!selectedVehicle) return

    setPricingRules([
      ...pricingRules,
      {
        vehicleId: selectedVehicle,
        duration: "",
        price: 0,
        label: "",
      },
    ])
  }

  const updatePricingRule = (index: number, field: keyof PricingRule, value: string | number) => {
    const updatedRules = [...pricingRules]
    updatedRules[index] = { ...updatedRules[index], [field]: value }
    setPricingRules(updatedRules)
  }

  const removePricingRule = (index: number) => {
    setPricingRules(pricingRules.filter((_, i) => i !== index))
  }

  const calculateAutomaticRate = (): number => {
    // Buscar una tarifa por hora para calcular automáticamente
    const hourlyRule = pricingRules.find((rule) => rule.duration === "1hour")
    if (hourlyRule && hourlyRule.price > 0) {
      return hourlyRule.price / 60 // Convertir precio por hora a precio por minuto
    }

    // Si no hay tarifa por hora, buscar halfday
    const halfdayRule = pricingRules.find((rule) => rule.duration === "halfday")
    if (halfdayRule && halfdayRule.price > 0) {
      return halfdayRule.price / 360 // 6 horas = 360 minutos
    }

    // Si no hay halfday, buscar fullday
    const fulldayRule = pricingRules.find((rule) => rule.duration === "fullday")
    if (fulldayRule && fulldayRule.price > 0) {
      return fulldayRule.price / 720 // 12 horas = 720 minutos
    }

    return 0
  }

  const getEffectiveRate = (): number => {
    if (customRatePerMinute > 0) {
      return customRatePerMinute
    }
    return calculateAutomaticRate()
  }

  const calculateExamplePrice = (hours: number, minutes: number): number => {
    const totalMinutes = hours * 60 + minutes
    const effectiveRate = getEffectiveRate()

    if (effectiveRate > 0) {
      return Math.round(effectiveRate * totalMinutes)
    }

    // Fallback si no hay ninguna tarifa configurada
    return Math.round(2 * totalMinutes)
  }

  if (loading && !selectedVehicle) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-black">Configuración de Precios</h2>
          <p className="text-gray-600">Cargando vehículos...</p>
        </div>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </CardHeader>
          <CardContent>
            <div className="h-20 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-black">Configuración de Precios</h2>
        <p className="text-gray-600">Administra las tarifas y precios personalizados</p>
      </div>

      {/* Selector de vehículo */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-black">Seleccionar Vehículo</CardTitle>
          <CardDescription>Elige el vehículo para configurar sus precios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {vehicles.map((vehicle) => (
              <Button
                key={vehicle.id}
                variant={selectedVehicle === vehicle.id ? "default" : "outline"}
                onClick={() => setSelectedVehicle(vehicle.id)}
                className={selectedVehicle === vehicle.id ? "bg-gold text-black hover:bg-gold/90" : ""}
              >
                {vehicle.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tarifas estándar */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-black flex items-center">
            <Clock className="h-5 w-5 text-gold mr-3" />
            Tarifas Estándar
          </CardTitle>
          <CardDescription>Configura las opciones de duración y precio que aparecerán en la reserva</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {pricingRules.map((rule, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end border-b pb-4 border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duración (código)</label>
                <Input
                  value={rule.duration}
                  onChange={(e) => updatePricingRule(index, "duration", e.target.value)}
                  placeholder="30min, 1hour, etc."
                  className="bg-gray-50 border-gray-200"
                />
                <p className="text-xs text-gray-500 mt-1">Ej: 30min, 1hour, 2hour, halfday</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Etiqueta</label>
                <Input
                  value={rule.label}
                  onChange={(e) => updatePricingRule(index, "label", e.target.value)}
                  placeholder="30 minutos, 1 hora, etc."
                  className="bg-gray-50 border-gray-200"
                />
                <p className="text-xs text-gray-500 mt-1">Texto visible para el cliente</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio (€)</label>
                <Input
                  type="number"
                  value={rule.price}
                  onChange={(e) => updatePricingRule(index, "price", Number.parseFloat(e.target.value))}
                  min="0"
                  step="0.01"
                  className="bg-gray-50 border-gray-200"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removePricingRule(index)}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={addPricingRule}
            className="w-full border-gray-300 hover:border-gold hover:text-gold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Añadir Tarifa
          </Button>
        </CardContent>
      </Card>

      {/* Configuración de tarifa personalizada */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-black flex items-center">
            <Calculator className="h-5 w-5 text-gold mr-3" />
            Tarifa Personalizada
          </CardTitle>
          <CardDescription>Configura cómo se calculan los precios para duraciones personalizadas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tarifa por minuto (€)</label>
              <Input
                type="number"
                value={customRatePerMinute}
                onChange={(e) => setCustomRatePerMinute(Number.parseFloat(e.target.value))}
                min="0"
                step="0.01"
                className="bg-gray-50 border-gray-200"
              />
              <p className="text-xs text-gray-500 mt-1">
                Esta tarifa se usa para calcular el precio de duraciones personalizadas
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-700 mb-2">Ejemplos de cálculo:</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">1 hora:</span>
                  <Badge className="bg-gold text-black">{calculateExamplePrice(1, 0)}€</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">2 horas:</span>
                  <Badge className="bg-gold text-black">{calculateExamplePrice(2, 0)}€</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">2 horas y 30 minutos:</span>
                  <Badge className="bg-gold text-black">{calculateExamplePrice(2, 30)}€</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start">
              <Euro className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 mb-1">¿Cómo funciona?</h4>
                <div className="text-sm text-blue-700 space-y-2">
                  <p>
                    <strong>Con tarifa personalizada:</strong> Se multiplica la tarifa por minuto por la duración total.
                  </p>
                  <p>
                    <strong>Sin tarifa personalizada:</strong> Se calcula automáticamente basándose en las tarifas
                    estándar:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Si existe tarifa de "1hour": se divide entre 60 minutos</li>
                    <li>Si existe tarifa de "halfday": se divide entre 360 minutos (6 horas)</li>
                    <li>Si existe tarifa de "fullday": se divide entre 720 minutos (12 horas)</li>
                  </ul>
                  {!customRatePerMinute && calculateAutomaticRate() > 0 && (
                    <p className="bg-blue-100 p-2 rounded mt-2">
                      <strong>Tarifa automática actual:</strong> {calculateAutomaticRate().toFixed(2)}€/minuto (basada
                      en tus tarifas estándar)
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start">
              <Clock className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 mb-1">Duraciones estándar:</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>
                    <strong>30min:</strong> 30 minutos
                  </p>
                  <p>
                    <strong>1hour:</strong> 1 hora (60 minutos)
                  </p>
                  <p>
                    <strong>2hour:</strong> 2 horas (120 minutos)
                  </p>
                  <p>
                    <strong>halfday:</strong> Medio día (6 horas = 360 minutos)
                  </p>
                  <p>
                    <strong>fullday:</strong> Día completo (12 horas = 720 minutos)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mensajes de error/éxito */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg">
          <p>{success}</p>
        </div>
      )}

      {/* Botón guardar */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-black text-white hover:bg-gold hover:text-black transition-all duration-300"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Guardando..." : "Guardar Configuración"}
        </Button>
      </div>
    </div>
  )
}
