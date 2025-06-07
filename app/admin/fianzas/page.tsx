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
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      setError(null)

      // Usar el endpoint normal de bookings
      const response = await fetch("/api/bookings")
      if (!response.ok) {
        throw new Error("Error al cargar las reservas")
      }

      const data = await response.json()
      console.log("All bookings from API:", data)

      // Filtrar reservas con fianza - usar la estructura correcta
      const bookingsWithDeposit = data.filter((item: any) => {
        // Los datos vienen en formato { booking: {...}, vehicle: {...} }
        const booking = item.booking || item
        const deposit = Number(booking.securityDeposit || 0)
        console.log(`Booking ${booking.id}: securityDeposit=${booking.securityDeposit}, deposit=${deposit}`)
        return deposit > 0
      })

      console.log("Bookings with deposit:", bookingsWithDeposit)
      setBookings(bookingsWithDeposit)
      setDebugInfo({
        total: data.length,
        withDeposit: bookingsWithDeposit.length,
        sample: bookingsWithDeposit.slice(0, 3),
      })
    } catch (error) {
      console.error("Error fetching bookings:", error)
      setError("Error al cargar las reservas. Verifica la conexión a la base de datos.")
    } finally {
      setLoading(false)
    }
  }

  const filteredBookings = bookings.filter((item) => {
    const booking = item.booking || item
    const searchLower = searchTerm.toLowerCase()
    return (
      booking.customerName?.toLowerCase().includes(searchLower) ||
      booking.customerEmail?.toLowerCase().includes(searchLower) ||
      booking.id?.toString().includes(searchLower)
    )
  })

  const pendingBookings = filteredBookings.filter((item) => {
    const booking = item.booking || item
    return booking.inspectionStatus === "pending"
  })

  const approvedBookings = filteredBookings.filter((item) => {
    const booking = item.booking || item
    return booking.inspectionStatus === "approved"
  })

  const damagedBookings = filteredBookings.filter((item) => {
    const booking = item.booking || item
    return booking.inspectionStatus === "damaged"
  })

  const formatDate = (dateString: string) => {
    if (!dateString) return "Fecha no disponible"
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

      {/* Debug Info */}
      {debugInfo && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <p>Total reservas: {debugInfo.total || 0}</p>
            <p>Con fianza: {debugInfo.withDeposit || 0}</p>
            {debugInfo.sample && (
              <details className="mt-2">
                <summary className="cursor-pointer text-blue-600">Ver muestra de datos</summary>
                <div className="mt-2 text-xs bg-white p-2 rounded overflow-auto max-h-60">
                  <pre>{JSON.stringify(debugInfo.sample, null, 2)}</pre>
                </div>
              </details>
            )}
          </CardContent>
        </Card>
      )}

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
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Todas ({filteredBookings.length})</TabsTrigger>
            <TabsTrigger value="pending">Pendientes ({pendingBookings.length})</TabsTrigger>
            <TabsTrigger value="approved">Aprobadas ({approvedBookings.length})</TabsTrigger>
            <TabsTrigger value="damaged">Con Daños ({damagedBookings.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filteredBookings.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">No hay reservas con fianza</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Las reservas con fianza aparecerán aquí cuando tengan security_deposit {">"} 0
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredBookings.map((item) => (
                <BookingCard
                  key={item.booking?.id || item.id}
                  item={item}
                  onInspect={() => setSelectedBooking(item)}
                  formatDate={formatDate}
                  getStatusBadge={getStatusBadge}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingBookings.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">No hay inspecciones pendientes</p>
                </CardContent>
              </Card>
            ) : (
              pendingBookings.map((item) => (
                <BookingCard
                  key={item.booking?.id || item.id}
                  item={item}
                  onInspect={() => setSelectedBooking(item)}
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
                  <p className="text-gray-500">No hay fianzas aprobadas</p>
                </CardContent>
              </Card>
            ) : (
              approvedBookings.map((item) => (
                <BookingCard
                  key={item.booking?.id || item.id}
                  item={item}
                  onInspect={() => setSelectedBooking(item)}
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
                  <p className="text-gray-500">No hay reservas con daños</p>
                </CardContent>
              </Card>
            ) : (
              damagedBookings.map((item) => (
                <BookingCard
                  key={item.booking?.id || item.id}
                  item={item}
                  onInspect={() => setSelectedBooking(item)}
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
                  id: selectedBooking.booking?.id || selectedBooking.id,
                  customerName: selectedBooking.booking?.customerName || selectedBooking.customerName,
                  customerEmail: selectedBooking.booking?.customerEmail || selectedBooking.customerEmail || "",
                  vehicleName: selectedBooking.vehicle?.name || "Vehículo",
                  bookingDate: selectedBooking.booking?.bookingDate || selectedBooking.bookingDate || "",
                  startTime: selectedBooking.booking?.startTime || selectedBooking.startTime || "",
                  endTime: selectedBooking.booking?.endTime || selectedBooking.endTime || "",
                  securityDeposit: Number(
                    selectedBooking.booking?.securityDeposit || selectedBooking.securityDeposit || 0,
                  ),
                  inspectionStatus:
                    selectedBooking.booking?.inspectionStatus || selectedBooking.inspectionStatus || "pending",
                  damageDescription:
                    selectedBooking.booking?.damageDescription || selectedBooking.damageDescription || "",
                  damageCost: Number(selectedBooking.booking?.damageCost || selectedBooking.damageCost || 0),
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

function BookingCard({ item, onInspect, formatDate, getStatusBadge }: any) {
  const booking = item.booking || item
  const vehicle = item.vehicle || {}

  const refundAmount = Math.max(0, Number(booking.securityDeposit) - Number(booking.damageCost || 0))

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              Reserva #{booking.id} - {booking.customerName}
            </CardTitle>
            <CardDescription>
              {booking.customerEmail} • {formatDate(booking.bookingDate)}
            </CardDescription>
            <CardDescription className="text-sm text-gray-500">
              Vehículo: {vehicle.name || "No especificado"}
            </CardDescription>
          </div>
          <div className="text-right">{getStatusBadge(booking.inspectionStatus)}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Horario</p>
            <p>
              {booking.startTime || "N/A"} - {booking.endTime || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Fianza</p>
            <p className="text-lg font-semibold">€{booking.securityDeposit}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">A devolver</p>
            <p className={`text-lg font-semibold ${refundAmount === 0 ? "text-red-600" : "text-green-600"}`}>
              €{refundAmount}
            </p>
          </div>
        </div>

        {booking.damageDescription && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm font-medium text-red-800 mb-1">Daños registrados:</p>
            <p className="text-sm text-red-700">{booking.damageDescription}</p>
            {booking.damageCost > 0 && <p className="text-sm text-red-700 mt-1">Coste: €{booking.damageCost}</p>}
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={onInspect} variant="outline">
            {booking.inspectionStatus === "pending" ? "Realizar Inspección" : "Ver Detalles"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
