"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, Phone, Mail, Euro, Ship } from "lucide-react"

interface Booking {
  booking: {
    id: number
    customerName: string
    customerEmail: string
    customerPhone: string
    bookingDate: string
    timeSlot: string
    duration: string
    totalPrice: string
    status: string
    paymentStatus: string
    notes?: string
    createdAt: string
  }
  vehicle: {
    name: string
    type: string
  } | null
}

export function BookingManagement() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      setError(null)
      const response = await fetch("/api/bookings")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Ensure data is an array
      if (Array.isArray(data)) {
        setBookings(data)
      } else {
        console.error("API returned non-array data:", data)
        setBookings([])
        setError("Error: Los datos recibidos no son válidos")
      }
    } catch (error) {
      console.error("Error fetching bookings:", error)
      setBookings([])
      setError("Error al cargar las reservas. Verifica la conexión a la base de datos.")
    } finally {
      setLoading(false)
    }
  }

  const updateBookingStatus = async (id: number, status: string) => {
    try {
      // Si el estado es "cancelled", usar el endpoint específico de cancelación
      if (status === "cancelled") {
        const response = await fetch(`/api/bookings/${id}/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })

        if (response.ok) {
          fetchBookings()
        } else {
          setError("Error al cancelar la reserva")
        }
      } else {
        // Para otros estados, usar el endpoint normal
        const response = await fetch(`/api/bookings/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        })

        if (response.ok) {
          fetchBookings()
        } else {
          setError("Error al actualizar la reserva")
        }
      }
    } catch (err) {
      console.error("Error updating booking:", err)
      setError("Error al actualizar la reserva")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-600 text-white"
      case "pending":
        return "bg-yellow-600 text-white"
      case "cancelled":
        return "bg-red-600 text-white"
      case "completed":
        return "bg-blue-600 text-white"
      default:
        return "bg-gray-600 text-white"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-600 text-white"
      case "pending":
        return "bg-yellow-600 text-white"
      case "failed":
        return "bg-red-600 text-white"
      default:
        return "bg-gray-600 text-white"
    }
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-black">Gestión de Reservas</h2>
          <p className="text-gray-600">Administra todas las reservas de clientes</p>
        </div>

        <Card className="bg-red-50 border border-red-200">
          <CardContent className="text-center py-12">
            <div className="text-red-600 mb-4">⚠️ Error de Conexión</div>
            <h3 className="text-xl font-semibold text-red-800 mb-2">{error}</h3>
            <p className="text-red-600 mb-6">Verifica que la base de datos esté conectada y que las tablas existan.</p>
            <Button onClick={fetchBookings} className="bg-red-600 text-white hover:bg-red-700">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-black">Gestión de Reservas</h2>
          <p className="text-gray-600">Cargando reservas...</p>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-black">Gestión de Reservas</h2>
        <p className="text-gray-600">Administra todas las reservas de clientes</p>
      </div>

      {Array.isArray(bookings) && bookings.length > 0 ? (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <Card key={booking.booking.id} className="bg-white border border-gray-200 hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-bold text-black flex items-center">
                      <User className="h-5 w-5 text-gold mr-2" />
                      {booking.booking.customerName}
                    </CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Ship className="h-4 w-4 mr-1" />
                      {booking.vehicle?.name || "Producto eliminado"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(booking.booking.status)}>{booking.booking.status}</Badge>
                    <Badge className={getPaymentStatusColor(booking.booking.paymentStatus)}>
                      {booking.booking.paymentStatus}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-700 flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      Contacto
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Mail className="h-3 w-3 mr-2" />
                        {booking.booking.customerEmail}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Phone className="h-3 w-3 mr-2" />
                        {booking.booking.customerPhone}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-700 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Fecha y Hora
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="text-gray-600">
                        {new Date(booking.booking.bookingDate).toLocaleDateString("es-ES")}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-3 w-3 mr-2" />
                        {booking.booking.timeSlot}
                      </div>
                      <div className="text-gray-600">Duración: {booking.booking.duration}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-700 flex items-center">
                      <Euro className="h-4 w-4 mr-1" />
                      Precio
                    </h4>
                    <div className="text-2xl font-bold text-gold">€{booking.booking.totalPrice}</div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-700">Acciones</h4>
                    <div className="flex flex-col gap-2">
                      {booking.booking.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => updateBookingStatus(booking.booking.id, "confirmed")}
                          className="bg-green-600 text-white hover:bg-green-700"
                        >
                          Confirmar
                        </Button>
                      )}
                      {booking.booking.status === "confirmed" && (
                        <Button
                          size="sm"
                          onClick={() => updateBookingStatus(booking.booking.id, "completed")}
                          className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Completar
                        </Button>
                      )}
                      {booking.booking.status !== "cancelled" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateBookingStatus(booking.booking.id, "cancelled")}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {booking.booking.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h5 className="font-semibold text-gray-700 mb-1">Notas:</h5>
                    <p className="text-gray-600 text-sm">{booking.booking.notes}</p>
                  </div>
                )}

                <div className="mt-4 text-xs text-gray-500">
                  Reserva creada: {new Date(booking.booking.createdAt).toLocaleString("es-ES")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-white border border-gray-200">
          <CardContent className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No hay reservas</h3>
            <p className="text-gray-500">Las reservas aparecerán aquí cuando los clientes hagan pedidos</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
