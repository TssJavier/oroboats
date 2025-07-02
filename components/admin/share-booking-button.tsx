"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Share2, Copy, Check, Calendar, Clock, Ship, Zap } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { Vehicle } from "@/lib/db/schema"

interface ShareBookingButtonProps {
  vehicles: Vehicle[]
  className?: string
}

export function ShareBookingButton({ vehicles, className = "" }: ShareBookingButtonProps) {
  const { toast } = useToast()

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [selectedDate, setSelectedDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [duration, setDuration] = useState("")
  const [price, setPrice] = useState("")
  const [shareUrl, setShareUrl] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const generateShareLink = () => {
    if (!selectedVehicle || !selectedDate || !startTime || !endTime || !duration || !price) {
      toast({
        title: "Error",
        description: "Completa todos los campos para generar el enlace",
        variant: "destructive",
      })
      return
    }

    const baseUrl = window.location.origin
    const vehiclePath = `/boats/${selectedVehicle.id}/book`
    const params = new URLSearchParams({
      date: selectedDate,
      startTime: startTime,
      endTime: endTime,
      duration: duration,
      price: price,
    })

    const fullUrl = `${baseUrl}${vehiclePath}?${params.toString()}`
    setShareUrl(fullUrl)

    toast({
      title: "Enlace generado",
      description: "El enlace de reserva ha sido generado correctamente",
    })
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setLinkCopied(true)
      toast({
        title: "Enlace copiado",
        description: "El enlace se ha copiado al portapapeles",
      })

      setTimeout(() => {
        setLinkCopied(false)
      }, 3000)
    } catch (err) {
      console.error("Error copying to clipboard:", err)
      toast({
        title: "Error",
        description: "No se pudo copiar el enlace",
        variant: "destructive",
      })
    }
  }

  const sendWhatsApp = () => {
    if (!shareUrl) return

    const message = `¡Hola! 👋

Aquí tienes el enlace para completar tu reserva de ${selectedVehicle?.name}:

📅 Fecha: ${new Date(selectedDate).toLocaleDateString("es-ES")}
⏰ Horario: ${startTime} - ${endTime}
💰 Precio: €${price}

${shareUrl}

Aquí está la ${selectedVehicle?.name} para el ${new Date(selectedDate).toLocaleDateString("es-ES")}, rellena el formulario y firma el contrato, luego podrás elegir tu forma de pago.

Además puedes reservarla y pagar aquí el resto o pagar todo y olvidarte de problemas. 

Ten en cuenta que deberás dejar una fianza aquí en persona que se devolverá si no ha habido daños por imprudencia en la ${selectedVehicle?.type === "jetski" ? "moto" : "embarcación"}.

¡Esperamos verte pronto! 🚤`

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  const resetForm = () => {
    setSelectedVehicle(null)
    setSelectedDate("")
    setStartTime("")
    setEndTime("")
    setDuration("")
    setPrice("")
    setShareUrl("")
    setLinkCopied(false)
  }

  if (!showForm) {
    return (
      <Button onClick={() => setShowForm(true)} className={`bg-blue-600 text-white hover:bg-blue-700 ${className}`}>
        <Share2 className="h-4 w-4 mr-2" />
        Generar enlace de reserva
      </Button>
    )
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-blue-600" />
          Generar enlace de reserva
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selección de vehículo */}
        <div className="space-y-2">
          <Label htmlFor="vehicle">Vehículo *</Label>
          <Select
            onValueChange={(value) => {
              const vehicle = vehicles.find((v) => v.id.toString() === value)
              setSelectedVehicle(vehicle || null)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un vehículo" />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                  <div className="flex items-center gap-2">
                    {vehicle.type === "jetski" ? <Zap className="h-4 w-4" /> : <Ship className="h-4 w-4" />}
                    {vehicle.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Fecha */}
        <div className="space-y-2">
          <Label htmlFor="date">Fecha *</Label>
          <Input
            id="date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
          />
        </div>

        {/* Horarios */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startTime">Hora inicio *</Label>
            <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">Hora fin *</Label>
            <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </div>

        {/* Duración y precio */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="duration">Duración *</Label>
            <Select onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona duración" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30min">30 minutos</SelectItem>
                <SelectItem value="1hour">1 hora</SelectItem>
                <SelectItem value="2hour">2 horas</SelectItem>
                <SelectItem value="4hour">4 horas</SelectItem>
                <SelectItem value="halfday">Medio día</SelectItem>
                <SelectItem value="fullday">Día completo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Precio (€) *</Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="150"
            />
          </div>
        </div>

        {/* Resumen */}
        {selectedVehicle && selectedDate && startTime && endTime && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Resumen de la reserva</h4>
            <div className="space-y-1 text-sm text-blue-800">
              <div className="flex items-center gap-2">
                {selectedVehicle.type === "jetski" ? <Zap className="h-4 w-4" /> : <Ship className="h-4 w-4" />}
                <span>{selectedVehicle.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(selectedDate).toLocaleDateString("es-ES")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  {startTime} - {endTime}
                </span>
              </div>
              <div className="font-semibold">Precio: €{price}</div>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-2">
          <Button
            onClick={generateShareLink}
            className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
            disabled={!selectedVehicle || !selectedDate || !startTime || !endTime || !duration || !price}
          >
            Generar enlace
          </Button>
          <Button onClick={resetForm} variant="outline">
            Limpiar
          </Button>
          <Button onClick={() => setShowForm(false)} variant="outline">
            Cerrar
          </Button>
        </div>

        {/* Enlace generado */}
        {shareUrl && (
          <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-900">Enlace generado</h4>

            <div className="bg-white p-3 rounded border text-sm font-mono break-all">{shareUrl}</div>

            <div className="flex gap-2">
              <Button onClick={copyToClipboard} variant="outline" className="flex-1 bg-transparent">
                {linkCopied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar enlace
                  </>
                )}
              </Button>
              <Button onClick={sendWhatsApp} className="flex-1 bg-green-600 text-white hover:bg-green-700">
                📱 Enviar por WhatsApp
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
