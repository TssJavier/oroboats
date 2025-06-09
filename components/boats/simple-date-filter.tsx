"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Search } from "lucide-react"

interface SimpleDateFilterProps {
  onDateSelect: (date: string) => void
  isLoading?: boolean
  language: "es" | "en"
}

const translations = {
  es: {
    today: "Hoy",
    tomorrow: "Mañana",
    searching: "Buscando...",
  },
  en: {
    today: "Today",
    tomorrow: "Tomorrow",
    searching: "Searching...",
  },
}

export function SimpleDateFilter({ onDateSelect, isLoading = false, language }: SimpleDateFilterProps) {
  const t = translations[language]
  const [selectedDate, setSelectedDate] = useState<string>("")
  const dateInputRef = useRef<HTMLInputElement>(null)

  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0]
  }

  const getTomorrowDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split("T")[0]
  }

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString + "T00:00:00")
    return date.toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
  }

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    onDateSelect(date)
  }

  const handleTodayClick = () => {
    handleDateSelect(getTodayDate())
  }

  const handleTomorrowClick = () => {
    handleDateSelect(getTomorrowDate())
  }

  const handleCalendarClick = () => {
    // Activar el input oculto cuando se hace clic en el botón
    if (dateInputRef.current) {
      dateInputRef.current.showPicker()
    }
  }

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      handleDateSelect(e.target.value)
    }
  }

  return (
    <div className="mb-8">
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Fecha seleccionada */}
            {selectedDate && (
              <div className="text-center">
                <span className="text-lg font-semibold text-gray-800">{formatDateForDisplay(selectedDate)}</span>
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={handleTodayClick}
                className="border-gray-300 hover:border-gold hover:bg-gold/5"
                disabled={isLoading}
              >
                {t.today}
              </Button>

              <Button
                variant="outline"
                onClick={handleTomorrowClick}
                className="border-gray-300 hover:border-gold hover:bg-gold/5"
                disabled={isLoading}
              >
                {t.tomorrow}
              </Button>

              {/* ✅ BOTÓN DE CALENDARIO CON INPUT POSICIONADO */}
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={handleCalendarClick}
                  className="border-gray-300 hover:border-gold hover:bg-gold/5 px-3 cursor-pointer"
                  disabled={isLoading}
                >
                  <Calendar className="h-5 w-5 text-gold" />
                </Button>

                {/* Input posicionado en el área específica */}
                <input
                  ref={dateInputRef}
                  type="date"
                  min={getTodayDate()}
                  value={selectedDate}
                  onChange={handleDateInputChange}
                  className="fixed top-[335px] left-2/4 transform -translate-x-[110px] opacity-0 pointer-events-none z-50"
                  style={{ width: "1px", height: "1px" }}
                />
              </div>
            </div>

            {/* Estado de búsqueda */}
            {isLoading && (
              <div className="flex items-center justify-center text-gold">
                <Search className="h-4 w-4 mr-2 animate-pulse" />
                <span className="text-sm font-medium">{t.searching}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
