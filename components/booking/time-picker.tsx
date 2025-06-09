"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Euro, Loader2, AlertCircle, Users } from "lucide-react"
import { useApp } from "@/components/providers"
import type { Vehicle } from "@/lib/db/schema"

interface TimePickerProps {
  vehicleId: number
  selectedDate: string
  vehicle: Vehicle
  selectedTime: {
    start: string
    end: string
    duration: string
    price: number
  } | null
  onTimeSelect: (timeSlot: {
    start: string
    end: string
    duration: string
    price: number
  }) => void
  nextButtonRef: React.RefObject<HTMLButtonElement | null>
}

interface TimeSlot {
  time: string
  endTime: string
  available: boolean
  type?: string
  restricted?: boolean
  restrictionReason?: string
  duration: string
  label: string
  price: number
  availableUnits?: number
  totalUnits?: number
}

interface PricingOption {
  duration: string
  price: number
  label: string
}

const translations = {
  es: {
    selectDuration: "Selecciona duración",
    availableSlots: "Horarios disponibles",
    noSlots: "No hay horarios disponibles para esta fecha",
    loading: "Cargando horarios...",
    from: "De",
    to: "a",
    price: "Precio",
    selected: "Seleccionado",
    businessHours: "Horario: 10:00 - 21:00",
    restrictedSlot: "Horario restringido",
    selectDurationFirst: "Selecciona una duración primero",
    morning: "Mañana",
    afternoon: "Tarde",
    fullDay: "Día completo",
    restrictedJetski: "Motos sin licencia: No disponible de 14:00 a 16:00",
    restrictedBoat: "Barcos sin licencia: No disponible de 14:00 a 16:00 (solo medio día)",
    unitsAvailable: "unidades disponibles",
    halfDay: "Medio día",
    halfHour: "Media hora",
    byHours: "Por horas",
  },
  en: {
    selectDuration: "Select duration",
    availableSlots: "Available time slots",
    noSlots: "No time slots available for this date",
    loading: "Loading time slots...",
    from: "From",
    to: "to",
    price: "Price",
    selected: "Selected",
    businessHours: "Hours: 10:00 - 21:00",
    restrictedSlot: "Restricted hours",
    selectDurationFirst: "Select a duration first",
    morning: "Morning",
    afternoon: "Afternoon",
    fullDay: "Full day",
    restrictedJetski: "Jet skis without license: Not available from 14:00 to 16:00",
    restrictedBoat: "Boats without license: Not available from 14:00 to 16:00 (half-day only)",
    unitsAvailable: "units available",
    halfDay: "Half day",
    halfHour: "Half hour",
    byHours: "By hours",
  },
}

export function TimePicker({
  vehicleId,
  selectedDate,
  vehicle,
  selectedTime,
  onTimeSelect,
  nextButtonRef,
}: TimePickerProps) {
  const { language } = useApp()
  const t = translations[language]

  const [selectedDurationType, setSelectedDurationType] = useState<string | null>(null)
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [vehicleCategory, setVehicleCategory] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  // Log inicial para verificar props
  useEffect(() => {
    console.log("🔍 TimePicker Props:")
    console.log("   - vehicleId:", vehicleId, typeof vehicleId)
    console.log("   - selectedDate:", selectedDate)
    console.log("   - vehicle:", vehicle)
  }, [vehicleId, selectedDate, vehicle])

  useEffect(() => {
    if (selectedDate && selectedDurationType) {
      fetchAvailableSlots()
    }
  }, [selectedDate, vehicleId, selectedDurationType])

  const fetchAvailableSlots = async () => {
    if (!selectedDurationType) return

    setLoading(true)
    setError(null)

    try {
      // Verificar que vehicleId sea válido
      console.log("🔍 Verificando vehicleId:", vehicleId, typeof vehicleId)

      if (!vehicleId || isNaN(Number(vehicleId))) {
        console.error("❌ vehicleId inválido:", vehicleId)
        setError("ID de vehículo inválido")
        setLoading(false)
        return
      }

      // Formatear la fecha correctamente (YYYY-MM-DD)
      const formattedDate = selectedDate.includes("T") ? selectedDate.split("T")[0] : selectedDate

      // Añadir logs para depuración
      console.log(`🔍 Solicitando slots:`)
      console.log(`   - Vehicle ID: ${vehicleId} (tipo: ${typeof vehicleId})`)
      console.log(`   - Fecha: ${formattedDate}`)
      console.log(`   - Tipo de duración: ${selectedDurationType}`)

      // ✅ CORRECTO: Usar la ruta con [id] no [vehicleId]
      const url = `/api/availability/${vehicleId}/slots?date=${encodeURIComponent(formattedDate)}&durationType=${encodeURIComponent(selectedDurationType)}`
      console.log(`🌐 URL completa: ${url}`)

      const response = await fetch(url)

      console.log(`🔄 Respuesta: ${response.status} ${response.statusText}`)

      if (response.ok) {
        const data = await response.json()
        console.log("📊 Datos recibidos:", data)
        setAvailableSlots(data.slots || [])
        setVehicleCategory(data.vehicleCategory || "")
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error(`❌ Error ${response.status}:`, errorData)
        setError(`Error ${response.status}: ${errorData.error || "No se pudieron cargar los horarios"}`)
        setAvailableSlots([])
      }
    } catch (error) {
      console.error("❌ Error de conexión:", error)
      setError("Error de conexión: No se pudieron cargar los horarios")
      setAvailableSlots([])
    } finally {
      setLoading(false)
    }
  }

  const handleTimeSlotClick = (slot: TimeSlot) => {
    if (!slot.available) return

    onTimeSelect({
      start: slot.time,
      end: slot.endTime,
      duration: slot.duration,
      price: slot.price,
    })

    // ✅ Scroll automático al botón "Siguiente" después de seleccionar
    setTimeout(() => {
      if (nextButtonRef?.current) {
        nextButtonRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        })
      } else {
        // Fallback: scroll hacia abajo si no hay referencia
        window.scrollBy({
          top: 300,
          behavior: "smooth",
        })
      }
    }, 100) // Pequeño delay para asegurar que el estado se actualice
  }

  const getSpainTime = (): Date => {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Madrid" }))
  }

  const isToday = (dateString: string): boolean => {
    const spainTime = getSpainTime()
    const selectedDate = new Date(dateString + "T00:00:00")
    const todayInSpain = new Date(spainTime.getFullYear(), spainTime.getMonth(), spainTime.getDate())
    const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
    return todayInSpain.getTime() === selectedDateOnly.getTime()
  }

  const getFilteredSlots = () => {
    const spainTime = getSpainTime()
    const isSelectedDateToday = isToday(selectedDate)

    return availableSlots.filter((slot) => {
      if (!slot.available || slot.restricted) return false

      // Si no es hoy, mostrar todos los slots disponibles
      if (!isSelectedDateToday) return true

      // Para el día de hoy, solo bloquear slots que YA HAN EMPEZADO
      const [slotHours, slotMinutes] = slot.time.split(":").map(Number)
      const slotStartTimeInMinutes = slotHours * 60 + slotMinutes
      const currentTimeInMinutes = spainTime.getHours() * 60 + spainTime.getMinutes()

      console.log(`🕐 Slot ${slot.time}: ${slotStartTimeInMinutes} min vs Current: ${currentTimeInMinutes} min`)

      return slotStartTimeInMinutes >= currentTimeInMinutes
    })
  }

  const getSlotLabel = (slot: TimeSlot) => {
    let label = `${slot.time} - ${slot.endTime}`

    // Añadir información de stock si está disponible
    if (slot.availableUnits !== undefined && slot.totalUnits !== undefined) {
      if (slot.totalUnits > 1) {
        label += ` (${slot.availableUnits} ${t.unitsAvailable})`
      }
    }

    return label
  }

  const pricingOptions = Array.isArray(vehicle.pricing) ? vehicle.pricing : []

  // ✅ ARREGLADO: Mejor categorización para motos de agua
  const durationTypes = []

  // Para barcos
  if (vehicle.type === "boat") {
    const halfdayOptions = pricingOptions.filter((p) => p.duration.startsWith("halfday"))
    const fulldayOptions = pricingOptions.filter((p) => p.duration.startsWith("fullday"))

    if (halfdayOptions.length > 0) {
      durationTypes.push({
        key: "halfday",
        label: t.halfDay,
        options: halfdayOptions,
      })
    }

    if (fulldayOptions.length > 0) {
      durationTypes.push({
        key: "fullday",
        label: t.fullDay,
        options: fulldayOptions,
      })
    }
  }

  // Para motos de agua
  if (vehicle.type === "jetski") {
    const halfHourOptions = pricingOptions.filter((p) => p.duration === "30min")
    const hourlyOptions = pricingOptions.filter(
      (p) => p.duration !== "30min" && !p.duration.startsWith("halfday") && !p.duration.startsWith("fullday"),
    )

    if (halfHourOptions.length > 0) {
      durationTypes.push({
        key: "30min",
        label: t.halfHour,
        options: halfHourOptions,
      })
    }

    if (hourlyOptions.length > 0) {
      durationTypes.push({
        key: "hourly",
        label: t.byHours,
        options: hourlyOptions,
      })
    }
  }

  // Función para obtener el mensaje de restricción apropiado
  const getRestrictionMessage = () => {
    if (vehicleCategory === "jetski_no_license") {
      return t.restrictedJetski
    } else if (vehicleCategory === "boat_no_license") {
      return t.restrictedBoat
    }
    return ""
  }

  return (
    <div className="space-y-6">
      {/* Duration Type Selection */}
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-6">
          <h4 className="text-lg font-semibold text-black mb-4">{t.selectDuration}</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {durationTypes.map((type) => (
              <button
                key={type.key}
                onClick={() => setSelectedDurationType(type.key)}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200 text-left
                  ${
                    selectedDurationType === type.key
                      ? "border-gold bg-gold/10"
                      : "border-gray-200 hover:border-gold/50 hover:bg-gray-50"
                  }
                `}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-black">{type.label}</div>
                    <div className="text-sm text-gray-600">{type.options.length} opciones</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gold">Desde €{Math.min(...type.options.map((o) => o.price))}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Información de restricciones para vehículos sin licencia */}
      {(vehicleCategory === "jetski_no_license" || vehicleCategory === "boat_no_license") && (
        <Card className="bg-orange-50 border border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-orange-600 mr-3" />
              <div>
                <h4 className="font-semibold text-orange-800">Horario restringido</h4>
                <p className="text-orange-700 text-sm">{getRestrictionMessage()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Slots */}
      {selectedDurationType ? (
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-black flex items-center">
                <Clock className="h-5 w-5 text-gold mr-2" />
                {t.availableSlots}
              </h4>
              <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">{t.businessHours}</div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gold mx-auto mb-2" />
                <p className="text-gray-500">{t.loading}</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-500 font-medium">{error}</p>
                <Button
                  onClick={fetchAvailableSlots}
                  variant="outline"
                  className="mt-4 border-red-300 text-red-600 hover:bg-red-50"
                >
                  Reintentar
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {getFilteredSlots().length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {getFilteredSlots().map((slot, index) => {
                      const isSelected = selectedTime?.start === slot.time && selectedTime?.duration === slot.duration

                      return (
                        <Button
                          key={`${slot.time}-${index}`}
                          variant={isSelected ? "default" : "outline"}
                          onClick={() => handleTimeSlotClick(slot)}
                          className={`
                            h-auto p-4 flex flex-col items-center justify-center min-h-[100px]
                            ${
                              isSelected
                                ? "bg-gold text-black hover:bg-gold/90"
                                : "border-gray-300 hover:border-gold hover:bg-gold/10"
                            }
                          `}
                        >
                          <div className="font-semibold text-center mb-2">{getSlotLabel(slot)}</div>
                          <div className="text-sm opacity-75">€{slot.price}</div>
                          {slot.availableUnits !== undefined &&
                            slot.totalUnits !== undefined &&
                            slot.totalUnits > 1 && (
                              <div className="flex items-center mt-1 text-xs">
                                <Users className="h-3 w-3 mr-1" />
                                {slot.availableUnits}/{slot.totalUnits}
                              </div>
                            )}
                          {isSelected && <Badge className="mt-2 bg-black text-white text-xs">{t.selected}</Badge>}
                        </Button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">{t.noSlots}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gray-50 border border-gray-200">
          <CardContent className="p-8 text-center">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{t.selectDurationFirst}</p>
          </CardContent>
        </Card>
      )}

      {/* Selected Time Summary */}
      {selectedTime && (
        <Card className="bg-gold/10 border border-gold/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-gold mr-2" />
                <div>
                  <div className="font-semibold text-black">
                    {selectedTime.start} - {selectedTime.end}
                  </div>
                  <div className="text-sm text-gray-600">
                    {pricingOptions.find((p) => p.duration === selectedTime.duration)?.label}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center text-gold font-bold text-xl">
                  <Euro className="h-5 w-5 mr-1" />
                  {selectedTime.price}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
