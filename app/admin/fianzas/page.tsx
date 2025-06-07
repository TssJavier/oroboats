"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DamageInspection } from "@/components/admin/damage-inspection"
import { AdminHeader } from "@/components/admin/admin-header"

export default function SecurityDepositsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/bookings")
      if (!response.ok) {
        throw new Error("Error al cargar las reservas")
      }

      const data = await response.json()

      // Filtrar solo reservas con fianza
      const bookingsWithDeposit = data.filter(
        (booking: any) => booking.security_deposit && Number(booking.security_deposit) > 0,
      )

      setBookings(bookingsWithDeposit)
    } catch (error) {
      console.error("Error fetching bookings:", error)
      setError("Error al cargar las reservas")
    } finally {
      setLoading(false)
    }
  }

  const filteredBookings = bookings.filter((booking) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      booking.customer_name?.toLowerCase().includes(searchLower) ||
      booking.customer_email?.toLowerCase().includes(searchLower) ||
      booking.id?.toString().includes(searchLower)
    )
  })

  const pendingBookings = filteredBookings.filter((booking) => booking.inspection_status === "pending")
  const approvedBookings = filteredBookings.filter((booking) => booking.inspection_status === "approved")
  const damagedBookings = filteredBookings.filter((booking) => booking.inspection_status === "damaged")

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
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

  const handleInspectionComplete = () => {
    setSelectedBooking(null)
    fetchBookings()
  }

  return (
    <div className="container mx-auto p-6">
      <AdminHeader />

      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Gestión de Fianzas</h2>
        <p className="text-gray-600">Administra las fianzas de seguridad y inspecciones de daños</p>
      </div>

      {/* Buscador */}
      <div className="mb-6">
        <Input
          placeholder="Buscar por nombre, email o ID de reserva..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-700">{error}</p>
            <Button onClick={fetchBookings} className="mt-2" variant="outline">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-8">
          <p>Cargando reservas...</p>
        </div>
      ) : (
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">Pendientes ({pendingBookings.length})</TabsTrigger>
            <TabsTrigger value="approved">Aprobadas ({approvedBookings.length})</TabsTrigger>
            <TabsTrigger value="damaged">Con Daños ({damagedBookings.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingBookings.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">No hay inspecciones pendientes</p>
                </CardContent>
              </Card>
            ) : (
              pendingBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onInspect={() => setSelectedBooking(booking)}
                  formatDate={formatDate}
                  getStatusBadge={getStatusBadge}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {approvedBookings.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">No hay fianzas aprobadas para devolución</p>
                </CardContent>
              </Card>
            ) : (
              approvedBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onInspect={() => setSelectedBooking(booking)}
                  formatDate={formatDate}
                  getStatusBadge={getStatusBadge}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="damaged" className="space-y-4">
            {damagedBookings.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">No hay reservas con daños registrados</p>
                </CardContent>
              </Card>
            ) : (
              damagedBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onInspect={() => setSelectedBooking(booking)}
                  formatDate={formatDate}
                  getStatusBadge={getStatusBadge}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Modal de inspección */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Inspección de Daños</h2>
              <Button
                variant="ghost"
                onClick={() => setSelectedBooking(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </Button>
            </div>
            <div className="p-4">
              <DamageInspection
                booking={{
                  id: selectedBooking.id,
                  customerName: selectedBooking.customer_name,
                  customerEmail: selectedBooking.customer_email,
                  vehicleName: selectedBooking.vehicle_name || "Vehículo",
                  bookingDate: selectedBooking.booking_date,
                  startTime: selectedBooking.start_time,
                  endTime: selectedBooking.end_time,
                  securityDeposit: Number(selectedBooking.security_deposit),
                  inspectionStatus: selectedBooking.inspection_status,
                  damageDescription: selectedBooking.damage_description,
                  damageCost: Number(selectedBooking.damage_cost || 0),
                }}
                onInspectionComplete={handleInspectionComplete}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BookingCard({ booking, onInspect, formatDate, getStatusBadge }: any) {
  const refundAmount = Math.max(0, Number(booking.security_deposit) - Number(booking.damage_cost || 0))

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              Reserva #{booking.id} - {booking.customer_name}
            </CardTitle>
            <CardDescription>
              {booking.customer_email} • {formatDate(booking.booking_date)}
            </CardDescription>
          </div>
          <div className="text-right">{getStatusBadge(booking.inspection_status)}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Horario</p>
            <p>
              {booking.start_time} - {booking.end_time}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Fianza</p>
            <p className="text-lg font-semibold">€{booking.security_deposit}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">A devolver</p>
            <p className={`text-lg font-semibold ${refundAmount === 0 ? "text-red-600" : "text-green-600"}`}>
              €{refundAmount}
            </p>
          </div>
        </div>

        {booking.damage_description && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm font-medium text-red-800 mb-1">Daños registrados:</p>
            <p className="text-sm text-red-700">{booking.damage_description}</p>
            {booking.damage_cost > 0 && <p className="text-sm text-red-700 mt-1">Coste: €{booking.damage_cost}</p>}
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={onInspect} variant="outline">
            {booking.inspection_status === "pending" ? "Realizar Inspección" : "Ver Detalles"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
