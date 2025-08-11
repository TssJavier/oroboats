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
  MapPin,
  Hotel,
  Search,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Booking {
  booking: {
    id: number
    customerName: string
    customerEmail: string
    customerPhone: string
    customerDni: string
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
    liability_waiver_id?: number
    isTestBooking?: boolean
    isManualBooking?: boolean
    salesPerson?: string
    vehicleName?: string
    vehicleType?: string
    paymentType?: string
    amountPaid?: string
    amountPending?: string
    paymentLocation?: string
    payment_type?: string
    paymentMethod?: "cash" | "card"
    beachLocationId?: string
    beachLocationName?: string
    hotelCode?: string // ✅ NUEVO: Añadir hotelCode
  }
  vehicle: {
    name: string
    type: string
  } | null
}

interface BeachLocation {
  id: string
  name: string
}

// MODIFICADO: Añadir 'specific_date' al tipo DateFilter
type DateFilter = "all" | "today" | "tomorrow" | "test" | "manual" | "partial" | "salesperson" | "specific_date"

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
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>("")
  const [beachLocations, setBeachLocations] = useState<BeachLocation[]>([])
  const [selectedBeachFilterId, setSelectedBeachFilterId] = useState<string>("all")
  const [hotelCodeSearchInput, setHotelCodeSearchInput] = useState<string>("") // ✅ NUEVO: Estado para el input del buscador
  const [hotelCodeFilter, setHotelCodeFilter] = useState<string>("") // ✅ NUEVO: Estado para el filtro aplicado
  // NUEVO: Estado para el input de búsqueda de fecha
  const [dateSearchInput, setDateSearchInput] = useState<string>("")

  useEffect(() => {
    fetchBeachLocations()
  }, [])

  // MODIFICADO: El useEffect ahora calcula la fecha a enviar a la API
  useEffect(() => {
    let dateToFetch: string | undefined

    if (dateFilter === "today") {
      dateToFetch = new Date().toISOString().split("T")[0]
    } else if (dateFilter === "tomorrow") {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      dateToFetch = tomorrow.toISOString().split("T")[0]
    } else if (dateFilter === "specific_date" && dateSearchInput) {
      dateToFetch = dateSearchInput
    }

    fetchBookings(selectedBeachFilterId, hotelCodeFilter, dateToFetch)
  }, [selectedBeachFilterId, hotelCodeFilter, dateFilter, dateSearchInput]) // dateSearchInput es una dependencia para 'specific_date'

  const fetchBeachLocations = async () => {
    try {
      const response = await fetch("/api/locations")
      if (!response.ok) {
        throw new Error("Error al cargar las ubicaciones de playa.")
      }
      const data = await response.json()
      if (Array.isArray(data)) {
        setBeachLocations([{ id: "all", name: "Todas las Playas" }, ...data])
      } else {
        console.error("API returned non-array data for locations:", data)
        setError("Error: Datos de ubicaciones no válidos.")
      }
    } catch (err) {
      console.error("Error fetching beach locations:", err)
      setError(err instanceof Error ? err.message : "Error al cargar las ubicaciones de playa.")
    }
  }

  // MODIFICADO: Añadir bookingDate como parámetro opcional
  const fetchBookings = async (beachId = "all", hotelCode = "", bookingDate?: string) => {
    try {
      setError(null)
      setLoading(true)
      console.log(
        `🔍 Frontend: Fetching bookings for beach: ${beachId}, hotelCode: ${hotelCode}, date: ${bookingDate || "all"}`,
      )
      const url = new URL("/api/bookings", window.location.origin)

      if (beachId !== "all") {
        url.searchParams.append("beachLocationId", beachId)
      }
      if (hotelCode) {
        url.searchParams.append("hotelCode", hotelCode)
      }
      // NUEVO: Añadir bookingDate a los parámetros de búsqueda si está presente
      if (bookingDate) {
        url.searchParams.append("bookingDate", bookingDate)
      }

      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log("🔍 Frontend: Bookings data received:", data)
      if (Array.isArray(data)) {
        const sortedBookings = data.sort(
          (a: Booking, b: Booking) => new Date(b.booking.createdAt).getTime() - new Date(a.booking.createdAt).getTime(),
        )
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

  const handleSearchByHotelCode = () => {
    setHotelCodeFilter(hotelCodeSearchInput.toUpperCase()) // ✅ NUEVO: Aplicar el filtro al hacer clic
  }

  // NUEVO: Handler para el cambio en el input de fecha
  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateSearchInput(e.target.value)
    // Si el usuario selecciona una fecha, activar el filtro de fecha específica
    if (e.target.value) {
      setDateFilter("specific_date")
    } else {
      // Si el input se vacía, volver al filtro "all" o al que estaba antes
      setDateFilter("all")
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
    const bookingsToProcess = [...filteredBookings]
    for (const booking of bookingsToProcess) {
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
    alert(`Proceso completado:\n- ${successCount} reservas completadas exitosamente\n- ${errorCount} errores`)
    // MODIFICADO: Refrescar bookings con los filtros actuales
    let dateToFetch: string | undefined
    if (dateFilter === "today") {
      dateToFetch = new Date().toISOString().split("T")[0]
    } else if (dateFilter === "tomorrow") {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      dateToFetch = tomorrow.toISOString().split("T")[0]
    } else if (dateFilter === "specific_date" && dateSearchInput) {
      dateToFetch = dateSearchInput
    }
    fetchBookings(selectedBeachFilterId, hotelCodeFilter, dateToFetch)
  }

  const viewWaiver = async (waiverId: number, customerName: string) => {
    try {
      console.log(`🔍 Opening waiver ${waiverId} for ${customerName}...`)
      const url = `/api/liability-waiver/${waiverId}/pdf`
      window.open(url, "_blank")
    } catch (error) {
      console.error("Error opening waiver:", error)
      setError("Error al abrir el documento")
    }
  }

  const getSalesPersonName = (id?: string) => {
    if (!id) return null
    const salesPerson = {
      manuel: "Manuel",
      fermin: "Fermín",
      javier: "Javier",
    }[id]
    return salesPerson || id
  }

  const getPaymentTypeDisplay = (booking: Booking) => {
    const isPartial =
      booking.booking.payment_type === "partial_payment" || booking.booking.paymentType === "partial_payment"
    const isManual = booking.booking.isManualBooking === true
    if (isPartial) {
      return {
        type: "partial",
        label: "Pago Parcial",
        description: `€${booking.booking.amountPaid} pagado / €${booking.booking.amountPending} pendiente`,
        color: "bg-gray-600 text-white", // Gray for partial
        icon: Banknote,
      }
    } else if (isManual) {
      return {
        type: "manual",
        label: "Pago Manual",
        description: "Pagado en sitio (efectivo/tarjeta)",
        color: "bg-orange-600 text-white", // Stronger orange for manual
        icon: Settings,
      }
    } else {
      return {
        type: "full_online",
        label: "Pago Completo Online",
        description: "Todo pagado online",
        color: "bg-blue-600 text-white", // Blue for full online
        icon: CreditCard,
      }
    }
  }

  const getPaymentMethodDisplay = (booking: Booking) => {
    if (!booking.booking.isManualBooking) return null
    if (booking.booking.paymentMethod === "card") {
      return {
        label: "Tarjeta",
        icon: CreditCard,
        color: "text-blue-600",
      }
    } else {
      return {
        label: "Efectivo",
        icon: Banknote,
        color: "text-green-600",
      }
    }
  }

  // MODIFICADO: Simplificar getFilteredBookings ya que la API maneja el filtrado por fecha
  const getFilteredBookings = () => {
    let currentBookings = bookings

    // Estos filtros se aplican client-side sobre los datos ya obtenidos de la API
    if (dateFilter === "test") {
      currentBookings = currentBookings.filter((booking) => booking.booking.isTestBooking === true)
    } else if (dateFilter === "manual") {
      currentBookings = currentBookings.filter((booking) => booking.booking.isManualBooking === true)
    } else if (dateFilter === "partial") {
      currentBookings = currentBookings.filter(
        (booking) =>
          booking.booking.payment_type === "partial_payment" || booking.booking.paymentType === "partial_payment",
      )
    } else if (dateFilter === "salesperson" && selectedSalesperson) {
      currentBookings = currentBookings.filter((booking) => booking.booking.salesPerson === selectedSalesperson)
    }

    return currentBookings
  }

  const getSalespersonStats = () => {
    const salespeople = ["manuel", "fermin", "javier"]
    return salespeople.map((id) => {
      const salesPersonBookings = bookings.filter(
        (b) => b.booking.salesPerson === id && !b.booking.isTestBooking && b.booking.isManualBooking,
      )
      const totalRevenue = salesPersonBookings.reduce((sum, b) => {
        const price = Number(b.booking.totalPrice) || 0
        const deposit = Number(b.booking.securityDeposit) || 0
        return sum + (price - deposit)
      }, 0)
      return {
        id,
        name: getSalesPersonName(id),
        count: salesPersonBookings.length,
        revenue: totalRevenue,
        bookings: salesPersonBookings,
      }
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
          // MODIFICADO: Refrescar bookings con los filtros actuales
          let dateToFetch: string | undefined
          if (dateFilter === "today") {
            dateToFetch = new Date().toISOString().split("T")[0]
          } else if (dateFilter === "tomorrow") {
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            dateToFetch = tomorrow.toISOString().split("T")[0]
          } else if (dateFilter === "specific_date" && dateSearchInput) {
            dateToFetch = dateSearchInput
          }
          fetchBookings(selectedBeachFilterId, hotelCodeFilter, dateToFetch)
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
          // MODIFICADO: Refrescar bookings con los filtros actuales
          let dateToFetch: string | undefined
          if (dateFilter === "today") {
            dateToFetch = new Date().toISOString().split("T")[0]
          } else if (dateFilter === "tomorrow") {
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            dateToFetch = tomorrow.toISOString().split("T")[0]
          } else if (dateFilter === "specific_date" && dateSearchInput) {
            dateToFetch = dateSearchInput
          }
          fetchBookings(selectedBeachFilterId, hotelCodeFilter, dateToFetch)
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
      const requestBody = {
        action: depositAction,
        ...(depositAction === "reject" && {
          damageDescription,
          damageCost,
        }),
      }
      console.log("🔄 Sending deposit request:", requestBody)
      const response = await fetch(`/api/bookings/${selectedBooking.booking.id}/deposit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })
      const result = await response.json()
      console.log("📥 Deposit response:", result)
      if (response.ok) {
        setShowDepositModal(false)
        setSelectedBooking(null)
        setDepositAction(null)
        // MODIFICADO: Refrescar bookings con los filtros actuales
        let dateToFetch: string | undefined
        if (dateFilter === "today") {
          dateToFetch = new Date().toISOString().split("T")[0]
        } else if (dateFilter === "tomorrow") {
          const tomorrow = new Date()
          tomorrow.setDate(tomorrow.getDate() + 1)
          dateToFetch = tomorrow.toISOString().split("T")[0]
        } else if (dateFilter === "specific_date" && dateSearchInput) {
          dateToFetch = dateSearchInput
        }
        fetchBookings(selectedBeachFilterId, hotelCodeFilter, dateToFetch)
        alert(result.message || "Fianza procesada correctamente")
      } else {
        console.error("❌ Deposit processing failed:", result)
        setError(result.error || "Error al procesar la fianza")
      }
    } catch (err) {
      console.error("❌ Error processing deposit:", err)
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
        return "bg-red-700 text-white" // Stronger red for cancelled status badge
      case "completed":
        return "bg-green-700 text-white" // Stronger green for completed status badge
      default:
        return "bg-gray-600 text-white"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-700 text-white" // Stronger green for paymentStatus completed badge
      case "pending":
        return "bg-yellow-600 text-white"
      case "failed":
        return "bg-red-600 text-white"
      case "free_booking":
        return "bg-purple-600 text-white"
      case "manual":
        return "bg-orange-600 text-white" // Stronger orange for manual payment badge
      case "partial_payment":
        return "bg-gray-600 text-white" // Gray for partial payment badge
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
            <Button
              onClick={() => {
                // MODIFICADO: Refrescar bookings con los filtros actuales
                let dateToFetch: string | undefined
                if (dateFilter === "today") {
                  dateToFetch = new Date().toISOString().split("T")[0]
                } else if (dateFilter === "tomorrow") {
                  const tomorrow = new Date()
                  tomorrow.setDate(tomorrow.getDate() + 1)
                  dateToFetch = tomorrow.toISOString().split("T")[0]
                } else if (dateFilter === "specific_date" && dateSearchInput) {
                  dateToFetch = dateSearchInput
                }
                fetchBookings(selectedBeachFilterId, hotelCodeFilter, dateToFetch)
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
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
  const withWaiversCount = bookings.filter((b) => b.booking.liabilityWaiverId || b.booking.liability_waiver_id).length
  const partialPaymentBookingsCount = bookings.filter((b) => b.booking.payment_type === "partial_payment").length

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-black">Gestión de Reservas</h2>
        <p className="text-gray-600">Administra todas las reservas de clientes</p>
      </div>
      {/* Leyenda de Estados */}
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
                  <Badge className="bg-green-700 text-white">completed</Badge> {/* Stronger green */}
                  <span className="text-sm">Completada exitosamente</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-700 text-white">cancelled</Badge> {/* Stronger red */}
                  <span className="text-sm">Cancelada</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Estados de Pago</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-600 text-white">completed</Badge> {/* Blue for full online */}
                  <span className="text-sm">Pago completado (online)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-600 text-white">pending</Badge>
                  <span className="text-sm">Pago pendiente (online)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-gray-600 text-white">partial</Badge> {/* Gray for partial */}
                  <span className="text-sm">Pago parcial (online)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-orange-600 text-white">manual</Badge> {/* Stronger orange for manual */}
                  <span className="text-sm">Pago manual (en sitio)</span>
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
      {/* Filtros de fecha y playa */}
      <Card className="bg-white border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-gray-800">
            <CalendarDays className="h-5 w-5 mr-2" />
            Filtrar Reservas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Filtro por playa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Playa</label>
              <Select value={selectedBeachFilterId} onValueChange={setSelectedBeachFilterId}>
                <SelectTrigger className="w-full p-3 border border-gray-200 rounded-md bg-gray-50">
                  <SelectValue placeholder="Todas las playas" />
                </SelectTrigger>
                <SelectContent>
                  {beachLocations.map((beach) => (
                    <SelectItem key={beach.id} value={beach.id}>
                      {beach.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* ✅ MODIFICADO: Filtro por Código de Hotel con botón de búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar por Código de Hotel</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    value={hotelCodeSearchInput}
                    onChange={(e) => setHotelCodeSearchInput(e.target.value)} // Actualiza el input, no el filtro
                    placeholder="Introduce el código"
                    className="pr-10 w-full p-3 border border-gray-200 rounded-md bg-gray-50"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearchByHotelCode()
                      }
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSearchByHotelCode}
                    className="absolute right-0 top-0 h-full w-10 text-gray-500 hover:bg-transparent"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            {/* NUEVO: Buscador por Fecha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar por Fecha</label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateSearchInput}
                  onChange={handleDateInputChange}
                  className="flex-1 p-3 border border-gray-200 rounded-md bg-gray-50"
                />
                {dateSearchInput && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setDateSearchInput("")
                      setDateFilter("all") // Limpiar el filtro de fecha específica
                    }}
                    className="text-gray-500 hover:bg-transparent"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant={dateFilter === "all" ? "default" : "outline"}
              onClick={() => {
                setDateFilter("all")
                setDateSearchInput("") // Limpiar el input de fecha al seleccionar "Todas"
              }}
              className={dateFilter === "all" ? "bg-black text-white" : ""}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Todas ({bookings.length})
            </Button>
            <Button
              variant={dateFilter === "today" ? "default" : "outline"}
              onClick={() => {
                setDateFilter("today")
                setDateSearchInput("") // Limpiar el input de fecha al seleccionar "Hoy"
              }}
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
              onClick={() => {
                setDateFilter("tomorrow")
                setDateSearchInput("") // Limpiar el input de fecha al seleccionar "Mañana"
              }}
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
              className={dateFilter === "partial" ? "bg-gray-600 text-white hover:bg-gray-700" : ""}
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
                        : dateFilter === "salesperson"
                          ? ` de ${getSalesPersonName(selectedSalesperson)}`
                          : dateFilter === "specific_date" && dateSearchInput
                            ? ` para el ${new Date(dateSearchInput).toLocaleDateString("es-ES")}`
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
      {/* Lista de reservas */}
      {Array.isArray(filteredBookings) && filteredBookings.length > 0 ? (
        <div className="space-y-6">
          {filteredBookings.map((booking) => {
            const waiverId = booking.booking.liabilityWaiverId || booking.booking.liability_waiver_id
            const hasWaiver = waiverId && waiverId !== null && waiverId !== 0
            const isManual = booking.booking.isManualBooking === true
            const isPartialPayment =
              booking.booking.payment_type === "partial_payment" || booking.booking.paymentType === "partial_payment"
            const salesPersonName = getSalesPersonName(booking.booking.salesPerson)
            const paymentTypeInfo = getPaymentTypeDisplay(booking)
            const paymentMethodInfo = getPaymentMethodDisplay(booking)
            let cardBackgroundColorClass = "bg-white border-gray-200" // Default white
            if (booking.booking.status === "cancelled") {
              cardBackgroundColorClass = "bg-red-100 border-red-300" // Stronger red for cancelled booking
            } else if (booking.booking.status === "completed") {
              cardBackgroundColorClass = "bg-green-100 border-green-300" // Stronger green for completed booking
            } else if (isPartialPayment) {
              cardBackgroundColorClass = "bg-gray-100 border-gray-300" // Gray for partial payment
            } else if (isManual) {
              cardBackgroundColorClass = "bg-orange-100 border-orange-300" // Stronger orange for manual payment
            } else {
              // This 'else' now covers 'full online payment' when not cancelled, completed, partial, or manual
              cardBackgroundColorClass = "bg-blue-100 border-blue-300" // Blue for full online payment
            }
            return (
              <Card
                key={booking.booking.id}
                className={`border hover:shadow-lg transition-all ${cardBackgroundColorClass} ${
                  booking.booking.isTestBooking ? "border-l-4 border-l-purple-500" : ""
                }`}
              >
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg sm:text-xl font-bold text-black flex flex-wrap items-center gap-2">
                        <User className="h-5 w-5 text-gold flex-shrink-0" />
                        {booking.booking.customerDni && (
                          <span className="text-sm font-normal text-gray-600">({booking.booking.customerDni})</span>
                        )}
                        <span className="break-words">{booking.booking.customerName}</span>
                        {booking.booking.isTestBooking && (
                          <Badge className="bg-purple-600 text-white text-xs">
                            <Beaker className="h-3 w-3 mr-1" />
                            Prueba
                          </Badge>
                        )}
                        {isManual && (
                          <Badge className="bg-orange-600 text-white text-xs">
                            <Settings className="h-3 w-3 mr-1" />
                            Manual
                          </Badge>
                        )}
                        <Badge className={`${paymentTypeInfo.color} text-xs`}>
                          <paymentTypeInfo.icon className="h-3 w-3 mr-1" />
                          {paymentTypeInfo.label}
                        </Badge>
                        {isManual && paymentMethodInfo && (
                          <Badge className="bg-gray-600 text-white text-xs">
                            <paymentMethodInfo.icon className={`h-3 w-3 mr-1 ${paymentMethodInfo.color}`} />
                            {paymentMethodInfo.label}
                          </Badge>
                        )}
                        {/* ✅ MODIFICADO: Mostrar código de hotel */}
                        <Badge className="bg-gray-700 text-white text-xs">
                          <Hotel className="h-3 w-3 mr-1" />
                          Hotel: {booking.booking.hotelCode || "sin código"}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <Ship className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="break-words">
                          {booking.booking.vehicleName || booking.vehicle?.name || "Producto eliminado"}
                          {(booking.booking.vehicleType || booking.vehicle?.type) && (
                            <span className="text-gray-500 ml-1">
                              ({booking.booking.vehicleType || booking.vehicle?.type})
                            </span>
                          )}
                        </span>
                        {booking.booking.beachLocationName && (
                          <Badge className="ml-2 bg-gray-200 text-gray-800 text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            {booking.booking.beachLocationName}
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      <Badge className={`${getStatusColor(booking.booking.status)} text-xs`}>
                        {booking.booking.status}
                      </Badge>
                      <Badge className={`${getPaymentStatusColor(booking.booking.paymentStatus)} text-xs`}>
                        {booking.booking.paymentStatus}
                      </Badge>
                      {Number(booking.booking.securityDeposit) > 0 && (
                        <Badge className={`${getInspectionStatusColor(booking.booking.inspectionStatus)} text-xs`}>
                          Fianza: {booking.booking.inspectionStatus}
                        </Badge>
                      )}
                      {hasWaiver && (
                        <Badge className="bg-purple-600 text-white text-xs">
                          <FileText className="h-3 w-3 mr-1" />
                          Documento firmado
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-700 flex items-center text-sm">
                        <User className="h-4 w-4 mr-1" />
                        Contacto
                      </h4>
                      <div className="space-y-1 text-xs sm:text-sm">
                        <div className="flex items-center text-gray-600 break-all">
                          <Mail className="h-3 w-3 mr-2 flex-shrink-0" />
                          <span className="break-all">{booking.booking.customerEmail}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Phone className="h-3 w-3 mr-2 flex-shrink-0" />
                          <span>{booking.booking.customerPhone}</span>
                        </div>
                        {booking.booking.customerDni && (
                          <div className="flex items-center text-gray-600">
                            <UserCheck className="h-3 w-3 mr-2 flex-shrink-0" />
                            <span>DNI: {booking.booking.customerDni}</span>
                          </div>
                        )}
                        {salesPersonName && (
                          <div className="flex items-center text-gray-600">
                            <UserCheck className="h-3 w-3 mr-2 flex-shrink-0" />
                            <span className="font-medium">Comercial: {salesPersonName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-700 flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-1" />
                        Fecha y Hora
                      </h4>
                      <div className="space-y-1 text-xs sm:text-sm">
                        <div className="text-gray-600">
                          {new Date(booking.booking.bookingDate).toLocaleDateString("es-ES")}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Clock className="h-3 w-3 mr-2 flex-shrink-0" />
                          <span>{booking.booking.timeSlot}</span>
                        </div>
                        <div className="text-gray-600">Duración: {booking.booking.duration}</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-700 flex items-center text-sm">
                        <Euro className="h-4 w-4 mr-1" />
                        Información de Pago
                      </h4>
                      <div className="text-xl sm:text-2xl font-bold text-gold">€{booking.booking.totalPrice}</div>
                      {Number(booking.booking.securityDeposit) > 0 && (
                        <div className="text-xs sm:text-sm text-gray-600">
                          <Shield className="h-3 w-3 inline mr-1" />
                          Fianza: €{booking.booking.securityDeposit}
                        </div>
                      )}
                      {isPartialPayment && (
                        <div className="space-y-1">
                          <div className="text-xs sm:text-sm text-green-600 font-medium">
                            <CheckCircle className="h-3 w-3 inline mr-1" />
                            Pagado online: €{booking.booking.amountPaid}
                          </div>
                          {Number(booking.booking.amountPending) > 0 && (
                            <div className="text-xs sm:text-sm text-red-600 font-bold bg-red-50 p-2 rounded border border-red-200">
                              <AlertTriangle className="h-3 w-3 inline mr-1" />
                              COBRAR EN SITIO: €{booking.booking.amountPending}
                            </div>
                          )}
                        </div>
                      )}
                      {isManual && paymentMethodInfo && (
                        <div className="mt-2 text-xs sm:text-sm">
                          <div className={`flex items-center font-medium ${paymentMethodInfo.color}`}>
                            <paymentMethodInfo.icon className="h-3 w-3 inline mr-1" />
                            Pagado con: {paymentMethodInfo.label}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-700 text-sm">Acciones</h4>
                      <div className="flex flex-col gap-2">
                        {hasWaiver && (
                          <Button
                            size="sm"
                            onClick={() => viewWaiver(waiverId!, booking.booking.customerName)}
                            className="bg-purple-600 text-white hover:bg-purple-700 text-xs"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Ver Documento
                          </Button>
                        )}
                        {isPartialPayment && Number(booking.booking.amountPending) > 0 && (
                          <div className="p-2 sm:p-3 bg-red-50 border-2 border-red-300 rounded-lg">
                            <div className="text-center">
                              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 mx-auto mb-1" />
                              <p className="text-xs font-bold text-red-800">COBRAR ANTES DE ENTREGAR</p>
                              <p className="text-sm sm:text-lg font-bold text-red-600">
                                €{booking.booking.amountPending}
                              </p>
                              <p className="text-xs text-red-600">(Resto + Fianza)</p>
                            </div>
                          </div>
                        )}
                        {booking.booking.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => updateBookingStatus(booking.booking.id, "confirmed")}
                            className="bg-green-600 text-white hover:bg-green-700 text-xs"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
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
                                className="bg-green-600 text-white hover:bg-green-700 text-xs"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completar Fianza
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleDepositAction(booking, "reject")}
                                className="bg-red-600 text-white hover:bg-red-700 text-xs"
                              >
                                <XCircle className="h-3 w-3 mr-1" />
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
                              className="bg-green-700 text-white hover:bg-green-800 text-xs" // Stronger green for the button
                            >
                              Completar Reserva
                            </Button>
                          )}
                        {booking.booking.status !== "cancelled" && booking.booking.status !== "completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateBookingStatus(booking.booking.id, "cancelled")}
                            className="border-red-300 text-red-600 hover:bg-red-50 text-xs"
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  {booking.booking.damageDescription && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <h5 className="font-semibold text-red-800 mb-1 flex items-center text-sm">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Daños Registrados:
                      </h5>
                      <p className="text-red-700 text-xs sm:text-sm mb-1">{booking.booking.damageDescription}</p>
                      {Number(booking.booking.damageCost) > 0 && (
                        <p className="text-red-700 text-xs sm:text-sm font-semibold">
                          Coste: €{booking.booking.damageCost}
                        </p>
                      )}
                    </div>
                  )}
                  {booking.booking.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <h5 className="font-semibold text-gray-700 mb-1 text-sm">Notas:</h5>
                      <p className="text-gray-600 text-xs sm:text-sm">{booking.booking.notes}</p>
                    </div>
                  )}
                  <div className="mt-4 text-xs text-gray-500 break-words">
                    Reserva creada: {new Date(booking.booking.createdAt).toLocaleString("es-ES")}
                    {isManual && salesPersonName && <span className="ml-2">• Comercial: {salesPersonName}</span>}
                    {isPartialPayment && (
                      <span className="ml-2 font-medium text-gray-600">• {paymentTypeInfo.description}</span>
                    )}
                    {isManual && paymentMethodInfo && (
                      <span className={`ml-2 font-medium ${paymentMethodInfo.color}`}>
                        • Pagado con {paymentMethodInfo.label.toLowerCase()}
                      </span>
                    )}
                    {booking.booking.hotelCode && (
                      <span className="ml-2 font-medium text-gray-600">
                        • Código Hotel: {booking.booking.hotelCode}
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
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No hay reservas</h3>
            <p className="text-gray-500">Las reservas aparecerán aquí cuando los clientes hagan pedidos</p>
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
