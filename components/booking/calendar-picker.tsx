"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react"
import { useApp } from "@/components/providers"

interface CalendarPickerProps {
  vehicleId: number
  selectedDate: string
  onDateSelect: (date: string) => void
}

interface DayInfo {
  date: string
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  isAvailable: boolean
  isBlocked: boolean
  isFullyBooked?: boolean // Nuevo estado para días sin horas disponibles
}

const translations = {
  es: {
    months: [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ],
    days: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
    today: "Hoy",
    available: "Disponible",
    blocked: "No disponible",
    past: "Fecha pasada",
    loading: "Cargando disponibilidad...",
    fullyBooked: "Completo",
  },
  en: {
    months: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    today: "Today",
    available: "Available",
    blocked: "Not available",
    past: "Past date",
    loading: "Loading availability...",
    fullyBooked: "Fully booked",
  },
}

export function CalendarPicker({ vehicleId, selectedDate, onDateSelect }: CalendarPickerProps) {
  const { language } = useApp()
  const t = translations[language]

  const [currentDate, setCurrentDate] = useState(new Date())
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [fullyBookedDates, setFullyBookedDates] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchAvailability()
  }, [vehicleId, currentDate])

  const fetchAvailability = async () => {
    setLoading(true)
    try {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1

      const response = await fetch(`/api/availability/${vehicleId}?year=${year}&month=${month}&checkFullDays=true`)
      if (response.ok) {
        const data = await response.json()
        setBlockedDates(new Set(data.blockedDates || []))
        setFullyBookedDates(new Set(data.fullyBookedDates || []))
      }
    } catch (error) {
      console.error("Error fetching availability:", error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = (): DayInfo[] => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days: DayInfo[] = []
    const current = new Date(startDate)

    // Generar 42 días (6 semanas)
    for (let i = 0; i < 42; i++) {
      // Crear la fecha en zona horaria local para evitar problemas de UTC
      const year = current.getFullYear()
      const monthNum = current.getMonth() + 1
      const month = monthNum.toString().padStart(2, "0")
      const day = current.getDate().toString().padStart(2, "0")
      const dateString = `${year}-${month}-${day}`
      const isCurrentMonth = current.getMonth() === currentDate.getMonth()
      const isPast = current < today
      const isToday = current.getTime() === today.getTime()
      const isSelected = dateString === selectedDate
      const isBlocked = blockedDates.has(dateString) || isPast
      const isFullyBooked = fullyBookedDates.has(dateString)
      const isAvailable = isCurrentMonth && !isBlocked && !isFullyBooked

      days.push({
        date: dateString,
        day: current.getDate(),
        isCurrentMonth,
        isToday,
        isSelected,
        isAvailable,
        isBlocked,
        isFullyBooked,
      })

      current.setDate(current.getDate() + 1)
    }

    return days
  }

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const handleDateClick = (day: DayInfo) => {
    if (day.isAvailable) {
      console.log("📅 Calendario: Seleccionando fecha:", day.date)
      onDateSelect(day.date)
    }
  }

  const clearSelection = () => {
    onDateSelect("")
  }

  const days = getDaysInMonth()

  return (
    <Card className="bg-white border border-gray-200">
      <CardContent className="p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth("prev")}
            className="border-gray-300 hover:border-gold"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <h3 className="text-lg font-semibold text-black">
            {t.months[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth("next")}
            className="border-gray-300 hover:border-gold"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Selected Date Display */}
        {selectedDate && (
          <div className="mb-4 p-3 bg-gold/10 border border-gold/20 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-gold mr-2" />
              <span className="text-black font-medium">
                {new Date(selectedDate).toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={clearSelection} className="h-6 w-6 p-0 hover:bg-red-100">
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {loading && (
          <div className="text-center py-4 text-gray-500">
            <div className="animate-spin w-6 h-6 border-2 border-gold border-t-transparent rounded-full mx-auto mb-2"></div>
            {t.loading}
          </div>
        )}

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {t.days.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => (
            <button
              key={index}
              onClick={() => handleDateClick(day)}
              disabled={!day.isAvailable}
              className={`
                aspect-square p-2 text-sm rounded-lg transition-all duration-200 relative
                ${
                  !day.isCurrentMonth
                    ? "text-gray-300 cursor-not-allowed"
                    : day.isAvailable
                      ? "text-black hover:bg-gold hover:text-black cursor-pointer"
                      : "text-gray-400 cursor-not-allowed"
                }
                ${
                  day.isSelected
                    ? "bg-gold text-black font-semibold ring-2 ring-gold ring-offset-2"
                    : day.isToday && day.isCurrentMonth
                      ? "bg-blue-100 text-blue-800 font-medium"
                      : day.isAvailable
                        ? "hover:bg-gray-100"
                        : ""
                }
                ${day.isBlocked && day.isCurrentMonth ? "bg-red-50 text-red-400" : ""}
                ${day.isFullyBooked && day.isCurrentMonth ? "bg-orange-50 text-orange-600" : ""}
              `}
            >
              {day.day}

              {/* Availability Indicator */}
              {day.isCurrentMonth && (
                <div
                  className={`
                  absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full
                  ${day.isAvailable ? "bg-green-500" : day.isBlocked ? "bg-red-500" : "bg-gray-300"}
                `}
                />
              )}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-3 mt-6 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">{t.available}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600">{t.blocked}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">{t.today}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-gray-600">{t.fullyBooked}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
