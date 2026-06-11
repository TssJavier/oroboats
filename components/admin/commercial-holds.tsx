"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Lock, Loader2, Copy, Check, Unlock, Clock, Calendar, Ship, Zap } from "lucide-react"

interface Vehicle {
  id: number
  name: string
  type: string
}

interface Slot {
  startTime: string
  endTime: string
  duration: string
  label: string
  price: number
  available: boolean
  availableUnits: number
}

interface Hold {
  id: number
  vehicleId: number
  vehicleName: string
  vehicleType: string
  bookingDate: string
  timeSlot: string
  startTime: string
  endTime: string
  duration: string
  totalPrice: string
  hotelCode: string | null
  beachLocationName: string | null
  createdAt: string
  expiresAt: string
  payUrl: string
}

export function CommercialHolds() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [holds, setHolds] = useState<Hold[]>([])
  const [loadingHolds, setLoadingHolds] = useState(true)

  const [vehicleId, setVehicleId] = useState<string>("")
  const [date, setDate] = useState<string>("")
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlotKey, setSelectedSlotKey] = useState<string>("")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string>("")
  const [copiedId, setCopiedId] = useState<number | null>(null)

  // Cargar vehículos y bloqueos al montar
  useEffect(() => {
    fetch("/api/vehicles")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setVehicles(data.map((v: any) => ({ id: v.id, name: v.name, type: v.type })))
      })
      .catch(() => {})
    fetchHolds()
  }, [])

  const fetchHolds = async () => {
    setLoadingHolds(true)
    try {
      const r = await fetch("/api/commercial/holds")
      if (r.ok) {
        const data = await r.json()
        setHolds(data.holds || [])
      }
    } catch {
      // silencioso
    } finally {
      setLoadingHolds(false)
    }
  }

  // Cargar horarios cuando hay vehículo + fecha
  useEffect(() => {
    setSlots([])
    setSelectedSlotKey("")
    if (!vehicleId || !date) return
    setLoadingSlots(true)
    fetch("/api/vehicles/time-slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicleId: Number(vehicleId), date }),
    })
      .then((r) => (r.ok ? r.json() : { availableSlots: [] }))
      .then((data) => {
        const list: Slot[] = (data.availableSlots || []).filter((s: Slot) => s.availableUnits > 0)
        setSlots(list)
      })
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [vehicleId, date])

  const slotKey = (s: Slot) => `${s.startTime}-${s.endTime}-${s.duration}`

  const handleBlock = async () => {
    setError("")
    const slot = slots.find((s) => slotKey(s) === selectedSlotKey)
    if (!vehicleId || !date || !slot) {
      setError("Selecciona barco, día y horario.")
      return
    }
    setCreating(true)
    try {
      const r = await fetch("/api/commercial/holds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: Number(vehicleId),
          bookingDate: date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          duration: slot.duration,
          price: slot.price,
        }),
      })
      const data = await r.json()
      if (!r.ok) {
        setError(data.error || "No se pudo crear el bloqueo.")
        return
      }
      // Reset y refrescar
      setSelectedSlotKey("")
      setSlots([])
      setDate("")
      setVehicleId("")
      await fetchHolds()
    } catch {
      setError("Error de conexión al crear el bloqueo.")
    } finally {
      setCreating(false)
    }
  }

  const handleCopy = async (hold: Hold) => {
    try {
      await navigator.clipboard.writeText(hold.payUrl)
      setCopiedId(hold.id)
      setTimeout(() => setCopiedId(null), 3000)
    } catch {
      // fallback: mostrar la URL
      window.prompt("Copia el enlace de pago:", hold.payUrl)
    }
  }

  const handleUnblock = async (hold: Hold) => {
    if (!confirm(`¿Desbloquear ${hold.vehicleName} del ${formatDate(hold.bookingDate)} ${hold.timeSlot}? Quedará libre para cualquiera.`)) {
      return
    }
    try {
      const r = await fetch(`/api/commercial/holds/${hold.id}`, { method: "DELETE" })
      if (r.ok) await fetchHolds()
      else setError("No se pudo desbloquear.")
    } catch {
      setError("Error de conexión al desbloquear.")
    }
  }

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("es-ES")
    } catch {
      return d
    }
  }

  const formatExpiry = (d: string) => {
    try {
      return new Date(d).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
    } catch {
      return d
    }
  }

  return (
    <Card className="bg-white border-2 border-purple-100">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Lock className="h-5 w-5 mr-2 text-purple-600" />
          Bloqueos / Reservas en espera
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-gray-600">
          Bloquea un barco a una hora y día concretos para que nadie te lo quite. Pásale al cliente el enlace de pago para
          que reserve, o desbloquéalo si al final no lo coge. Los bloqueos se liberan solos a las 8 horas.
        </p>

        {/* Formulario de bloqueo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Barco / Moto</label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger className="bg-gray-50">
                <SelectValue placeholder="Selecciona vehículo" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={String(v.id)}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Día</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Horario</label>
            <Select value={selectedSlotKey} onValueChange={setSelectedSlotKey} disabled={!vehicleId || !date || loadingSlots}>
              <SelectTrigger className="bg-gray-50">
                <SelectValue placeholder={loadingSlots ? "Cargando..." : slots.length ? "Selecciona horario" : "Sin horarios"} />
              </SelectTrigger>
              <SelectContent>
                {slots.map((s) => (
                  <SelectItem key={slotKey(s)} value={slotKey(s)}>
                    {s.startTime}-{s.endTime} · €{s.price} {s.label ? `(${s.label})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button
          onClick={handleBlock}
          disabled={creating || !vehicleId || !date || !selectedSlotKey}
          className="bg-purple-600 text-white hover:bg-purple-700"
        >
          {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
          Bloquear este hueco
        </Button>

        {/* Lista de bloqueos activos */}
        <div className="pt-2">
          <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Tus bloqueos activos ({holds.length})
          </h4>
          {loadingHolds ? (
            <div className="flex items-center py-6 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando...
            </div>
          ) : holds.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No tienes bloqueos activos.</p>
          ) : (
            <div className="space-y-3">
              {holds.map((h) => (
                <div key={h.id} className="border border-gray-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 font-medium text-black">
                      {h.vehicleType === "jetski" ? (
                        <Zap className="h-4 w-4 text-purple-500" />
                      ) : (
                        <Ship className="h-4 w-4 text-purple-500" />
                      )}
                      <span className="truncate">{h.vehicleName}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      <span>{formatDate(h.bookingDate)}</span>
                      <span>{h.timeSlot}</span>
                      <span>€{Number(h.totalPrice).toFixed(0)}</span>
                      {h.beachLocationName && <span>{h.beachLocationName}</span>}
                      <span className="flex items-center gap-1 text-amber-600">
                        <Clock className="h-3 w-3" /> caduca {formatExpiry(h.expiresAt)}
                      </span>
                      {!h.hotelCode && (
                        <Badge className="bg-red-100 text-red-700 border-red-200">sin código → sin comisión</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleCopy(h)}
                      variant={copiedId === h.id ? "default" : "outline"}
                    >
                      {copiedId === h.id ? (
                        <>
                          <Check className="h-3 w-3 mr-1" /> Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" /> Enlace de pago
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleUnblock(h)}
                      className="bg-red-600 text-white hover:bg-red-700"
                    >
                      <Unlock className="h-3 w-3 mr-1" /> Desbloquear
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
