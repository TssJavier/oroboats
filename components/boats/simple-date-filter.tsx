"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronDown, Search } from "lucide-react"

interface SimpleDateFilterProps {
  onDateSelect: (date: string) => void
  isLoading?: boolean
  language: "es" | "en"
}

const translations = {
  es: {
    chooseDate: "Elegir fecha",
    today: "Hoy",
    tomorrow: "Mañana",
    searching: "Buscando...",
    selectDate: "Selecciona una fecha",
  },
  en: {
    chooseDate: "Choose date",
    today: "Today",
    tomorrow: "Tomorrow",
    searching: "Searching...",
    selectDate: "Select a date",
  },
}

export function SimpleDateFilter({ onDateSelect, isLoading = false, language }: SimpleDateFilterProps) {
  const t = translations[language]
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>("")

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
    setIsOpen(false)
    onDateSelect(date)
  }

  const handleQuickDate = (date: string) => {
    handleDateSelect(date)
  }

  return (
    <div className="mb-8">
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            {/* Botón principal de fecha */}
            <div className="relative flex-1 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full justify-between border-gray-300 hover:border-gold hover:bg-gold/5 h-12"
                disabled={isLoading}
              >
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-3 text-gold" />
                  <span className="font-medium">
                    {selectedDate ? formatDateForDisplay(selectedDate) : t.chooseDate}
                  </span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </Button>

              {/* Calendario desplegable */}
              {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
                  <div className="space-y-3">
                    {/* Botones rápidos */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickDate(getTodayDate())}
                        className="text-sm border-gray-300 hover:bg-gold/10"
                      >
                        {t.today}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickDate(getTomorrowDate())}
                        className="text-sm border-gray-300 hover:bg-gold/10"
                      >
                        {t.tomorrow}
                      </Button>
                    </div>

                    {/* Input de fecha */}
                    <div>
                      <input
                        type="date"
                        min={getTodayDate()}
                        onChange={(e) => handleDateSelect(e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded-md bg-gray-50 text-sm"
                        placeholder={t.selectDate}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Estado de búsqueda */}
            {isLoading && (
              <div className="flex items-center text-gold">
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
