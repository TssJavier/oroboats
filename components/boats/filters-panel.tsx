"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calendar, Euro, Filter, X, Search } from "lucide-react"

interface FiltersPanelProps {
  onFiltersChange: (filters: FilterState) => void
  isLoading?: boolean
  language: "es" | "en"
  // ✅ NUEVA PROP PARA SCROLL AUTOMÁTICO
  onSearchClick?: () => void
}

export interface FilterState {
  date: string
  startTime: string
  endTime: string
  maxPrice: number | null
  sortBy: "price" | "name" | "capacity"
  sortOrder: "asc" | "desc"
}

const translations = {
  es: {
    filters: "Filtros",
    searchByDate: "Buscar por fecha y hora",
    selectDate: "Seleccionar fecha",
    startTime: "Hora inicio",
    endTime: "Hora fin",
    maxPrice: "Precio máximo por hora",
    sortBy: "Ordenar por",
    price: "Precio",
    name: "Nombre",
    capacity: "Capacidad",
    ascending: "Ascendente",
    descending: "Descendente",
    search: "Buscar disponibles",
    clearFilters: "Limpiar filtros",
    activeFilters: "Filtros activos",
    pricePerHour: "€/hora",
    today: "Hoy",
    tomorrow: "Mañana",
    timeNote: "Solo horarios en punto y media hora",
  },
  en: {
    filters: "Filters",
    searchByDate: "Search by date and time",
    selectDate: "Select date",
    startTime: "Start time",
    endTime: "End time",
    maxPrice: "Maximum price per hour",
    sortBy: "Sort by",
    price: "Price",
    name: "Name",
    capacity: "Capacity",
    ascending: "Ascending",
    descending: "Descending",
    search: "Search available",
    clearFilters: "Clear filters",
    activeFilters: "Active filters",
    pricePerHour: "€/hour",
    today: "Today",
    tomorrow: "Tomorrow",
    timeNote: "Only on-the-hour and half-hour times",
  },
}

// ✅ FUNCIÓN PARA VALIDAR Y AJUSTAR HORARIOS
const adjustTimeToValidSlot = (timeString: string): string => {
  if (!timeString) return ""

  const [hours, minutes] = timeString.split(":").map(Number)

  // Ajustar minutos a 00 o 30
  const adjustedMinutes = minutes < 15 ? 0 : minutes < 45 ? 30 : 0
  const adjustedHours = minutes >= 45 ? (hours + 1) % 24 : hours

  return `${adjustedHours.toString().padStart(2, "0")}:${adjustedMinutes.toString().padStart(2, "0")}`
}

// ✅ GENERAR OPCIONES DE TIEMPO VÁLIDAS
const generateTimeOptions = (): string[] => {
  const times: string[] = []
  for (let hour = 10; hour <= 21; hour++) {
    times.push(`${hour.toString().padStart(2, "0")}:00`)
    if (hour < 21) {
      // No agregar :30 para las 21:00
      times.push(`${hour.toString().padStart(2, "0")}:30`)
    }
  }
  return times
}

export function FiltersPanel({ onFiltersChange, isLoading = false, language, onSearchClick }: FiltersPanelProps) {
  const t = translations[language]

  const [filters, setFilters] = useState<FilterState>({
    date: "",
    startTime: "",
    endTime: "",
    maxPrice: null,
    sortBy: "price",
    sortOrder: "asc",
  })

  const [isExpanded, setIsExpanded] = useState(false)

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    let processedValue = value

    // ✅ AJUSTAR HORARIOS AUTOMÁTICAMENTE
    if (key === "startTime" || key === "endTime") {
      processedValue = adjustTimeToValidSlot(value)
    }

    const newFilters = { ...filters, [key]: processedValue }
    setFilters(newFilters)
  }

  // ✅ FUNCIÓN DE BÚSQUEDA CON SCROLL AUTOMÁTICO
  const handleSearch = () => {
    // Ejecutar la búsqueda
    onFiltersChange(filters)

    // ✅ SCROLL AUTOMÁTICO HACIA LOS PRODUCTOS
    if (onSearchClick) {
      onSearchClick()
    }

    // ✅ SCROLL ALTERNATIVO SI NO SE PASA LA FUNCIÓN
    setTimeout(() => {
      const productsSection =
        document.getElementById("products-section") ||
        document.querySelector('[data-section="products"]') ||
        document.querySelector(".max-w-6xl") // Selector del contenedor de productos

      if (productsSection) {
        productsSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
        })
      }
    }, 100) // Pequeño delay para que se procesen los filtros primero
  }

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      date: "",
      startTime: "",
      endTime: "",
      maxPrice: null,
      sortBy: "price",
      sortOrder: "asc",
    }
    setFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.date) count++
    if (filters.startTime) count++
    if (filters.endTime) count++
    if (filters.maxPrice) count++
    return count
  }

  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0]
  }

  const getTomorrowDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split("T")[0]
  }

  const activeFiltersCount = getActiveFiltersCount()
  const timeOptions = generateTimeOptions()

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-black flex items-center">
            <Filter className="h-5 w-5 mr-2 text-gold" />
            {t.filters}
            {activeFiltersCount > 0 && <Badge className="ml-2 bg-gold text-black text-xs">{activeFiltersCount}</Badge>}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="border-gray-300">
            {isExpanded ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Búsqueda por fecha y hora */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700 flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gold" />
              {t.searchByDate}
            </h4>

            {/* ✅ FECHA CON BOTONES RÁPIDOS */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">{t.selectDate}</label>
                <Input
                  type="date"
                  value={filters.date}
                  onChange={(e) => handleFilterChange("date", e.target.value)}
                  min={getTodayDate()}
                  className="bg-gray-50 border-gray-200 w-full"
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFilterChange("date", getTodayDate())}
                    className="text-xs border-gray-300 flex-1"
                  >
                    {t.today}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFilterChange("date", getTomorrowDate())}
                    className="text-xs border-gray-300 flex-1"
                  >
                    {t.tomorrow}
                  </Button>
                </div>
              </div>

              {/* ✅ HORARIOS LADO A LADO EN MÓVIL */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">{t.startTime}</label>
                  <select
                    value={filters.startTime}
                    onChange={(e) => handleFilterChange("startTime", e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-md bg-gray-50 text-sm"
                  >
                    <option value="">--:--</option>
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">{t.endTime}</label>
                  <select
                    value={filters.endTime}
                    onChange={(e) => handleFilterChange("endTime", e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-md bg-gray-50 text-sm"
                  >
                    <option value="">--:--</option>
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ✅ NOTA INFORMATIVA */}
              <p className="text-xs text-gray-500 italic">{t.timeNote}</p>
            </div>
          </div>

          {/* Filtro de precio 
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700 flex items-center">
              <Euro className="h-4 w-4 mr-2 text-gold" />
              {t.maxPrice}
            </h4>
            <div className="flex items-center space-x-3">
              <Input
                type="number"
                placeholder="0"
                value={filters.maxPrice || ""}
                onChange={(e) => handleFilterChange("maxPrice", e.target.value ? Number(e.target.value) : null)}
                className="bg-gray-50 border-gray-200 flex-1"
                min="0"
                step="10"
              />
              <span className="text-sm text-gray-500 whitespace-nowrap">{t.pricePerHour}</span>
            </div>
          </div>*/}

          {/* Ordenación */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700">{t.sortBy}</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-md bg-gray-50 text-sm"
                >
                  <option value="price">{t.price}</option>
                   {/*<option value="name">{t.name}</option>
                  <option value="capacity">{t.capacity}</option>*/}
                </select>
              </div>
              <div>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-md bg-gray-50 text-sm"
                >
                  <option value="asc">{t.ascending}</option>
                  <option value="desc">{t.descending}</option>
                </select>
              </div>
            </div>
          </div>

          {/* ✅ BOTONES DE ACCIÓN MEJORADOS PARA MÓVIL */}
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <Button
              onClick={handleSearch}
              disabled={isLoading}
              className="w-full bg-black text-white hover:bg-gold hover:text-black transition-all duration-300"
            >
              <Search className="h-4 w-4 mr-2" />
              {isLoading ? "Buscando..." : t.search}
            </Button>

            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <X className="h-4 w-4 mr-2" />
                {t.clearFilters}
              </Button>
            )}
          </div>

          {/* Filtros activos */}
          {activeFiltersCount > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h5 className="text-sm font-medium text-gray-600 mb-2">{t.activeFilters}:</h5>
              <div className="flex flex-wrap gap-2">
                {filters.date && (
                  <Badge variant="outline" className="text-xs">
                    📅 {filters.date}
                  </Badge>
                )}
                {filters.startTime && (
                  <Badge variant="outline" className="text-xs">
                    🕐 {filters.startTime}
                  </Badge>
                )}
                {filters.endTime && (
                  <Badge variant="outline" className="text-xs">
                    🕐 {filters.endTime}
                  </Badge>
                )}
                {filters.maxPrice && (
                  <Badge variant="outline" className="text-xs">
                    💰 ≤€{filters.maxPrice}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
