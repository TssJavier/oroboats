"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Lock, Loader2, Copy, Check, Unlock, Clock, Calendar, Ship, Zap, MapPin, KeyRound } from "lucide-react"

interface Vehicle {
  id: number
  name: string
  type: string
  requiresLicense: boolean
  beachLocationId: string | null
  image: string
}

interface BeachLocation {
  id: string
  name: string
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

// Orden y etiquetas de los tramos de duración (de más corto a más largo)
const DURATION_ORDER = ["30min", "1hour", "2hour", "3hour", "4hour", "halfday", "fullday"]

function durationCategory(duration: string): string {
  if (duration.startsWith("halfday")) return "halfday"
  if (duration.startsWith("fullday")) return "fullday"
  return duration
}

function durationLabel(cat: string): string {
  switch (cat) {
    case "30min":
      return "30 minutos"
    case "1hour":
      return "1 hora"
    case "2hour":
      return "2 horas"
    case "3hour":
      return "3 horas"
    case "4hour":
      return "4 horas"
    case "halfday":
      return "Medio día"
    case "fullday":
      return "Día completo"
    default:
      return cat
  }
}

export function CommercialHolds() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [locations, setLocations] = useState<BeachLocation[]>([])
  const [holds, setHolds] = useState<Hold[]>([])
  const [loadingHolds, setLoadingHolds] = useState(true)

  // Flujo de selección en cascada
  const [beachId, setBeachId] = useState<string>("")
  const [vType, setVType] = useState<string>("") // 'boat' | 'jetski'
  const [license, setLicense] = useState<string>("") // 'yes' | 'no'
  const [vehicleId, setVehicleId] = useState<string>("")
  const [date, setDate] = useState<string>("")

  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [durationCat, setDurationCat] = useState<string>("")
  const [selectedSlotKey, setSelectedSlotKey] = useState<string>("")

  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string>("")
  const [copiedId, setCopiedId] = useState<number | null>(null)

  // Cargar vehículos, playas y bloqueos al montar
  useEffect(() => {
    fetch("/api/vehicles")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setVehicles(
            data.map((v: any) => ({
              id: v.id,
              name: v.name,
              type: v.type,
              requiresLicense: Boolean(v.requiresLicense),
              beachLocationId: v.beachLocationId ?? null,
              image: v.image || "",
            })),
          )
        }
      })
      .catch(() => {})
    fetch("/api/locations")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setLocations(data.map((l: any) => ({ id: String(l.id), name: l.name })))
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

  // ✅ Opciones derivadas de los datos reales para no dejar callejones sin salida
  const beachOptions = useMemo(
    () => locations.filter((l) => vehicles.some((v) => v.beachLocationId === l.id)),
    [locations, vehicles],
  )

  const typeOptions = useMemo(() => {
    const set = new Set(vehicles.filter((v) => v.beachLocationId === beachId).map((v) => v.type))
    return Array.from(set)
  }, [vehicles, beachId])

  const licenseOptions = useMemo(() => {
    const set = new Set(
      vehicles.filter((v) => v.beachLocationId === beachId && v.type === vType).map((v) => v.requiresLicense),
    )
    return Array.from(set) // [true] | [false] | [true,false]
  }, [vehicles, beachId, vType])

  const filteredVehicles = useMemo(
    () =>
      vehicles.filter(
        (v) =>
          v.beachLocationId === beachId && v.type === vType && v.requiresLicense === (license === "yes"),
      ),
    [vehicles, beachId, vType, license],
  )

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => String(v.id) === vehicleId) || null,
    [vehicles, vehicleId],
  )

  // Categorías de duración presentes en los slots disponibles (ordenadas)
  const durationCats = useMemo(() => {
    const set = new Set(slots.map((s) => durationCategory(s.duration)))
    return DURATION_ORDER.filter((d) => set.has(d))
  }, [slots])

  // Slots de la categoría elegida (ordenados por hora de inicio)
  const slotsForCat = useMemo(
    () =>
      slots
        .filter((s) => durationCategory(s.duration) === durationCat)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [slots, durationCat],
  )

  // --- Handlers de cascada: al cambiar un paso, se resetean los siguientes ---
  const onBeachChange = (val: string) => {
    setBeachId(val)
    setVType("")
    setLicense("")
    setVehicleId("")
  }
  const onTypeChange = (val: string) => {
    setVType(val)
    setLicense("")
    setVehicleId("")
  }
  const onLicenseChange = (val: string) => {
    setLicense(val)
    setVehicleId("")
  }

  // Cargar horarios cuando hay vehículo + fecha
  useEffect(() => {
    setSlots([])
    setDurationCat("")
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
      setError("Completa todos los pasos: playa, tipo, licencia, vehículo, día y horario.")
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
      // Reset completo y refrescar
      setSelectedSlotKey("")
      setDurationCat("")
      setSlots([])
      setDate("")
      setVehicleId("")
      setLicense("")
      setVType("")
      setBeachId("")
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
    if (
      !confirm(
        `¿Desbloquear ${hold.vehicleName} del ${formatDate(hold.bookingDate)} ${hold.timeSlot}? Quedará libre para cualquiera.`,
      )
    ) {
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

  const typeLabel = (t: string) => (t === "jetski" ? "Moto de agua" : "Barco")
  const TypeIcon = ({ t, className }: { t: string; className?: string }) =>
    t === "jetski" ? <Zap className={className} /> : <Ship className={className} />

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
          Bloquea un vehículo a una hora y día concretos para que nadie te lo quite. Pásale al cliente el enlace de pago
          para que reserve, o desbloquéalo si al final no lo coge. Los bloqueos se liberan solos a las 8 horas.
        </p>

        {/* ---------- Formulario de bloqueo paso a paso ---------- */}
        <div className="space-y-4">
          {/* Paso 1: Playa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                1
              </span>
              <MapPin className="h-4 w-4 text-purple-500" /> Playa
            </label>
            <Select value={beachId} onValueChange={onBeachChange}>
              <SelectTrigger className="bg-gray-50">
                <SelectValue placeholder="Selecciona la playa" />
              </SelectTrigger>
              <SelectContent>
                {beachOptions.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Paso 2: Tipo (barco / moto) */}
          {beachId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                  2
                </span>
                ¿Barco o moto?
              </label>
              <div className="flex flex-wrap gap-2">
                {["boat", "jetski"]
                  .filter((t) => typeOptions.includes(t))
                  .map((t) => (
                    <Button
                      key={t}
                      type="button"
                      variant={vType === t ? "default" : "outline"}
                      className={vType === t ? "bg-purple-600 text-white hover:bg-purple-700" : ""}
                      onClick={() => onTypeChange(t)}
                    >
                      <TypeIcon t={t} className="h-4 w-4 mr-2" />
                      {typeLabel(t)}
                    </Button>
                  ))}
              </div>
            </div>
          )}

          {/* Paso 3: Licencia */}
          {beachId && vType && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                  3
                </span>
                <KeyRound className="h-4 w-4 text-purple-500" /> ¿Licencia?
              </label>
              <div className="flex flex-wrap gap-2">
                {licenseOptions.includes(true) && (
                  <Button
                    type="button"
                    variant={license === "yes" ? "default" : "outline"}
                    className={license === "yes" ? "bg-purple-600 text-white hover:bg-purple-700" : ""}
                    onClick={() => onLicenseChange("yes")}
                  >
                    Con licencia
                  </Button>
                )}
                {licenseOptions.includes(false) && (
                  <Button
                    type="button"
                    variant={license === "no" ? "default" : "outline"}
                    className={license === "no" ? "bg-purple-600 text-white hover:bg-purple-700" : ""}
                    onClick={() => onLicenseChange("no")}
                  >
                    Sin licencia
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Paso 4: Vehículo + imagen de confirmación */}
          {beachId && vType && license && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                  4
                </span>
                Vehículo
              </label>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger className="bg-gray-50">
                  <SelectValue
                    placeholder={filteredVehicles.length ? "Selecciona vehículo" : "No hay vehículos con estos criterios"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredVehicles.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Confirmación visual del vehículo elegido */}
              {selectedVehicle && (
                <div className="mt-3 flex items-center gap-3 rounded-lg border border-purple-200 bg-purple-50 p-3">
                  {selectedVehicle.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedVehicle.image}
                      alt={selectedVehicle.name}
                      className="h-20 w-28 rounded-md object-cover bg-white"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.display = "none"
                      }}
                    />
                  ) : (
                    <div className="h-20 w-28 rounded-md bg-white flex items-center justify-center text-purple-300">
                      <TypeIcon t={selectedVehicle.type} className="h-8 w-8" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-semibold text-black truncate">{selectedVehicle.name}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge className="bg-white text-purple-700 border-purple-200">{typeLabel(selectedVehicle.type)}</Badge>
                      <Badge className="bg-white text-purple-700 border-purple-200">
                        {selectedVehicle.requiresLicense ? "Con licencia" : "Sin licencia"}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Confirma que es el vehículo que quieres bloquear.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Paso 5: Día */}
          {vehicleId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                  5
                </span>
                <Calendar className="h-4 w-4 text-purple-500" /> Día
              </label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-gray-50 max-w-xs" />
            </div>
          )}

          {/* Paso 6: Tramo de duración */}
          {vehicleId && date && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                  6
                </span>
                <Clock className="h-4 w-4 text-purple-500" /> Duración
              </label>
              {loadingSlots ? (
                <div className="flex items-center py-2 text-gray-500 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Cargando horarios...
                </div>
              ) : durationCats.length === 0 ? (
                <p className="text-sm text-gray-500">No hay horarios disponibles para ese día.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {durationCats.map((cat) => (
                    <Button
                      key={cat}
                      type="button"
                      variant={durationCat === cat ? "default" : "outline"}
                      className={durationCat === cat ? "bg-purple-600 text-white hover:bg-purple-700" : ""}
                      onClick={() => {
                        setDurationCat(cat)
                        setSelectedSlotKey("")
                      }}
                    >
                      {durationLabel(cat)}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Paso 7: Hora concreta */}
          {vehicleId && date && durationCat && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                  7
                </span>
                Hora
              </label>
              <Select value={selectedSlotKey} onValueChange={setSelectedSlotKey}>
                <SelectTrigger className="bg-gray-50 max-w-md">
                  <SelectValue placeholder="Selecciona la hora" />
                </SelectTrigger>
                <SelectContent>
                  {slotsForCat.map((s) => (
                    <SelectItem key={slotKey(s)} value={slotKey(s)}>
                      {s.startTime} - {s.endTime} · €{s.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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
