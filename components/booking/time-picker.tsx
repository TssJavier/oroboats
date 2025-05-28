"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Euro, Loader2 } from "lucide-react"
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
}

interface TimeSlot {
  time: string
  available: boolean
}

interface PricingOption {
  duration: string
  price: number
  label: string
  isCustom?: boolean
}

const translations = {
  es: {
    selectDuration: "Selecciona duración",
    availableSlots: "Horarios disponibles",
    noSlots: "No hay horarios disponibles para esta fecha",
    loading: "Cargando horarios...",
    from: "Desde",
    to: "Hasta",
    price: "Precio",
    selected: "Seleccionado",
    customDuration: "Duración personalizada",
    selectCustomTime: "Selecciona horas y minutos",
    customDurationTitle: "Selecciona la duración exacta",
    hours: "Horas",
    minutes: "Minutos",
    estimatedPrice: "Precio estimado",
    apply: "Aplicar",
    todayInfo: "Hoy - Solo desde 30min después de la hora actual",
  },
  en: {
    selectDuration: "Select duration",
    availableSlots: "Available time slots",
    noSlots: "No time slots available for this date",
    loading: "Loading time slots...",
    from: "From",
    to: "Price",
    selected: "Selected",
    customDuration: "Custom duration",
    selectCustomTime: "Select hours and minutes",
    customDurationTitle: "Select exact duration",
    hours: "Hours",
    minutes: "Minutes",
    estimatedPrice: "Estimated price",
    apply: "Apply",
    todayInfo: "Today - Only from 30min after current time",
  },
}

export function TimePicker({ vehicleId, selectedDate, vehicle, selectedTime, onTimeSelect }: TimePickerProps) {
  const { language } = useApp()
  const t = translations[language]

  const [selectedDuration, setSelectedDuration] = useState<PricingOption | null>(null)
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [customDuration, setCustomDuration] = useState<{ hours: number; minutes: number }>({ hours: 1, minutes: 0 })
  const [showCustomDuration, setShowCustomDuration] = useState(false)
  const [customRatePerMinute, setCustomRatePerMinute] = useState<number>(0)

  useEffect(() => {
    console.log("🎯 TimePicker: Fecha recibida:", selectedDate)
    if (selectedDate) {
      fetchAvailableSlots()
      fetchCustomRate()
    }
  }, [selectedDate, vehicleId])

  const fetchAvailableSlots = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/availability/${vehicleId}/slots?date=${selectedDate}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data.slots || [])
      }
    } catch (error) {
      console.error("Error fetching time slots:", error)
      setAvailableSlots([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomRate = async () => {
    try {
      const response = await fetch(`/api/pricing/${vehicleId}`)
      if (response.ok) {
        const data = await response.json()
        setCustomRatePerMinute(data.customRatePerMinute || 0)
      }
    } catch (error) {
      console.error("Error fetching custom rate:", error)
    }
  }

  const calculateCustomPrice = (hours: number, minutes: number): number => {
    const totalMinutes = hours * 60 + minutes

    if (customRatePerMinute > 0) {
      return Math.round(customRatePerMinute * totalMinutes)
    } else {
      const pricingOptions = Array.isArray(vehicle.pricing) ? vehicle.pricing : []
      const hourlyOption = pricingOptions.find((option) => option.duration === "1hour")

      if (!hourlyOption) {
        const halfdayOption = pricingOptions.find((option) => option.duration === "halfday")
        if (halfdayOption) {
          const hourlyRate = halfdayOption.price / 6
          return Math.round((hourlyRate / 60) * totalMinutes)
        }
      } else {
        const hourlyRate = hourlyOption.price / 60
        return Math.round(hourlyRate * totalMinutes)
      }

      return Math.round(2 * totalMinutes)
    }
  }

  const calculateEndTime = (startTime: string, duration: string): string => {
    const [hours, minutes] = startTime.split(":").map(Number)
    let totalMinutes = hours * 60 + minutes

    if (duration.startsWith("custom_")) {
      const durationPart = duration.substring(7)
      const hoursMatch = durationPart.match(/(\d+)h/)
      const minutesMatch = durationPart.match(/h(\d+)/)

      const durationHours = hoursMatch ? Number.parseInt(hoursMatch[1]) : 0
      const durationMinutes = minutesMatch ? Number.parseInt(minutesMatch[1]) : 0

      totalMinutes += durationHours * 60 + durationMinutes
    } else {
      switch (duration) {
        case "30min":
          totalMinutes += 30
          break
        case "1hour":
          totalMinutes += 60
          break
        case "2hour":
          totalMinutes += 120
          break
        case "halfday":
          totalMinutes += 360
          break
        case "fullday":
          totalMinutes += 720
          break
        default:
          totalMinutes += 60
      }
    }

    const endHours = Math.floor(totalMinutes / 60)
    const endMinutes = totalMinutes % 60
    return `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`
  }

  const isSlotAvailable = (startTime: string, duration: string): boolean => {
    const endTime = calculateEndTime(startTime, duration)
    const startIndex = availableSlots.findIndex((slot) => slot.time === startTime)

    if (startIndex === -1) return false

    const [endHours, endMinutes] = endTime.split(":").map(Number)
    const endTimeMinutes = endHours * 60 + endMinutes

    for (let i = startIndex; i < availableSlots.length; i++) {
      const slot = availableSlots[i]
      const [slotHours, slotMinutes] = slot.time.split(":").map(Number)
      const slotTimeMinutes = slotHours * 60 + slotMinutes

      if (slotTimeMinutes >= endTimeMinutes) break
      if (!slot.available) return false
    }

    return true
  }

  const handleTimeSlotClick = (startTime: string) => {
    if (!selectedDuration) return

    const endTime = calculateEndTime(startTime, selectedDuration.duration)

    onTimeSelect({
      start: startTime,
      end: endTime,
      duration: selectedDuration.duration,
      price: selectedDuration.price,
    })
  }

  // Función para obtener la hora actual en España
  const getSpainTime = (): Date => {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Madrid" }))
  }

  // Función para verificar si la fecha seleccionada es hoy en España
  const isToday = (dateString: string): boolean => {
    console.log("🔍 Verificando si es hoy - Fecha recibida:", dateString)

    const spainTime = getSpainTime()
    const selectedDate = new Date(dateString + "T00:00:00")

    const todayInSpain = new Date(spainTime.getFullYear(), spainTime.getMonth(), spainTime.getDate())
    const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())

    console.log("🗓️ Comparando fechas:")
    console.log("Hoy en España:", todayInSpain.toDateString(), "Día:", todayInSpain.getDate())
    console.log("Fecha seleccionada:", selectedDateOnly.toDateString(), "Día:", selectedDateOnly.getDate())
    console.log("¿Es hoy?:", todayInSpain.getTime() === selectedDateOnly.getTime())

    return todayInSpain.getTime() === selectedDateOnly.getTime()
  }

  const getAvailableSlotsForDuration = () => {
    if (!selectedDuration) return []

    const spainTime = getSpainTime()
    const isSelectedDateToday = isToday(selectedDate)

    console.log("=== FILTRADO DE SLOTS (ZONA HORARIA ESPAÑA) ===")
    console.log("Fecha seleccionada:", selectedDate)
    console.log("Es hoy:", isSelectedDateToday)
    console.log("Hora actual España:", spainTime.toLocaleTimeString())
    console.log("Día actual:", spainTime.getDate())
    console.log("Día seleccionado:", new Date(selectedDate).getDate())

    const filteredSlots = availableSlots.filter((slot) => {
      // 1. Verificar disponibilidad básica
      if (!slot.available) {
        return false
      }

      // 2. Verificar duración disponible
      if (!isSlotAvailable(slot.time, selectedDuration.duration)) {
        return false
      }

      // 3. Si no es hoy, mostrar todos los slots disponibles
      if (!isSelectedDateToday) {
        console.log(`✅ Fecha futura - mostrando slot ${slot.time}`)
        return true
      }

      // 4. Si es hoy, filtrar por tiempo (zona horaria España)
      const [slotHours, slotMinutes] = slot.time.split(":").map(Number)
      const slotTimeInMinutes = slotHours * 60 + slotMinutes

      // Calcular tiempo mínimo (hora actual España + 30 minutos)
      const currentTimeInMinutes = spainTime.getHours() * 60 + spainTime.getMinutes()
      const minimumTimeInMinutes = currentTimeInMinutes + 30

      const isInFuture = slotTimeInMinutes >= minimumTimeInMinutes

      console.log(
        `Slot ${slot.time} (${slotTimeInMinutes}min) vs Mínimo ${Math.floor(minimumTimeInMinutes / 60)}:${(minimumTimeInMinutes % 60).toString().padStart(2, "0")} (${minimumTimeInMinutes}min) = ${isInFuture ? "✅" : "❌"}`,
      )

      return isInFuture
    })

    console.log(
      "Slots finales disponibles:",
      filteredSlots.map((s) => s.time),
    )
    console.log("=========================")

    return filteredSlots
  }

  const pricingOptions = Array.isArray(vehicle.pricing) ? vehicle.pricing : []

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

            {/* Opción de duración personalizada */}
            <button
              onClick={() => setShowCustomDuration(!showCustomDuration)}
              className={`
                p-4 rounded-lg border-2 transition-all duration-200 text-left
                ${showCustomDuration ? "border-gold bg-gold/10" : "border-gray-200 hover:border-gold/50 hover:bg-gray-50"}
              `}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-black">{t.customDuration}</div>
                  <div className="text-sm text-gray-600">{t.selectCustomTime}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gold">+</div>
                </div>
              </div>
            </button>

            {showCustomDuration && (
              <div className="p-4 rounded-lg border-2 border-gold bg-gold/5">
                <div className="mb-3 font-medium text-black">{t.customDurationTitle}</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">{t.hours}</label>
                    <select
                      value={customDuration.hours}
                      onChange={(e) => setCustomDuration({ ...customDuration, hours: Number.parseInt(e.target.value) })}
                      className="w-full p-2 border border-gray-200 rounded-md"
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((hour) => (
                        <option key={hour} value={hour}>
                          {hour}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">{t.minutes}</label>
                    <select
                      value={customDuration.minutes}
                      onChange={(e) =>
                        setCustomDuration({ ...customDuration, minutes: Number.parseInt(e.target.value) })
                      }
                      className="w-full p-2 border border-gray-200 rounded-md"
                    >
                      {[0, 15, 30, 45].map((minute) => (
                        <option key={minute} value={minute}>
                          {minute}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {(customDuration.hours > 0 || customDuration.minutes > 0) && (
                  <div className="mt-4 flex justify-between items-center">
                    <div>
                      <div className="text-sm text-gray-600">{t.estimatedPrice}:</div>
                      <div className="text-xl font-bold text-gold">
                        €{calculateCustomPrice(customDuration.hours, customDuration.minutes)}
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        const durationStr = `${customDuration.hours}h${customDuration.minutes > 0 ? customDuration.minutes : ""}`
                        const customOption = {
                          duration: `custom_${durationStr}`,
                          price: calculateCustomPrice(customDuration.hours, customDuration.minutes),
                          label: `${customDuration.hours}h ${customDuration.minutes > 0 ? `${customDuration.minutes}min` : ""}`,
                          isCustom: true,
                        }
                        setSelectedDuration(customOption)
                        setShowCustomDuration(false)
                      }}
                      disabled={customDuration.hours === 0 && customDuration.minutes === 0}
                      className="bg-gold text-black hover:bg-black hover:text-white"
                    >
                      {t.apply}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Time Slots */}
      {selectedDuration && (
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-black flex items-center">
                <Clock className="h-5 w-5 text-gold mr-2" />
                {t.availableSlots}
              </h4>
              {isToday(selectedDate) && (
                <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {t.todayInfo} ({getSpainTime().toLocaleTimeString()})
                </div>
              )}
            </div>

            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gold mx-auto mb-2" />
                <p className="text-gray-500">{t.loading}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getAvailableSlotsForDuration().length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {getAvailableSlotsForDuration().map((slot) => {
                      const endTime = calculateEndTime(slot.time, selectedDuration.duration)
                      const isSelected =
                        selectedTime?.start === slot.time && selectedTime?.duration === selectedDuration.duration

                      return (
                        <Button
                          key={slot.time}
                          variant={isSelected ? "default" : "outline"}
                          onClick={() => handleTimeSlotClick(slot.time)}
                          className={`
                            h-auto p-3 flex flex-col items-center
                            ${
                              isSelected
                                ? "bg-gold text-black hover:bg-gold/90"
                                : "border-gray-300 hover:border-gold hover:bg-gold/10"
                            }
                          `}
                        >
                          <div className="font-semibold">{slot.time}</div>
                          <div className="text-xs opacity-75">
                            {t.to} {endTime}
                          </div>
                          {isSelected && <Badge className="mt-1 bg-black text-white text-xs">{t.selected}</Badge>}
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
                    {selectedTime.duration.startsWith("custom_")
                      ? selectedTime.duration.replace("custom_", "").replace("h", "h ")
                      : pricingOptions.find((p) => p.duration === selectedTime.duration)?.label}
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
