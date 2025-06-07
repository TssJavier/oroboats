"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface DamageInspectionProps {
  booking: {
    id: number
    customerName: string
    customerEmail: string
    vehicleName?: string
    bookingDate: string
    startTime: string
    endTime: string
    securityDeposit: number
    inspectionStatus: string
    damageDescription?: string
    damageCost?: number
  }
  onInspectionComplete: () => void
}

export function DamageInspection({ booking, onInspectionComplete }: DamageInspectionProps) {
  const [loading, setLoading] = useState(false)
  const [damageDescription, setDamageDescription] = useState(booking.damageDescription || "")
  const [damageCost, setDamageCost] = useState(booking.damageCost || 0)
  const [inspectionStatus, setInspectionStatus] = useState(booking.inspectionStatus || "pending")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/bookings/${booking.id}/damage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inspectionStatus,
          damageDescription: damageDescription.trim() || null,
          damageCost: inspectionStatus === "damaged" ? damageCost : 0,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al actualizar la inspección")
      }

      toast.success(
        inspectionStatus === "approved"
          ? "Fianza aprobada para devolución"
          : "Daños registrados y fianza parcialmente retenida",
      )

      onInspectionComplete()
    } catch (error) {
      console.error("Error updating inspection:", error)
      toast.error("Error al actualizar la inspección")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getStatusBadge = () => {
    switch (inspectionStatus) {
      case "pending":
        return <Badge className="bg-yellow-500">Pendiente</Badge>
      case "approved":
        return <Badge className="bg-green-500">Aprobado</Badge>
      case "damaged":
        return <Badge className="bg-red-500">Daños</Badge>
      default:
        return <Badge className="bg-gray-500">Desconocido</Badge>
    }
  }

  const refundAmount = Math.max(0, booking.securityDeposit - damageCost)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Inspección de Daños</CardTitle>
        <CardDescription>
          Reserva #{booking.id} - {booking.customerName} ({booking.customerEmail})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Vehículo</p>
              <p>{booking.vehicleName || "Vehículo"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Fecha</p>
              <p>
                {formatDate(booking.bookingDate)} ({booking.startTime} - {booking.endTime})
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">Fianza</p>
            <p className="text-lg font-semibold">€{booking.securityDeposit}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500 mb-2">Estado de la inspección</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={inspectionStatus === "approved" ? "default" : "outline"}
                className={inspectionStatus === "approved" ? "bg-green-600 hover:bg-green-700" : ""}
                onClick={() => setInspectionStatus("approved")}
              >
                Sin daños
              </Button>
              <Button
                type="button"
                variant={inspectionStatus === "damaged" ? "default" : "outline"}
                className={inspectionStatus === "damaged" ? "bg-red-600 hover:bg-red-700" : ""}
                onClick={() => setInspectionStatus("damaged")}
              >
                Con daños
              </Button>
            </div>
          </div>

          {inspectionStatus === "damaged" && (
            <div className="space-y-4 border border-red-200 rounded-lg p-4 bg-red-50">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción de los daños</label>
                <Textarea
                  value={damageDescription}
                  onChange={(e) => setDamageDescription(e.target.value)}
                  placeholder="Describe los daños encontrados..."
                  rows={3}
                  className="bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coste de reparación (€)</label>
                <Input
                  type="number"
                  min="0"
                  max={booking.securityDeposit}
                  step="0.01"
                  value={damageCost}
                  onChange={(e) => setDamageCost(Number(e.target.value))}
                  className="bg-white"
                />
              </div>

              <div className="bg-white p-3 rounded border border-gray-200">
                <div className="flex justify-between text-sm">
                  <span>Fianza depositada:</span>
                  <span>€{booking.securityDeposit}</span>
                </div>
                <div className="flex justify-between text-sm text-red-600">
                  <span>Coste de reparación:</span>
                  <span>-€{damageCost}</span>
                </div>
                <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-medium">
                  <span>A devolver:</span>
                  <span className={refundAmount === 0 ? "text-red-600" : "text-green-600"}>€{refundAmount}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Procesando..." : "Guardar inspección"}
        </Button>
      </CardFooter>
    </Card>
  )
}
