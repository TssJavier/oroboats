"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Euro, Loader2, AlertCircle, Package, CheckCircle } from "lucide-react"
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

interface DurationOption {
  key: string
  label: string
  description: string
  price: number
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
    vehiclesAvailable: "vehículos disponibles",
    vehicleAvailable: "vehículo disponible",
    halfDay: "Medio día",
    halfHour: "30 minutos",
    oneHour: "1 hora",
    twoHours: "2 horas",
    fourHours: "4 horas",
    options: "opciones",
    quickFun: "Diversión rápida",
    completeExperience: "Experiencia completa",
    extendedAdventure: "Aventura extendida",
    halfDayFun: "Medio día de diversión",
    hoursOfAdventure: "horas de aventura",
    fullDayFun: "Día completo de diversión",
    withoutStock: "Sin stock",
    retry: "Reintentar",
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
    vehiclesAvailable: "vehicles available",
    vehicleAvailable: "vehicle available",
    halfDay: "Half day",
    halfHour: "30 minutes",
    oneHour: "1 hour",
    twoHours: "2 horas",
    fourHours: "4 hours",
    options: "options",
    quickFun: "Quick fun",
    completeExperience: "Complete experience",
    extendedAdventure: "Extended adventure",
    halfDayFun: "Half day of fun",
    hoursOfAdventure: "hours of adventure",
    fullDayFun: "Full day of fun",
    withoutStock: "Out of stock",
    retry: "Retry",
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

  // ✅ REF PARA SCROLL A HORARIOS
  const timeSlotsRef = useRef<HTMLDivElement>(null)

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
      if (!vehicleId || isNaN(Number(vehicleId))) {
        console.error("❌ vehicleId inválido:", vehicleId)
        setError("ID de vehículo inválido")
        setLoading(false)
        return
      }

      const formattedDate = selectedDate.includes("T") ? selectedDate.split("T")[0] : selectedDate

      const url = `/api/availability/${vehicleId}/slots?date=${encodeURIComponent(formattedDate)}&durationType=${encodeURIComponent(selectedDurationType)}`

      const response = await fetch(url)

      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data.slots || [])
        setVehicleCategory(data.vehicleCategory || "")

        // ✅ SCROLL A HORARIOS cuando se cargan los slots
        setTimeout(() => {
          if (timeSlotsRef.current && window.innerWidth <= 768) {
            timeSlotsRef.current.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          }
        }, 300)
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
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

    // ✅ SCROLL AL BOTÓN SIGUIENTE (como estaba originalmente)
    setTimeout(() => {
      if (nextButtonRef?.current) {
        nextButtonRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        })
      } else {
        window.scrollBy({
          top: 300,
          behavior: "smooth",
        })
      }
    }, 100)
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

      if (!isSelectedDateToday) return true

      const [slotHours, slotMinutes] = slot.time.split(":").map(Number)
      const slotStartTimeInMinutes = slotHours * 60 + slotMinutes
      const currentTimeInMinutes = spainTime.getHours() * 60 + spainTime.getMinutes()

      return slotStartTimeInMinutes >= currentTimeInMinutes
    })
  }

  const pricingOptions = Array.isArray(vehicle.pricing) ? vehicle.pricing : []

  const getDurationOptions = (): DurationOption[] => {
    const options: DurationOption[] = []

    if (vehicle.type === "boat") {
      const halfdayOptions = pricingOptions.filter((p) => p.duration.startsWith("halfday"))
      const fulldayOptions = pricingOptions.filter((p) => p.duration.startsWith("fullday"))

      if (halfdayOptions.length > 0) {
        const minPrice = Math.min(...halfdayOptions.map((o) => o.price))
        options.push({
          key: "halfday",
          label: t.halfDay,
          description: `${halfdayOptions.length} ${t.options}`,
          price: minPrice,
        })
      }

      if (fulldayOptions.length > 0) {
        const minPrice = Math.min(...fulldayOptions.map((o) => o.price))
        options.push({
          key: "fullday",
          label: t.fullDay,
          description: `11 ${t.hoursOfAdventure}`,
          price: minPrice,
        })
      }
    } else if (vehicle.type === "jetski") {
      const durationMap = {
        "30min": { label: t.halfHour, description: t.quickFun },
        "1hour": { label: t.oneHour, description: t.completeExperience },
        "2hour": { label: t.twoHours, description: t.extendedAdventure },
        "4hour": { label: t.fourHours, description: t.halfDayFun },
        halfday: { label: t.halfDay, description: `4 ${t.hoursOfAdventure}` },
        fullday: { label: t.fullDay, description: t.fullDayFun },
      }

      pricingOptions.forEach((pricing) => {
        const durationInfo = durationMap[pricing.duration as keyof typeof durationMap]
        if (durationInfo) {
          options.push({
            key: pricing.duration,
            label: durationInfo.label,
            description: durationInfo.description,
            price: pricing.price,
          })
        }
      })
    }

    return options
  }

  const durationOptions = getDurationOptions()

  const getStockInfo = (slot: TimeSlot) => {
    if (slot.availableUnits === undefined || slot.totalUnits === undefined) {
      return null
    }

    if (slot.totalUnits <= 1) {
      return null
    }

    const available = slot.availableUnits
    const total = slot.totalUnits

    if (available === 0) {
      return { text: t.withoutStock, color: "text-red-600", icon: "❌" }
    } else if (available === 1) {
      return { text: `${available} ${t.vehicleAvailable}`, color: "text-orange-600", icon: "⚠️" }
    } else {
      return { text: `${available} ${t.vehiclesAvailable}`, color: "text-green-600", icon: "✅" }
    }
  }

  return (
    <div className="space-y-6">
      {/* Selección de duración */}
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-6">
          <h4 className="text-lg font-semibold text-black mb-4">{t.selectDuration}</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {durationOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => setSelectedDurationType(option.key)}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200 text-left
                  ${
                    selectedDurationType === option.key
                      ? "border-gold bg-gold/10"
                      : "border-gray-200 hover:border-gold/50 hover:bg-gray-50"
                  }
                `}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-black">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
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

      {/* Información de restricciones */}
      {vehicleCategory === "jetski_no_license" && (
        <Card className="bg-orange-50 border border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-orange-600 mr-3" />
              <div>
                <h4 className="font-semibold text-orange-800">{t.restrictedSlot}</h4>
                <p className="text-orange-700 text-sm">{t.restrictedJetski}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ✅ SLOTS DE TIEMPO CON REF PARA SCROLL */}
      {selectedDurationType ? (
        <Card className="bg-white border border-gray-200" ref={timeSlotsRef}>
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
                  {t.retry}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {getFilteredSlots().length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {getFilteredSlots().map((slot, index) => {
                      const isSelected = selectedTime?.start === slot.time && selectedTime?.duration === slot.duration
                      const stockInfo = getStockInfo(slot)

                      return (
                        <Button
                          key={`${slot.time}-${index}`}
                          variant={isSelected ? "default" : "outline"}
                          onClick={() => handleTimeSlotClick(slot)}
                          className={`
                            h-auto p-4 flex flex-col items-center justify-center min-h-[120px]
                            ${
                              isSelected
                                ? "bg-gold text-black hover:bg-gold/90"
                                : "border-gray-300 hover:border-gold hover:bg-gold/10"
                            }
                          `}
                        >
                          <div className="font-semibold text-center mb-2">
                            {slot.time} - {slot.endTime}
                          </div>
                          <div className="text-lg font-bold text-gold mb-2">€{slot.price}</div>
                          {stockInfo && (
                            <div className={`text-xs flex items-center ${stockInfo.color}`}>
                              <Package className="h-3 w-3 mr-1" />
                              {stockInfo.text}
                            </div>
                          )}
                          {isSelected && (
                            <Badge className="mt-2 bg-black text-white text-xs flex items-center">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {t.selected}
                            </Badge>
                          )}
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
