"use client"

import { useState, useEffect } from "react"
import { cookieUtils } from "@/lib/cookies"

type DateFilter = "all" | "today" | "tomorrow" | "test" | "manual" | "partial"

interface AdminPreferences {
  dateFilter: DateFilter
  updateDateFilter: (filter: DateFilter) => void
  clearPreferences: () => void
}

export function useAdminPreferences(): AdminPreferences {
  const [dateFilter, setDateFilter] = useState<DateFilter>("all")

  // Cargar preferencias al montar el componente
  useEffect(() => {
    const savedFilter = cookieUtils.get("admin-date-filter") as DateFilter
    if (savedFilter && ["all", "today", "tomorrow", "test", "manual", "partial"].includes(savedFilter)) {
      setDateFilter(savedFilter)
    }
  }, [])

  // Función para actualizar el filtro y guardarlo en cookies
  const updateDateFilter = (filter: DateFilter) => {
    setDateFilter(filter)
    cookieUtils.set("admin-date-filter", filter, 30) // Guardar por 30 días
  }

  // Función para limpiar todas las preferencias
  const clearPreferences = () => {
    cookieUtils.delete("admin-date-filter")
    setDateFilter("all")
  }

  return {
    dateFilter,
    updateDateFilter,
    clearPreferences,
  }
}
