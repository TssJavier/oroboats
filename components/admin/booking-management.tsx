"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Euro,
  Ship,
  Shield,
  CheckCircle,
  XCircle,
  Upload,
  AlertTriangle,
  CalendarDays,
  FileText,
  Beaker,
  ExternalLink,
  UserCheck,
  Settings,
} from "lucide-react"

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
    securityDeposit: string
    inspectionStatus: string
    damageDescription?: string
    damageCost: string
    liabilityWaiverId?: number
    isTestBooking?: boolean
    isManualBooking?: boolean
    salesPerson?: string
    vehicleName?: string
    vehicleType?: string
  }
  vehicle: {
    name: string
    type: string
  } | null
}

type DateFilter = "all" | "today" | "tomorrow" | "test" | "manual"

export function BookingManagement() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [depositAction, setDepositAction] = useState<"approve" | "reject" | null>(null)
  const [damageDescription, setDamageDescription] = useState("")
  const [damageCost, setDamageCost] = useState("")
  const [damageImages, setDamageImages] = useState<File[]>([])
  const [dateFilter, setDateFilter] = useState<DateFilter>("all")
  const [debug, setDebug] = useState<any>(null)

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
      console.log("🔍 Frontend: Bookings data received:", data)

      if (Array.isArray(data)) {
        // Ordenar por fecha de creación, más recientes primero
        const sortedBookings = data.sort(
          (a, b) => new Date(b.booking.createdAt).getTime() - new Date(a.booking.createdAt).getTime(),
        )

        // Debug detallado para verificar liabilityWaiverId
        const withWaivers = sortedBookings.filter((b) => {
          const hasWaiver = b.booking.liabilityWaiverId && b.booking.liabilityWaiverId !== null
          console.log(
            `🔍 Booking ${b.booking.id} (${b.booking.customerName}): liabilityWaiverId = ${b.booking.liabilityWaiverId}, hasWaiver = ${hasWaiver}`,
          )
          return hasWaiver
        }).length

        console.log(`✅ Frontend: Found ${withWaivers} bookings with signed liability waivers`)
        setDebug({
          totalBookings: sortedBookings.length,
          withWaivers,
          sampleWaiverIds: sortedBookings
            .filter((b) => b.booking.liabilityWaiverId)
            .map((b) => b.booking.liabilityWaiverId)
            .slice(0, 5),
        })

        setBookings(sortedBookings)
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

  // ✅ FUNCIÓN CORREGIDA: Abrir documento como HTML en nueva pestaña
  const viewWaiver = async (waiverId: number, customerName: string) => {
    try {
      console.log(`🔍 Opening waiver ${waiverId} for ${customerName}...`)

      // Abrir en nueva pestaña como HTML
      const url = `/api/liability-waiver/${waiverId}/pdf`
      window.open(url, "_blank")
    } catch (error) {
      console.error("Error opening waiver:", error)
      setError("Error al abrir el documento")
    }
  }

  // ✅ NUEVA FUNCIÓN: Obtener nombre del comercial
  const getSalesPersonName = (id?: string) => {
    if (!id) return null

    const salesPerson = {
      manuel: "Manuel",
      fermin: "Fermín",
      javier: "Javier",
    }[id]

    return salesPerson || id
  }

  // Función para filtrar reservas por fecha o tipo
  const getFilteredBookings = () => {
    if (dateFilter === "test") {
      return bookings.filter((booking) => booking.booking.isTestBooking === true)
    }

    if (dateFilter === "manual") {
      return bookings.filter((booking) => booking.booking.isManualBooking === true)
    }

    if (dateFilter === "all") return bookings

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.booking.bookingDate)
      bookingDate.setHours(0, 0, 0, 0)

      if (dateFilter === "today") {
        return bookingDate.getTime() === today.getTime()
      } else if (dateFilter === "tomorrow") {
        return bookingDate.getTime() === tomorrow.getTime()
      }

      return true
    })
  }

  const filteredBookings = getFilteredBookings()

  const updateBookingStatus = async (id: number, status: string) => {
    try {
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

  const handleDepositAction = (booking: Booking, action: "approve" | "reject") => {
    setSelectedBooking(booking)
    setDepositAction(action)
    setShowDepositModal(true)
    setDamageDescription("")
    setDamageCost("")
    setDamageImages([])
  }

  const processDepositAction = async () => {
    if (!selectedBooking || !depositAction) return

    try {
      const formData = new FormData()
      formData.append("action", depositAction)

      if (depositAction === "reject") {
        formData.append("damageDescription", damageDescription)
        formData.append("damageCost", damageCost)
        damageImages.forEach((file, index) => {
          formData.append(`damageImage${index}`, file)
        })
      }

      const response = await fetch(`/api/bookings/${selectedBooking.booking.id}/deposit`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        setShowDepositModal(false)
        setSelectedBooking(null)
        setDepositAction(null)
        fetchBookings()
      } else {
        setError("Error al procesar la fianza")
      }
    } catch (err) {
      console.error("Error processing deposit:", err)
      setError("Error al procesar la fianza")
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDamageImages(Array.from(e.target.files))
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
      case "completed":
        return "bg-green-600 text-white"
      case "pending":
        return "bg-yellow-600 text-white"
      case "failed":
        return "bg-red-600 text-white"
      case "free_booking":
        return "bg-purple-600 text-white"
      case "manual":
        return "bg-orange-600 text-white"
      default:
        return "bg-gray-600 text-white"
    }
  }

  const getInspectionStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-600 text-white"
      case "pending":
        return "bg-yellow-600 text-white"
      case "damaged":
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

  const testBookingsCount = bookings.filter((b) => b.booking.isTestBooking === true).length
  const manualBookingsCount = bookings.filter((b) => b.booking.isManualBooking === true).length
  const withWaiversCount = bookings.filter((b) => b.booking.liabilityWaiverId).length

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-black">Gestión de Reservas</h2>
        <p className="text-gray-600">Administra todas las reservas de clientes</p>
      </div>

      {/* Filtros de fecha */}
      <Card className="bg-white border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-gray-800">
            <CalendarDays className="h-5 w-5 mr-2" />
            Filtrar por Fecha
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant={dateFilter === "all" ? "default" : "outline"}
              onClick={() => setDateFilter("all")}
              className={dateFilter === "all" ? "bg-black text-white" : ""}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Todas ({bookings.length})
            </Button>
            <Button
              variant={dateFilter === "today" ? "default" : "outline"}
              onClick={() => setDateFilter("today")}
              className={dateFilter === "today" ? "bg-green-600 text-white hover:bg-green-700" : ""}
            >
              <Clock className="h-4 w-4 mr-2" />
              Hoy (
              {
                bookings.filter((b) => {
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  const bookingDate = new Date(b.booking.bookingDate)
                  bookingDate.setHours(0, 0, 0, 0)
                  return bookingDate.getTime() === today.getTime()
                }).length
              }
              )
            </Button>
            <Button
              variant={dateFilter === "tomorrow" ? "default" : "outline"}
              onClick={() => setDateFilter("tomorrow")}
              className={dateFilter === "tomorrow" ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              Mañana (
              {
                bookings.filter((b) => {
                  const tomorrow = new Date()
                  tomorrow.setDate(tomorrow.getDate() + 1)
                  tomorrow.setHours(0, 0, 0, 0)
                  const bookingDate = new Date(b.booking.bookingDate)
                  bookingDate.setHours(0, 0, 0, 0)
                  return bookingDate.getTime() === tomorrow.getTime()
                }).length
              }
              )
            </Button>
            <Button
              variant={dateFilter === "manual" ? "default" : "outline"}
              onClick={() => setDateFilter("manual")}
              className={dateFilter === "manual" ? "bg-orange-600 text-white hover:bg-orange-700" : ""}
            >
              <Settings className="h-4 w-4 mr-2" />
              Manuales ({manualBookingsCount})
            </Button>
            <Button
              variant={dateFilter === "test" ? "default" : "outline"}
              onClick={() => setDateFilter("test")}
              className={dateFilter === "test" ? "bg-purple-600 text-white hover:bg-purple-700" : ""}
            >
              <Beaker className="h-4 w-4 mr-2" />
              Pruebas ({testBookingsCount})
            </Button>
          </div>
          {dateFilter !== "all" && (
            <div className="mt-3 text-sm text-gray-600">
              Mostrando {filteredBookings.length} reserva(s)
              {dateFilter === "today"
                ? " para hoy"
                : dateFilter === "tomorrow"
                  ? " para mañana"
                  : dateFilter === "test"
                    ? " de prueba"
                    : dateFilter === "manual"
                      ? " manuales"
                      : ""}
            </div>
          )}
          <div className="mt-2 text-xs text-gray-500">
            {withWaiversCount} reserva(s) con documento de exención firmado
          </div>
        </CardContent>
      </Card>

      {/* Panel de ayuda para clientes */}
      <Card className="bg-blue-50 border-blue-200 mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-blue-800">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Información para Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-blue-800 mb-2">Estados de Reserva:</h4>
              <ul className="space-y-1 text-blue-700">
                <li>
                  <Badge className="bg-green-600 text-white mr-2">confirmed</Badge>Reserva confirmada automáticamente
                </li>
                <li>
                  <Badge className="bg-blue-600 text-white mr-2">completed</Badge>Servicio completado
                </li>
                <li>
                  <Badge className="bg-red-600 text-white mr-2">cancelled</Badge>Reserva cancelada
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 mb-2">Estados de Fianza:</h4>
              <ul className="space-y-1 text-blue-700">
                <li>
                  <Badge className="bg-yellow-600 text-white mr-2">pending</Badge>Pendiente de inspección
                </li>
                <li>
                  <Badge className="bg-green-600 text-white mr-2">approved</Badge>Fianza devuelta
                </li>
                <li>
                  <Badge className="bg-red-600 text-white mr-2">damaged</Badge>Daños encontrados
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>💡 Flujo actual:</strong> Las reservas se confirman automáticamente al pagar. Si hay fianza, debes
              inspeccionarla antes de completar la reserva. Las fianzas se procesan automáticamente después de 7 días.
            </p>
          </div>
        </CardContent>
      </Card>

      {Array.isArray(filteredBookings) && filteredBookings.length > 0 ? (
        <div className="space-y-6">
          {filteredBookings.map((booking) => {
            // Debug específico para cada reserva
            const hasWaiver = booking.booking.liabilityWaiverId && booking.booking.liabilityWaiverId !== null
            const isManual = booking.booking.isManualBooking === true
            const salesPersonName = getSalesPersonName(booking.booking.salesPerson)

            return (
              <Card
                key={booking.booking.id}
                className={`bg-white border border-gray-200 hover:shadow-lg transition-all ${
                  booking.booking.isTestBooking
                    ? "border-l-4 border-l-purple-500"
                    : isManual
                      ? "border-l-4 border-l-orange-500"
                      : ""
                }`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-bold text-black flex items-center">
                        <User className="h-5 w-5 text-gold mr-2" />
                        {booking.booking.customerName}
                        {booking.booking.isTestBooking && (
                          <Badge className="ml-2 bg-purple-600 text-white">
                            <Beaker className="h-3 w-3 mr-1" />
                            Prueba
                          </Badge>
                        )}
                        {isManual && (
                          <Badge className="ml-2 bg-orange-600 text-white">
                            <Settings className="h-3 w-3 mr-1" />
                            Manual
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <Ship className="h-4 w-4 mr-1" />
                        {/* ✅ MEJORADO: Mostrar información del vehículo */}
                        {booking.booking.vehicleName || booking.vehicle?.name || "Producto eliminado"}
                        {(booking.booking.vehicleType || booking.vehicle?.type) && (
                          <span className="text-gray-500 ml-1">
                            ({booking.booking.vehicleType || booking.vehicle?.type})
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Badge className={getStatusColor(booking.booking.status)}>{booking.booking.status}</Badge>
                      <Badge className={getPaymentStatusColor(booking.booking.paymentStatus)}>
                        {booking.booking.paymentStatus}
                      </Badge>
                      {Number(booking.booking.securityDeposit) > 0 && (
                        <Badge className={getInspectionStatusColor(booking.booking.inspectionStatus)}>
                          Fianza: {booking.booking.inspectionStatus}
                        </Badge>
                      )}
                      {/* Badge para documento firmado */}
                      {hasWaiver && (
                        <Badge className="bg-purple-600 text-white">
                          <FileText className="h-3 w-3 mr-1" />
                          Documento firmado
                        </Badge>
                      )}
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
                        {/* ✅ NUEVO: Mostrar comercial si es reserva manual */}
                        {salesPersonName && (
                          <div className="flex items-center text-gray-600">
                            <UserCheck className="h-3 w-3 mr-2" />
                            <span className="font-medium">Comercial: {salesPersonName}</span>
                          </div>
                        )}
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
                      {Number(booking.booking.securityDeposit) > 0 && (
                        <div className="text-sm text-gray-600">
                          <Shield className="h-3 w-3 inline mr-1" />
                          Fianza: €{booking.booking.securityDeposit}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-700">Acciones</h4>
                      <div className="flex flex-col gap-2">
                        {/* ✅ BOTÓN CORREGIDO: Ver documento como HTML */}
                        {hasWaiver && (
                          <Button
                            size="sm"
                            onClick={() => viewWaiver(booking.booking.liabilityWaiverId!, booking.booking.customerName)}
                            className="bg-purple-600 text-white hover:bg-purple-700"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Ver Documento
                          </Button>
                        )}

                        {/* Lógica de estados automática */}
                        {booking.booking.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => updateBookingStatus(booking.booking.id, "confirmed")}
                            className="bg-green-600 text-white hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Auto-Confirmar
                          </Button>
                        )}

                        {/* Gestión de fianzas */}
                        {booking.booking.status === "confirmed" &&
                          Number(booking.booking.securityDeposit) > 0 &&
                          booking.booking.inspectionStatus === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleDepositAction(booking, "approve")}
                                className="bg-green-600 text-white hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Completar Fianza
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleDepositAction(booking, "reject")}
                                className="bg-red-600 text-white hover:bg-red-700"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Rechazar Fianza
                              </Button>
                            </>
                          )}

                        {/* Completar reserva normal */}
                        {booking.booking.status === "confirmed" &&
                          (Number(booking.booking.securityDeposit) === 0 ||
                            booking.booking.inspectionStatus === "approved") && (
                            <Button
                              size="sm"
                              onClick={() => updateBookingStatus(booking.booking.id, "completed")}
                              className="bg-blue-600 text-white hover:blue-700"
                            >
                              Completar Reserva
                            </Button>
                          )}

                        {booking.booking.status !== "cancelled" && booking.booking.status !== "completed" && (
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

                  {/* Información de daños si existe */}
                  {booking.booking.damageDescription && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <h5 className="font-semibold text-red-800 mb-1 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Daños Registrados:
                      </h5>
                      <p className="text-red-700 text-sm mb-1">{booking.booking.damageDescription}</p>
                      {Number(booking.booking.damageCost) > 0 && (
                        <p className="text-red-700 text-sm font-semibold">Coste: €{booking.booking.damageCost}</p>
                      )}
                    </div>
                  )}

                  {booking.booking.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <h5 className="font-semibold text-gray-700 mb-1">Notas:</h5>
                      <p className="text-gray-600 text-sm">{booking.booking.notes}</p>
                    </div>
                  )}

                  <div className="mt-4 text-xs text-gray-500">
                    Reserva creada: {new Date(booking.booking.createdAt).toLocaleString("es-ES")}
                    {isManual && salesPersonName && <span className="ml-2">• Comercial: {salesPersonName}</span>}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="bg-white border border-gray-200">
          <CardContent className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {dateFilter === "all"
                ? "No hay reservas"
                : dateFilter === "test"
                  ? "No hay reservas de prueba"
                  : dateFilter === "manual"
                    ? "No hay reservas manuales"
                    : `No hay reservas para ${dateFilter === "today" ? "hoy" : "mañana"}`}
            </h3>
            <p className="text-gray-500">
              {dateFilter === "all"
                ? "Las reservas aparecerán aquí cuando los clientes hagan pedidos"
                : "Prueba con otro filtro de fecha o revisa las reservas de otros días"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal para gestión de fianzas */}
      {showDepositModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                {depositAction === "approve" ? "Completar Fianza" : "Rechazar Fianza"}
              </h2>
              <p className="text-gray-600 mt-1">
                Reserva #{selectedBooking.booking.id} - {selectedBooking.booking.customerName}
              </p>
            </div>

            <div className="p-6">
              {depositAction === "approve" ? (
                <div className="text-center">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">¿Completar la fianza?</h3>
                  <p className="text-gray-600 mb-4">
                    Se devolverá la fianza completa de €{selectedBooking.booking.securityDeposit} al cliente.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Rechazar Fianza</h3>
                    <p className="text-gray-600">
                      Documenta los daños encontrados para justificar la retención de la fianza.
                    </p>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-1">Descripción de los daños *</div>
                    <Textarea
                      value={damageDescription}
                      onChange={(e) => setDamageDescription(e.target.value)}
                      placeholder="Describe detalladamente los daños encontrados..."
                      className="mt-1"
                      rows={4}
                    />
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-1">Coste de los daños (€)</div>
                    <Input
                      type="number"
                      value={damageCost}
                      onChange={(e) => setDamageCost(e.target.value)}
                      placeholder="0.00"
                      className="mt-1"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-1">Fotos de los daños</div>
                    <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <Input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="damageImages"
                      />
                      <label htmlFor="damageImages" className="cursor-pointer text-blue-600 hover:text-blue-700">
                        Subir fotos de los daños
                      </label>
                      <p className="text-gray-500 text-sm mt-1">PNG, JPG hasta 10MB cada una</p>
                    </div>
                    {damageImages.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">{damageImages.length} archivo(s) seleccionado(s)</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDepositModal(false)
                  setSelectedBooking(null)
                  setDepositAction(null)
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={processDepositAction}
                className={
                  depositAction === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                }
                disabled={depositAction === "reject" && !damageDescription.trim()}
              >
                {depositAction === "approve" ? "Devolver Fianza" : "Rechazar y Retener"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
