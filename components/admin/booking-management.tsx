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
  CreditCard,
  Banknote,
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
    // ✅ NUEVO: Campos para pago parcial
    paymentType?: string
    amountPaid?: string
    amountPending?: string
    paymentLocation?: string
    payment_type?: string
    // ✅ NUEVO: Campo para método de pago
    paymentMethod?: "cash" | "card"
  }
  vehicle: {
    name: string
    type: string
  } | null
}

type DateFilter = "all" | "today" | "tomorrow" | "test" | "manual" | "partial"

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

      // ✅ NUEVO: Debug específico para métodos de pago
      if (Array.isArray(data) && data.length > 0) {
        console.log("🔍 MÉTODOS DE PAGO DETECTADOS:")
        const paymentMethods = data
          .map((b) => ({
            id: b.booking.id,
            name: b.booking.customerName,
            method: b.booking.paymentMethod,
            isManual: b.booking.isManualBooking,
          }))
          .filter((b) => b.isManual)
        console.table(paymentMethods)
      }

      // Añadir este log para inspeccionar la estructura exacta de los primeros registros
      if (Array.isArray(data) && data.length > 0) {
        console.log("🔎 INSPECCIÓN DETALLADA DE DATOS:")
        console.log("Primer registro completo:", JSON.stringify(data[0], null, 2))
        console.log("Campos de pago:", {
          payment_type: data[0].booking.payment_type,
          paymentType: data[0].booking.paymentType,
          amountPaid: data[0].booking.amountPaid,
          amountPending: data[0].booking.amountPending,
          paymentMethod: data[0].booking.paymentMethod,
        })
      }

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

        // ✅ NUEVO: Contar reservas con pago parcial
        const withPartialPayment = sortedBookings.filter((b) => b.booking.payment_type === "partial_payment").length

        // ✅ DEBUG: Verificar detección de pagos parciales
        sortedBookings.forEach((booking, index) => {
          if (index < 5) {
            // Solo los primeros 5 para no saturar el log
            console.log(`🔍 Booking ${booking.booking.id}:`, {
              paymentType: booking.booking.payment_type,
              amountPaid: booking.booking.amountPaid,
              amountPending: booking.booking.amountPending,
              isPartialPayment: booking.booking.payment_type === "partial_payment",
              paymentMethod: booking.booking.paymentMethod,
            })
          }
        })

        console.log(`✅ Frontend: Found ${withWaivers} bookings with signed liability waivers`)
        console.log(`✅ Frontend: Found ${withPartialPayment} bookings with partial payment`)

        setDebug({
          totalBookings: sortedBookings.length,
          withWaivers,
          withPartialPayment,
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

  const completeAllBookings = async () => {
    if (
      !confirm(
        `¿Estás seguro de que deseas marcar como completadas todas las reservas mostradas (${filteredBookings.length})?`,
      )
    ) {
      return
    }

    setLoading(true)
    let successCount = 0
    let errorCount = 0

    // Crear una copia para evitar problemas con el estado durante el procesamiento
    const bookingsToProcess = [...filteredBookings]

    for (const booking of bookingsToProcess) {
      // Solo procesar reservas que no estén ya completadas o canceladas
      if (booking.booking.status !== "completed" && booking.booking.status !== "cancelled") {
        try {
          const response = await fetch(`/api/bookings/${booking.booking.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "completed" }),
          })

          if (response.ok) {
            successCount++
          } else {
            errorCount++
            console.error(`Error al completar la reserva ${booking.booking.id}`)
          }
        } catch (err) {
          errorCount++
          console.error(`Error al completar la reserva ${booking.booking.id}:`, err)
        }
      }
    }

    // Mostrar resultado
    alert(`Proceso completado:\n- ${successCount} reservas completadas exitosamente\n- ${errorCount} errores`)

    // Recargar los datos
    fetchBookings()
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

  // ✅ NUEVA FUNCIÓN: Determinar el tipo de pago para mostrar
  const getPaymentTypeDisplay = (booking: Booking) => {
    // Verificar ambas propiedades para mayor seguridad
    const isPartial =
      booking.booking.payment_type === "partial_payment" || booking.booking.paymentType === "partial_payment"

    console.log(`🔍 Booking ${booking.booking.id} payment check:`, {
      payment_type: booking.booking.payment_type,
      paymentType: booking.booking.paymentType,
      isPartial,
    })

    if (isPartial) {
      return {
        type: "partial",
        label: "Pago Parcial",
        description: `€${booking.booking.amountPaid} pagado / €${booking.booking.amountPending} pendiente`,
        color: "bg-orange-600 text-white",
        icon: Banknote,
      }
    } else {
      return {
        type: "full",
        label: "Pago Completo",
        description: "Todo pagado online",
        color: "bg-green-600 text-white",
        icon: CreditCard,
      }
    }
  }

  // ✅ FUNCIÓN CORREGIDA: Obtener información del método de pago
const getPaymentMethodDisplay = (booking: Booking) => {
  if (!booking.booking.isManualBooking) return null

  // Añadir logs para depuración más detallada
  console.log(`🔍 Checking payment method for booking ${booking.booking.id}:`, {
    paymentMethod: booking.booking.paymentMethod,
    rawBooking: booking.booking,
    type: typeof booking.booking.paymentMethod,
  })

  // Verificar si el método de pago es "card" (comparación estricta)
  if (booking.booking.paymentMethod === "card") {
    return {
      label: "Tarjeta",
      icon: CreditCard,
      color: "text-blue-600",
    }
  } else {
    // Por defecto o si es "cash"
    return {
      label: "Efectivo",
      icon: Banknote,
      color: "text-green-600",
    }
  }
}

  // Función para filtrar reservas por fecha o tipo
  const getFilteredBookings = () => {
    if (dateFilter === "test") {
      return bookings.filter((booking) => booking.booking.isTestBooking === true)
    }

    if (dateFilter === "manual") {
      return bookings.filter((booking) => booking.booking.isManualBooking === true)
    }

    if (dateFilter === "partial") {
      return bookings.filter(
        (booking) =>
          booking.booking.payment_type === "partial_payment" || booking.booking.paymentType === "partial_payment",
      )
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
  const partialPaymentBookingsCount = bookings.filter((b) => b.booking.payment_type === "partial_payment").length

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-black">Gestión de Reservas</h2>
        <p className="text-gray-600">Administra todas las reservas de clientes</p>
      </div>

      {/* ✅ NUEVA: Leyenda de Estados */}
      <Card className="bg-gray-50 border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-gray-800">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Leyenda de Estados y Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Estados de Reserva</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-600 text-white">pending</Badge>
                  <span className="text-sm">Pendiente de confirmación</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-600 text-white">confirmed</Badge>
                  <span className="text-sm">Confirmada y lista</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-600 text-white">completed</Badge>
                  <span className="text-sm">Completada exitosamente</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-600 text-white">cancelled</Badge>
                  <span className="text-sm">Cancelada</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Estados de Pago</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-600 text-white">completed</Badge>
                  <span className="text-sm">Pago completado</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-600 text-white">pending</Badge>
                  <span className="text-sm">Pago pendiente</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-orange-600 text-white">manual</Badge>
                  <span className="text-sm">Pago manual/efectivo</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-600 text-white">failed</Badge>
                  <span className="text-sm">Pago fallido</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Estados de Fianza</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-600 text-white">pending</Badge>
                  <span className="text-sm">Pendiente inspección</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-600 text-white">approved</Badge>
                  <span className="text-sm">Fianza devuelta</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-600 text-white">damaged</Badge>
                  <span className="text-sm">Daños encontrados</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
            <Button
              variant={dateFilter === "partial" ? "default" : "outline"}
              onClick={() => setDateFilter("partial")}
              className={dateFilter === "partial" ? "bg-orange-600 text-white hover:bg-orange-700" : ""}
            >
              <Banknote className="h-4 w-4 mr-2" />
              Pago Parcial ({partialPaymentBookingsCount})
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
                      : dateFilter === "partial"
                        ? " con pago parcial"
                        : ""}
            </div>
          )}
          {filteredBookings.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-blue-800">Acciones masivas</h4>
                  <p className="text-sm text-blue-600">
                    Estas acciones se aplicarán a las {filteredBookings.length} reservas mostradas actualmente
                  </p>
                </div>
                <Button onClick={completeAllBookings} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Completar todas las reservas
                </Button>
              </div>
            </div>
          )}
          <div className="mt-2 text-xs text-gray-500">
            {withWaiversCount} reserva(s) con documento de exención firmado • {partialPaymentBookingsCount} con pago
            parcial
          </div>
        </CardContent>
      </Card>

      {/* Panel de ayuda para clientes */}
      <Card className="bg-blue-50 border-blue-200 mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-blue-800">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Información sobre Tipos de Pago
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                Pago Completo
              </h4>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-800 text-sm">
                  <strong>✅ Todo pagado online</strong>
                  <br />
                  Cliente pagó alquiler + fianza. Solo entregar vehículo y devolver fianza al final.
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                <Banknote className="h-4 w-4 mr-2" />
                Pago Parcial
              </h4>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-orange-800 text-sm">
                  <strong>⚠️ Cobrar en sitio</strong>
                  <br />
                  Cliente pagó 50€/100€ online.{" "}
                  <strong>Debes cobrar el resto + fianza antes de entregar el vehículo.</strong>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {Array.isArray(filteredBookings) && filteredBookings.length > 0 ? (
        <div className="space-y-6">
          {filteredBookings.map((booking) => {
            // Debug específico para cada reserva
            const hasWaiver = booking.booking.liabilityWaiverId && booking.booking.liabilityWaiverId !== null
            const isManual = booking.booking.isManualBooking === true
            // Buscar esta línea:
            // const isPartialPayment = booking.booking.paymentType === "partial_payment"
            // Y cambiarla por:
            const isPartialPayment =
              booking.booking.payment_type === "partial_payment" || booking.booking.paymentType === "partial_payment"
            const salesPersonName = getSalesPersonName(booking.booking.salesPerson)
            const paymentTypeInfo = getPaymentTypeDisplay(booking)
            // ✅ NUEVO: Obtener información del método de pago
            const paymentMethodInfo = getPaymentMethodDisplay(booking)

            return (
              <Card
                key={booking.booking.id}
                className={`border border-gray-200 hover:shadow-lg transition-all ${
                  booking.booking.status === "completed" ? "bg-green-50 border-green-200" : "bg-white"
                } ${
                  booking.booking.isTestBooking
                    ? "border-l-4 border-l-purple-500"
                    : isManual
                      ? "border-l-4 border-l-orange-500"
                      : isPartialPayment
                        ? "border-l-4 border-l-orange-500"
                        : "border-l-4 border-l-green-500"
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
                        {/* ✅ NUEVO: Badge mejorado para tipo de pago */}
                        <Badge className={`ml-2 ${paymentTypeInfo.color}`}>
                          <paymentTypeInfo.icon className="h-3 w-3 mr-1" />
                          {paymentTypeInfo.label}
                        </Badge>
                        {/* ✅ NUEVO: Badge para método de pago en reservas manuales */}
                        {isManual && paymentMethodInfo && (
                          <Badge className="ml-2 bg-gray-600 text-white">
                            <paymentMethodInfo.icon className={`h-3 w-3 mr-1 ${paymentMethodInfo.color}`} />
                            {paymentMethodInfo.label}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <Ship className="h-4 w-4 mr-1" />
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
                        Información de Pago
                      </h4>
                      <div className="text-2xl font-bold text-gold">€{booking.booking.totalPrice}</div>
                      {Number(booking.booking.securityDeposit) > 0 && (
                        <div className="text-sm text-gray-600">
                          <Shield className="h-3 w-3 inline mr-1" />
                          Fianza: €{booking.booking.securityDeposit}
                        </div>
                      )}
                      {/* ✅ MEJORADO: Información clara de pago parcial */}
                      {isPartialPayment && (
                        <div className="space-y-1">
                          <div className="text-sm text-green-600 font-medium">
                            <CheckCircle className="h-3 w-3 inline mr-1" />
                            Pagado online: €{booking.booking.amountPaid}
                          </div>
                          {Number(booking.booking.amountPending) > 0 && (
                            <div className="text-sm text-red-600 font-bold bg-red-50 p-2 rounded border border-red-200">
                              <AlertTriangle className="h-3 w-3 inline mr-1" />
                              COBRAR EN SITIO: €{booking.booking.amountPending}
                            </div>
                          )}
                        </div>
                      )}

                      {/* ✅ NUEVO: Mostrar método de pago para reservas manuales */}
                      {isManual && paymentMethodInfo && (
                        <div className="mt-2 text-sm">
                          <div className={`flex items-center font-medium ${paymentMethodInfo.color}`}>
                            <paymentMethodInfo.icon className="h-3 w-3 inline mr-1" />
                            Pagado con: {paymentMethodInfo.label}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-700">Acciones</h4>
                      <div className="flex flex-col gap-2">
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

                        {/* ✅ MEJORADO: Alerta más prominente para pagos pendientes */}
                        {isPartialPayment && Number(booking.booking.amountPending) > 0 && (
                          <div className="p-3 bg-red-50 border-2 border-red-300 rounded-lg">
                            <div className="text-center">
                              <AlertTriangle className="h-5 w-5 text-red-600 mx-auto mb-1" />
                              <p className="text-xs font-bold text-red-800">COBRAR ANTES DE ENTREGAR</p>
                              <p className="text-lg font-bold text-red-600">€{booking.booking.amountPending}</p>
                              <p className="text-xs text-red-600">(Resto + Fianza)</p>
                            </div>
                          </div>
                        )}

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

                        {booking.booking.status === "confirmed" &&
                          (Number(booking.booking.securityDeposit) === 0 ||
                            booking.booking.inspectionStatus === "approved") && (
                            <Button
                              size="sm"
                              onClick={() => updateBookingStatus(booking.booking.id, "completed")}
                              className="bg-blue-600 text-white hover:bg-blue-700"
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
                    {isPartialPayment && (
                      <span className="ml-2 font-medium text-orange-600">• {paymentTypeInfo.description}</span>
                    )}
                    {/* ✅ NUEVO: Mostrar método de pago en el footer */}
                    {isManual && paymentMethodInfo && (
                      <span className={`ml-2 font-medium ${paymentMethodInfo.color}`}>
                        • Pagado con {paymentMethodInfo.label.toLowerCase()}
                      </span>
                    )}
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
                    : dateFilter === "partial"
                      ? "No hay reservas con pago parcial"
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
