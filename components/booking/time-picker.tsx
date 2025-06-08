"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Euro, Loader2, AlertCircle } from "lucide-react"
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
  nextButtonRef?: React.RefObject<HTMLButtonElement> // ✅ Cambiado de HTMLElement a HTMLButtonElement
}

interface TimeSlot {
  time: string
  available: boolean
  type?: string
  restricted?: boolean
  restrictionReason?: string
  endTime?: string
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
    fullDay: "Todo el día",
    restrictedJetski: "Motos sin licencia: No disponible de 14:00 a 16:00",
    restrictedBoat: "Barcos sin licencia: No disponible de 14:00 a 16:00 (solo medio día)",
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

  const [selectedDuration, setSelectedDuration] = useState<PricingOption | null>(null)
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
    if (selectedDate && selectedDuration) {
      fetchAvailableSlots()
    }
  }, [selectedDate, vehicleId, selectedDuration])

  const fetchAvailableSlots = async () => {
    if (!selectedDuration) return

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
      console.log(`   - Duración: ${selectedDuration.duration}`)

      // Usar la ruta correcta con [Id]
      const url = `/api/availability/${vehicleId}/slots?date=${encodeURIComponent(formattedDate)}&duration=${encodeURIComponent(selectedDuration.duration)}`
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
    if (!selectedDuration || !slot.available) return

    onTimeSelect({
      start: slot.time,
      end: slot.endTime || slot.time,
      duration: selectedDuration.duration,
      price: selectedDuration.price,
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

      // ✅ NUEVO: Solo bloquear si el slot YA EMPEZÓ (no si está por empezar)
      // Ejemplo: Si son las 7:15 (435 min) y el slot es 7:30 (450 min), SÍ se puede reservar
      // Solo se bloquea si son las 7:35 (455 min) y el slot es 7:30 (450 min)
      console.log(`🕐 Slot ${slot.time}: ${slotStartTimeInMinutes} min vs Current: ${currentTimeInMinutes} min`)

      return slotStartTimeInMinutes >= currentTimeInMinutes
    })
  }

  const getSlotLabel = (slot: TimeSlot) => {
    if (slot.type === "morning-half") return `${t.morning} (10:00 - 15:00)`
    if (slot.type === "afternoon-half") return `${t.afternoon} (15:00 - 21:00)`
    if (slot.type === "fullday") return `${t.fullDay} (10:00 - 21:00)`

    // Para slots regulares, mostrar el rango de tiempo
    if (slot.endTime) {
      return `${slot.time} - ${slot.endTime}`
    }

    return slot.time
  }

  const pricingOptions = Array.isArray(vehicle.pricing) ? vehicle.pricing : []

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
      {/* Duration Selection */}
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-6">
          <h4 className="text-lg font-semibold text-black mb-4">{t.selectDuration}</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pricingOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => setSelectedDuration(option)}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200 text-left
                  ${
                    selectedDuration?.duration === option.duration
                      ? "border-gold bg-gold/10"
                      : "border-gray-200 hover:border-gold/50 hover:bg-gray-50"
                  }
                `}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-black">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.duration}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gold">€{option.price}</div>
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
      {selectedDuration ? (
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
                      const isSelected =
                        selectedTime?.start === slot.time && selectedTime?.duration === selectedDuration.duration

                      return (
                        <Button
                          key={`${slot.time}-${index}`}
                          variant={isSelected ? "default" : "outline"}
                          onClick={() => handleTimeSlotClick(slot)}
                          className={`
                            h-auto p-4 flex flex-col items-center justify-center min-h-[80px]
                            ${
                              isSelected
                                ? "bg-gold text-black hover:bg-gold/90"
                                : "border-gray-300 hover:border-gold hover:bg-gold/10"
                            }
                          `}
                        >
                          <div className="font-semibold text-center">{getSlotLabel(slot)}</div>
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
