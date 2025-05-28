"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar, Settings } from "lucide-react"

interface Vehicle {
  id: number
  name: string
  available: boolean
}

interface AvailabilitySchedule {
  id: number
  vehicleId: number
  dayOfWeek: number
  startTime: string
  endTime: string
  isAvailable: boolean
}

const DAYS_OF_WEEK = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

export function AvailabilityManagement() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null)
  const [availability, setAvailability] = useState<AvailabilitySchedule[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchVehicles()
  }, [])

  useEffect(() => {
    if (selectedVehicle) {
      fetchAvailability(selectedVehicle)
    }
  }, [selectedVehicle])

  const fetchVehicles = async () => {
    try {
      const response = await fetch("/api/vehicles?all=true")
      if (response.ok) {
        const data = await response.json()
        setVehicles(data.vehicles || [])
        if (data.vehicles?.length > 0) {
          setSelectedVehicle(data.vehicles[0].id)
        }
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error)
    }
  }

  const fetchAvailability = async (vehicleId: number) => {
    try {
      const response = await fetch(`/api/availability/${vehicleId}`)
      if (response.ok) {
        const data = await response.json()
        setAvailability(data.availability || [])
      }
    } catch (error) {
      console.error("Error fetching availability:", error)
    }
  }

  const createDefaultSchedule = async () => {
    if (!selectedVehicle) return

    setLoading(true)
    try {
      const response = await fetch("/api/db-fix")
      if (response.ok) {
        await fetchAvailability(selectedVehicle)
      }
    } catch (error) {
      console.error("Error creating schedule:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black">Gestión de Disponibilidad</h2>
          <p className="text-gray-600">Configura los horarios disponibles para cada vehículo</p>
        </div>
        <Button
          onClick={createDefaultSchedule}
          disabled={loading}
          className="bg-gold text-black hover:bg-black hover:text-white"
        >
          <Settings className="h-4 w-4 mr-2" />
          {loading ? "Creando..." : "Crear Horarios por Defecto"}
        </Button>
      </div>

      {/* Vehicle Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-gold" />
            Seleccionar Vehículo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vehicles.map((vehicle) => (
              <button
                key={vehicle.id}
                onClick={() => setSelectedVehicle(vehicle.id)}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200 text-left
                  ${
                    selectedVehicle === vehicle.id
                      ? "border-gold bg-gold/10"
                      : "border-gray-200 hover:border-gold/50 hover:bg-gray-50"
                  }
                `}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-black">{vehicle.name}</div>
                    <Badge variant={vehicle.available ? "default" : "secondary"} className="mt-1">
                      {vehicle.available ? "Disponible" : "No disponible"}
                    </Badge>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Availability Schedule */}
      {selectedVehicle && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-gold" />
              Horarios de {vehicles.find((v) => v.id === selectedVehicle)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availability.length > 0 ? (
              <div className="space-y-4">
                {DAYS_OF_WEEK.map((dayName, dayIndex) => {
                  const daySchedule = availability.find((a) => a.dayOfWeek === dayIndex)
                  return (
                    <div key={dayIndex} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="font-medium text-black">{dayName}</div>
                      {daySchedule ? (
                        <div className="flex items-center space-x-4">
                          <span className="text-gray-600">
                            {daySchedule.startTime} - {daySchedule.endTime}
                          </span>
                          <Badge variant={daySchedule.isAvailable ? "default" : "secondary"}>
                            {daySchedule.isAvailable ? "Disponible" : "Cerrado"}
                          </Badge>
                        </div>
                      ) : (
                        <Badge variant="secondary">Sin configurar</Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No hay horarios configurados para este vehículo</p>
                <Button
                  onClick={createDefaultSchedule}
                  disabled={loading}
                  className="bg-gold text-black hover:bg-black hover:text-white"
                >
                  Crear Horarios por Defecto (9:00 - 19:00)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
