"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  DollarSign,
  Calendar,
  ShoppingBag,
  Loader2,
  Copy,
  Check,
  Code,
  ExternalLink,
  Ship,
  Zap,
  Users,
} from "lucide-react"

interface Booking {
  id: number
  customer_name: string
  customer_email: string
  booking_date: string
  time_slot: string
  duration: string
  total_price: string
  status: string
  payment_status: string
  hotel_code: string
  created_at: string
  vehicle_name: string
  vehicle_type: string
  commission: number
}

interface Summary {
  totalBookings: number
  totalRevenue: number
  totalCommission: number
}

interface EmbedVehicle {
  id: number
  name: string
  type: string
  image: string
  capacity: number
}

export function CommercialDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [summary, setSummary] = useState<Summary>({
    totalBookings: 0,
    totalRevenue: 0,
    totalCommission: 0,
  })
  const [hotelCodes, setHotelCodes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [copied, setCopied] = useState(false)
  const [embedVehicles, setEmbedVehicles] = useState<EmbedVehicle[]>([])
  const [embedHotelCode, setEmbedHotelCode] = useState("")
  const [copiedVehicleId, setCopiedVehicleId] = useState<number | null>(null)

  const fetchSales = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.set("dateFrom", dateFrom)
      if (dateTo) params.set("dateTo", dateTo)

      const response = await fetch(`/api/commercial/sales?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setBookings(data.bookings)
        setSummary(data.summary)
        setHotelCodes(data.hotelCodes)
      }
    } catch (error) {
      console.error("Error fetching sales:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVehicles = async () => {
    try {
      const response = await fetch("/api/commercial/vehicles")
      if (response.ok) {
        const data = await response.json()
        setEmbedVehicles(data.vehicles)
        setEmbedHotelCode(data.hotelCode)
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error)
    }
  }

  useEffect(() => {
    fetchSales()
    fetchVehicles()
  }, [])

  const handleFilter = () => {
    fetchSales()
  }

  const embedCode = hotelCodes.length > 0
    ? `<iframe\n  src="https://oroboats.com/embed/boats?hotelCode=${hotelCodes[0]}"\n  width="100%"\n  height="800"\n  style="border: none; border-radius: 12px;"\n  allow="payment"\n></iframe>`
    : ""

  const copyEmbedCode = async () => {
    try {
      await navigator.clipboard.writeText(embedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      console.error("Error copying:", err)
    }
  }

  const getVehicleEmbedCode = (vehicleId: number) =>
    `<iframe\n  src="https://oroboats.com/embed/boats/${vehicleId}?hotelCode=${embedHotelCode}"\n  width="100%"\n  height="800"\n  style="border: none; border-radius: 12px;"\n  allow="payment"\n></iframe>`

  const copyVehicleEmbed = async (vehicleId: number) => {
    try {
      await navigator.clipboard.writeText(getVehicleEmbedCode(vehicleId))
      setCopiedVehicleId(vehicleId)
      setTimeout(() => setCopiedVehicleId(null), 3000)
    } catch (err) {
      console.error("Error copying:", err)
    }
  }

  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (paymentStatus === "paid") {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Pagado</Badge>
    }
    if (status === "cancelled") {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelado</Badge>
    }
    return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendiente</Badge>
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-2 border-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Reservas completadas</p>
                <p className="text-3xl font-bold text-black mt-1">
                  {loading ? "..." : summary.totalBookings}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <ShoppingBag className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-2 border-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ingresos generados</p>
                <p className="text-3xl font-bold text-black mt-1">
                  {loading ? "..." : `€${summary.totalRevenue.toLocaleString()}`}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-2 border-yellow-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tu comisión</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">
                  {loading ? "..." : `€${summary.totalCommission.toLocaleString()}`}
                </p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-full">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Embed Code Section */}
      {hotelCodes.length > 0 && (
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Code className="h-5 w-5 mr-2 text-gray-600" />
              Código para tu web
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Copia este código y pégalo en tu página web para mostrar el sistema de reservas con tu código de comercial ({hotelCodes.join(", ")}) ya integrado.
            </p>
            <div className="relative">
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                {embedCode}
              </pre>
              <Button
                onClick={copyEmbedCode}
                size="sm"
                className="absolute top-2 right-2"
                variant={copied ? "default" : "outline"}
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <ExternalLink className="h-3 w-3" />
              <span>
                Vista previa:{" "}
                <a
                  href={`/embed/boats?hotelCode=${hotelCodes[0]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  /embed/boats?hotelCode={hotelCodes[0]}
                </a>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Vehicle Embed Codes */}
      {embedVehicles.length > 0 && embedHotelCode && (
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Ship className="h-5 w-5 mr-2 text-gray-600" />
              Códigos embed por vehículo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Copia el código de un vehículo concreto para insertarlo individualmente en tu web.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {embedVehicles.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-yellow-400 transition-colors"
                >
                  <div className="shrink-0">
                    {v.type === "jetski" ? (
                      <Zap className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <Ship className="h-5 w-5 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-black truncate">{v.name}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-2">
                      <span className="font-mono bg-gray-100 px-1 rounded">ID:{v.id}</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {v.capacity} pers.
                      </span>
                    </p>
                  </div>
                  <Button
                    onClick={() => copyVehicleEmbed(v.id)}
                    size="sm"
                    variant={copiedVehicleId === v.id ? "default" : "outline"}
                    className="shrink-0"
                  >
                    {copiedVehicleId === v.id ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Date Filters */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-gray-600" />
            Mis ventas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-gray-50"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-gray-50"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleFilter} className="bg-black text-white hover:bg-yellow-500 hover:text-black">
                Filtrar
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Cargando ventas...</span>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ShoppingBag className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p>No hay ventas registradas todavía.</p>
              <p className="text-sm mt-1">Las reservas realizadas con tu código aparecerán aquí.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-semibold text-gray-600">Fecha</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-600">Vehículo</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-600">Cliente</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-600">Horario</th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-600">Importe</th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-600">Comisión</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2">
                        {new Date(booking.booking_date).toLocaleDateString("es-ES")}
                      </td>
                      <td className="py-3 px-2 font-medium">{booking.vehicle_name || "—"}</td>
                      <td className="py-3 px-2">
                        <div>{booking.customer_name}</div>
                        <div className="text-xs text-gray-400">{booking.customer_email}</div>
                      </td>
                      <td className="py-3 px-2 text-gray-600">{booking.time_slot || "—"}</td>
                      <td className="py-3 px-2 text-right font-semibold">
                        €{Number(booking.total_price).toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-right font-semibold text-yellow-600">
                        €{booking.commission.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
