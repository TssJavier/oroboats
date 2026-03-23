"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle, Trash2, Search, Hotel, Pencil, Check, X } from "lucide-react"
import type { Hotel as HotelType, NewHotel } from "@/lib/db/schema"

// Definir una interfaz para el tipo de Booking simplificado para el conteo
interface BookingForCount {
  booking: {
    hotelCode?: string | null
  }
}

export function HotelManagement() {
  const [hotels, setHotels] = useState<HotelType[]>([])
  const [newHotelName, setNewHotelName] = useState("")
  const [newHotelCode, setNewHotelCode] = useState("")
  const [newCommercialEmail, setNewCommercialEmail] = useState("")
  const [newNotificationEmail, setNewNotificationEmail] = useState("")
  const [newCommissionPercent, setNewCommissionPercent] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [hotelBookingCounts, setHotelBookingCounts] = useState<Record<string, number>>({})
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editData, setEditData] = useState({ name: "", code: "", commercialEmail: "", notificationEmail: "", commissionPercent: "" })

  useEffect(() => {
    fetchHotelsAndBookingCounts()
  }, [])

  const fetchHotelsAndBookingCounts = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch hotels
      const hotelsResponse = await fetch("/api/hotels")
      if (!hotelsResponse.ok) {
        throw new Error("Failed to fetch hotels")
      }
      const hotelsData: HotelType[] = await hotelsResponse.json()
      setHotels(hotelsData)

      // Fetch all bookings to count them
      const bookingsResponse = await fetch("/api/bookings")
      if (!bookingsResponse.ok) {
        throw new Error("Failed to fetch bookings for counting")
      }
      const bookingsData: BookingForCount[] = await bookingsResponse.json()

      // Calculate booking counts per hotel code
      const counts: Record<string, number> = {}
      bookingsData.forEach((booking) => {
        const code = booking.booking.hotelCode?.toUpperCase()
        if (code) {
          counts[code] = (counts[code] || 0) + 1
        }
      })
      setHotelBookingCounts(counts)
    } catch (err) {
      console.error("Error fetching data:", err)
      setError(err instanceof Error ? err.message : "Error al cargar hoteles y reservas.")
    } finally {
      setLoading(false)
    }
  }

  const addHotel = async () => {
    if (!newHotelName.trim() || !newHotelCode.trim()) {
      setError("El nombre y el código del hotel son obligatorios.")
      return
    }
    setError(null)
    try {
      const newHotel = {
        name: newHotelName,
        code: newHotelCode.toUpperCase(),
        commercialEmail: newCommercialEmail || null,
        notificationEmail: newNotificationEmail || null,
        commissionPercent: newCommissionPercent || "0",
      }
      const response = await fetch("/api/hotels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newHotel),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || "Failed to add hotel")
      }
      setNewHotelName("")
      setNewHotelCode("")
      setNewCommercialEmail("")
      setNewNotificationEmail("")
      setNewCommissionPercent("")
      fetchHotelsAndBookingCounts() // Re-fetch to update the list and counts
    } catch (err) {
      console.error("Error adding hotel:", err)
      setError(err instanceof Error ? err.message : "Error al añadir hotel.")
    }
  }

  const deleteHotel = async (id: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este hotel?")) {
      return
    }
    setError(null)
    try {
      const response = await fetch(`/api/hotels?id=${id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || "Failed to delete hotel")
      }
      fetchHotelsAndBookingCounts() // Re-fetch to update the list and counts
    } catch (err) {
      console.error("Error deleting hotel:", err)
      setError(err instanceof Error ? err.message : "Error al eliminar hotel.")
    }
  }

  const startEdit = (hotel: HotelType) => {
    setEditingId(hotel.id)
    setEditData({
      name: hotel.name,
      code: hotel.code,
      commercialEmail: hotel.commercialEmail || "",
      notificationEmail: (hotel as any).notificationEmail || "",
      commissionPercent: hotel.commissionPercent ? String(hotel.commissionPercent) : "",
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditData({ name: "", code: "", commercialEmail: "", notificationEmail: "", commissionPercent: "" })
  }

  const saveEdit = async () => {
    if (!editingId) return
    setError(null)
    try {
      const response = await fetch("/api/hotels", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          name: editData.name,
          code: editData.code.toUpperCase(),
          commercialEmail: editData.commercialEmail || null,
          notificationEmail: editData.notificationEmail || null,
          commissionPercent: editData.commissionPercent || "0",
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || "Failed to update hotel")
      }
      setEditingId(null)
      fetchHotelsAndBookingCounts()
    } catch (err) {
      console.error("Error updating hotel:", err)
      setError(err instanceof Error ? err.message : "Error al actualizar hotel.")
    }
  }

  const filteredHotels = hotels.filter(
    (hotel) =>
      hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotel.code.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="space-y-8">
        <h2 className="text-3xl font-bold text-black">Gestión de Hoteles</h2>
        <p className="text-gray-600">Cargando hoteles y conteos de reservas...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <h2 className="text-3xl font-bold text-black">Gestión de Hoteles</h2>
        <Card className="bg-red-50 border border-red-200">
          <CardContent className="text-center py-12">
            <div className="text-red-600 mb-4">⚠️ Error de Conexión</div>
            <h3 className="text-xl font-semibold text-red-800 mb-2">{error}</h3>
            <p className="text-red-600 mb-6">Verifica la conexión a la base de datos y el servidor API.</p>
            <Button onClick={fetchHotelsAndBookingCounts} className="bg-red-600 text-white hover:bg-red-700">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-black">Gestión de Hoteles</h2>
        <p className="text-gray-600">Administra los hoteles y sus códigos de referencia.</p>
      </div>

      {/* Add New Hotel */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-800">
            <PlusCircle className="h-5 w-5 mr-2" />
            Añadir Nuevo Hotel
          </CardTitle>
          <CardDescription>Registra un nuevo hotel y su código de referencia.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hotelName">Nombre del Hotel / Comercial</Label>
              <Input
                id="hotelName"
                value={newHotelName}
                onChange={(e) => setNewHotelName(e.target.value)}
                placeholder="Ej: Hotel Luna / Jose Comercial"
              />
            </div>
            <div>
              <Label htmlFor="hotelCode">Código de Referencia</Label>
              <Input
                id="hotelCode"
                value={newHotelCode}
                onChange={(e) => setNewHotelCode(e.target.value.toUpperCase())}
                placeholder="Ej: HL-1234"
              />
            </div>
            <div>
              <Label htmlFor="commercialEmail">Email de login (dashboard)</Label>
              <Input
                id="commercialEmail"
                type="email"
                value={newCommercialEmail}
                onChange={(e) => setNewCommercialEmail(e.target.value)}
                placeholder="cuenta@oroboats.com"
              />
            </div>
            <div>
              <Label htmlFor="notificationEmail">Email de notificaciones</Label>
              <Input
                id="notificationEmail"
                type="email"
                value={newNotificationEmail}
                onChange={(e) => setNewNotificationEmail(e.target.value)}
                placeholder="info@suempresa.com"
              />
            </div>
            <div>
              <Label htmlFor="commissionPercent">Comisión % (opcional)</Label>
              <Input
                id="commissionPercent"
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={newCommissionPercent}
                onChange={(e) => setNewCommissionPercent(e.target.value)}
                placeholder="Ej: 10"
              />
            </div>
          </div>
          <Button onClick={addHotel} className="bg-black text-white hover:bg-gray-800">
            <PlusCircle className="h-4 w-4 mr-2" />
            Añadir Hotel
          </Button>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </CardContent>
      </Card>

      {/* Hotel List */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-800">
            <Search className="h-5 w-5 mr-2" />
            Hoteles Registrados
          </CardTitle>
          <CardDescription>Lista de hoteles y sus códigos.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          {filteredHotels.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No se encontraron hoteles.</p>
          ) : (
            <div className="space-y-3">
              {filteredHotels.map((hotel) => {
                const bookingCount = hotelBookingCounts[hotel.code.toUpperCase()] || 0
                const isEditing = editingId === hotel.id

                if (isEditing) {
                  return (
                    <div key={hotel.id} className="p-4 border-2 border-yellow-300 rounded-md bg-yellow-50 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-gray-500">Nombre</Label>
                          <Input
                            value={editData.name}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Código</Label>
                          <Input
                            value={editData.code}
                            onChange={(e) => setEditData({ ...editData, code: e.target.value.toUpperCase() })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Email login (dashboard)</Label>
                          <Input
                            type="email"
                            value={editData.commercialEmail}
                            onChange={(e) => setEditData({ ...editData, commercialEmail: e.target.value })}
                            placeholder="cuenta@oroboats.com"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Email notificaciones</Label>
                          <Input
                            type="email"
                            value={editData.notificationEmail}
                            onChange={(e) => setEditData({ ...editData, notificationEmail: e.target.value })}
                            placeholder="info@suempresa.com"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Comisión %</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={editData.commissionPercent}
                            onChange={(e) => setEditData({ ...editData, commissionPercent: e.target.value })}
                            placeholder="10"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={saveEdit} size="sm" className="bg-green-600 text-white hover:bg-green-700">
                          <Check className="h-4 w-4 mr-1" /> Guardar
                        </Button>
                        <Button onClick={cancelEdit} size="sm" variant="outline">
                          <X className="h-4 w-4 mr-1" /> Cancelar
                        </Button>
                      </div>
                    </div>
                  )
                }

                return (
                  <div
                    key={hotel.id}
                    className="flex items-center justify-between p-3 border border-gray-100 rounded-md bg-gray-50"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">{hotel.name}</p>
                      <p className="text-sm text-gray-600 flex items-center flex-wrap gap-x-2">
                        <span className="flex items-center">
                          <Hotel className="h-3 w-3 mr-1" />
                          Código: {hotel.code}
                        </span>
                        <span className="text-xs font-medium text-gray-500">(Reservas: {bookingCount})</span>
                        {hotel.commercialEmail && (
                          <span className="text-xs text-blue-600">Login: {hotel.commercialEmail}</span>
                        )}
                        {(hotel as any).notificationEmail && (
                          <span className="text-xs text-purple-600">Notif: {(hotel as any).notificationEmail}</span>
                        )}
                        {hotel.commissionPercent && Number(hotel.commissionPercent) > 0 && (
                          <span className="text-xs text-yellow-600">Comisión: {hotel.commissionPercent}%</span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => startEdit(hotel)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteHotel(hotel.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
