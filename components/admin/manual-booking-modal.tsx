"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, User, AlertTriangle, FileText, Loader2, UserCheck, CreditCard, Banknote } from "lucide-react"
import { toast } from "sonner"
import { ManualWaiverModal } from "./manual-waiver-modal"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface Vehicle {
  id: number
  name: string
  type: string
  requiresLicense: boolean
  capacity: number
  pricing: Array<{
    duration: string
    price: number
    label: string
  }>
  securityDeposit?: number
  stock?: number
}

interface TimeSlot {
  startTime: string
  endTime: string
  duration: string
  label: string
  price: number
  available: boolean
  availableUnits: number
  totalUnits: number
}

interface ManualBookingModalProps {
  vehicle: Vehicle | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

// Lista de comerciales disponibles
const SALES_STAFF = [
  { id: "manuel", name: "Manuel" },
  { id: "fermin", name: "Fermín" },
  { id: "javier", name: "Javier" },
]

export function ManualBookingModal({ vehicle, isOpen, onClose, onSuccess }: ManualBookingModalProps) {
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    bookingDate: "",
    notes: "",
    salesPerson: "",
    paymentMethod: "cash", // ✅ NUEVO: Método de pago por defecto (efectivo)
  })
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 🆕 NUEVOS ESTADOS PARA LA FIRMA
  const [showWaiverModal, setShowWaiverModal] = useState(false)
  const [liabilityWaiverId, setLiabilityWaiverId] = useState<number | null>(null)

  // Cargar slots disponibles cuando cambie la fecha
  useEffect(() => {
    if (formData.bookingDate && vehicle) {
      fetchAvailableSlots()
    } else {
      setAvailableSlots([])
      setSelectedSlot(null)
    }
  }, [formData.bookingDate, vehicle])

  const fetchAvailableSlots = async () => {
    if (!vehicle || !formData.bookingDate) return

    setLoadingSlots(true)
    setError(null)
    try {
      console.log("🕐 Fetching available slots for vehicle:", vehicle.id, "date:", formData.bookingDate)

      // Usar la API mejorada que tiene en cuenta el stock
      const response = await fetch("/api/vehicles/time-slots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          date: formData.bookingDate,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al cargar horarios disponibles")
      }

      const data = await response.json()
      console.log("✅ Available slots:", data.availableSlots)

      // Filtrar slots que realmente tienen unidades disponibles
      const filteredSlots = data.availableSlots.filter((slot: TimeSlot) => slot.availableUnits > 0)

      setAvailableSlots(filteredSlots || [])

      // Debug de stock
      console.log(`📊 Stock total del vehículo: ${vehicle.stock || 1}`)
      console.log(`📊 Slots con disponibilidad: ${filteredSlots.length}`)
    } catch (error) {
      console.error("❌ Error fetching slots:", error)
      toast.error("Error al cargar los horarios disponibles")
      setError("No se pudieron cargar los horarios. Por favor, intenta de nuevo.")
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    console.log(`Setting ${field} to "${value}"`)
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Limpiar slot seleccionado si cambia la fecha
    if (field === "bookingDate") {
      setSelectedSlot(null)
    }

    // Log específico para el método de pago
    if (field === "paymentMethod") {
      console.log(`🔍 Payment method selected: "${value}"`)
    }
  }

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    console.log("🎯 Selected slot:", slot)
  }

  // 🆕 MANEJAR FIRMA COMPLETADA
  const handleWaiverSigned = (waiverId: number) => {
    setLiabilityWaiverId(waiverId)
    setShowWaiverModal(false)
    toast.success("Documento firmado correctamente")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vehicle || !selectedSlot) return

    // Añadir log para verificar el método de pago antes de enviar
    console.log(`📤 Submitting form with payment method: "${formData.paymentMethod}"`)

    // Validaciones
    if (!formData.customerName.trim()) {
      toast.error("El nombre del cliente es requerido")
      return
    }

    if (!formData.customerPhone.trim()) {
      toast.error("El teléfono del cliente es requerido")
      return
    }

    if (!formData.bookingDate) {
      toast.error("La fecha de reserva es requerida")
      return
    }

    if (!selectedSlot) {
      toast.error("Debes seleccionar un horario disponible")
      return
    }

    if (!formData.salesPerson) {
      toast.error("Debes seleccionar un comercial")
      return
    }

    // ✅ NUEVO: Validar método de pago
    if (!formData.paymentMethod) {
      toast.error("Debes seleccionar un método de pago")
      return
    }

    // 🆕 VALIDAR QUE ESTÉ FIRMADO EL DOCUMENTO
    if (!liabilityWaiverId) {
      toast.error("El cliente debe firmar el documento de exención de responsabilidad")
      setShowWaiverModal(true)
      return
    }

    const selectedDate = new Date(formData.bookingDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (selectedDate < today) {
      toast.error("No se pueden crear reservas para fechas pasadas")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Determinar la duración basada en el tiempo seleccionado
      let duration = "30min"
      if (selectedSlot.endTime && selectedSlot.startTime) {
        const startParts = selectedSlot.startTime.split(":").map(Number)
        const endParts = selectedSlot.endTime.split(":").map(Number)

        const startMinutes = startParts[0] * 60 + startParts[1]
        const endMinutes = endParts[0] * 60 + endParts[1]
        const durationMinutes = endMinutes - startMinutes

        if (durationMinutes === 60) duration = "1hour"
        else if (durationMinutes === 120) duration = "2hour"
        else if (durationMinutes === 240) duration = "halfday"
        else if (durationMinutes >= 480) duration = "fullday"
      }

      const response = await fetch("/api/bookings/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          customerEmail:
            formData.customerEmail || `${formData.customerName.replace(/\s+/g, "").toLowerCase()}@manual.booking`,
          bookingDate: formData.bookingDate,
          timeSlot: `${selectedSlot.startTime}-${selectedSlot.endTime}`,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          duration: duration,
          totalPrice: selectedSlot.price,
          notes: formData.notes,
          isManualBooking: true,
          salesPerson: formData.salesPerson,
          vehicleName: vehicle.name,
          vehicleType: vehicle.type,
          liabilityWaiverId: liabilityWaiverId, // 🆕 INCLUIR ID DEL DOCUMENTO FIRMADO
          paymentMethod: formData.paymentMethod, // ✅ NUEVO: Incluir método de pago
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.details || "Error al crear la reserva")
      }

      console.log("✅ Manual booking created:", result)

      toast.success("Reserva manual creada correctamente")

      // Limpiar formulario
      setFormData({
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        bookingDate: "",
        notes: "",
        salesPerson: "",
        paymentMethod: "cash", // ✅ NUEVO: Resetear método de pago
      })
      setSelectedSlot(null)
      setAvailableSlots([])
      setLiabilityWaiverId(null) // 🆕 LIMPIAR ID DE FIRMA

      onSuccess()
      onClose()
    } catch (error) {
      console.error("❌ Error creating manual booking:", error)
      setError(error instanceof Error ? error.message : "Error al crear la reserva")
      toast.error(error instanceof Error ? error.message : "Error al crear la reserva")
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (time: string) => {
    return time.slice(0, 5) // HH:MM
  }

  if (!vehicle) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gold" />
              Reserva Manual - {vehicle.name}
            </DialogTitle>
          </DialogHeader>

          {/* Advertencias importantes */}
          <div className="space-y-3">
            {vehicle.requiresLicense && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-800">⚠️ Licencia Requerida</h4>
                    <p className="text-sm text-blue-700">
                      Este vehículo requiere licencia náutica. Asegúrate de que el cliente la traiga.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-orange-800">📋 Documentación Requerida</h4>
                  <ul className="text-sm text-orange-700 mt-1 space-y-1">
                    <li>• Consentimiento de exención de responsabilidad firmado</li>
                    <li>• DNI o documento de identidad válido</li>
                    {vehicle.requiresLicense && <li>• Licencia náutica vigente</li>}
                    {vehicle.securityDeposit && <li>• Fianza de €{vehicle.securityDeposit} (tarjeta/efectivo)</li>}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información del cliente */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Información del Cliente
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Nombre completo *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => handleInputChange("customerName", e.target.value)}
                    placeholder="Nombre del cliente"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="customerPhone">Teléfono *</Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => handleInputChange("customerPhone", e.target.value)}
                    placeholder="+34 600 000 000"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="customerEmail">Email (opcional)</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => handleInputChange("customerEmail", e.target.value)}
                  placeholder="cliente@email.com"
                />
              </div>
            </div>

            {/* Selección de comercial */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Comercial
              </h3>

              <div className="w-full md:w-1/2">
                <Label htmlFor="salesPerson">Comercial que realiza la venta *</Label>
                <Select
                  value={formData.salesPerson}
                  onValueChange={(value) => handleInputChange("salesPerson", value)}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un comercial" />
                  </SelectTrigger>
                  <SelectContent>
                    {SALES_STAFF.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ✅ NUEVO: Selección de método de pago */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Método de Pago
              </h3>

              <RadioGroup
                value={formData.paymentMethod}
                onValueChange={(value) => {
                  console.log(`RadioGroup value changed to: "${value}"`)
                  handleInputChange("paymentMethod", value)
                }}
                className="flex flex-col space-y-3"
              >
                <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="cash" id="payment-cash" />
                  <Label htmlFor="payment-cash" className="flex items-center cursor-pointer">
                    <Banknote className="h-5 w-5 mr-2 text-green-600" />
                    <div>
                      <span className="font-medium">Efectivo</span>
                      <p className="text-xs text-gray-500">El cliente ha pagado en efectivo</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="card" id="payment-card" />
                  <Label htmlFor="payment-card" className="flex items-center cursor-pointer">
                    <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                    <div>
                      <span className="font-medium">Tarjeta</span>
                      <p className="text-xs text-gray-500">El cliente ha pagado con tarjeta</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Selección de fecha */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Fecha de la Reserva
              </h3>

              <div className="w-full md:w-1/3">
                <Label htmlFor="bookingDate">Fecha *</Label>
                <Input
                  id="bookingDate"
                  type="date"
                  value={formData.bookingDate}
                  onChange={(e) => handleInputChange("bookingDate", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
            </div>

            {/* Selección de horario */}
            {formData.bookingDate && (
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Horarios Disponibles
                </h3>

                {loadingSlots ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gold" />
                    <span className="ml-2 text-gray-600">Cargando horarios disponibles...</span>
                  </div>
                ) : error ? (
                  <div className="text-center py-6 bg-red-50 rounded-lg border border-red-200">
                    <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-red-700">{error}</p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-3 text-red-600 border-red-300 hover:bg-red-50"
                      onClick={fetchAvailableSlots}
                    >
                      Reintentar
                    </Button>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Clock className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-600">No hay horarios disponibles para esta fecha</p>
                    <p className="text-sm text-gray-500">Prueba con otra fecha</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {availableSlots.map((slot, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSlotSelect(slot)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          selectedSlot === slot
                            ? "border-gold bg-gold/10 shadow-md"
                            : "border-gray-200 hover:border-gold/50 hover:bg-gray-50"
                        }`}
                        disabled={!slot.available || slot.availableUnits < 1}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900">
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </span>
                          <span className="text-lg font-bold text-gold">€{slot.price}</span>
                        </div>
                        <div className="text-sm text-gray-600">{slot.label}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Duración: {slot.duration} •
                          {slot.availableUnits > 0 ? (
                            <span className="text-green-600"> {slot.availableUnits} disponible(s)</span>
                          ) : (
                            <span className="text-red-600"> No disponible</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Slot seleccionado */}
            {selectedSlot && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-green-800">Horario Seleccionado</h4>
                    <p className="text-green-700">
                      {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)} ({selectedSlot.label})
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">€{selectedSlot.price}</div>
                    {vehicle.securityDeposit && (
                      <div className="text-sm text-green-700">+ Fianza: €{vehicle.securityDeposit}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 🆕 SECCIÓN DE FIRMA DIGITAL */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Exención de Responsabilidad
              </h3>

              {liabilityWaiverId ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-green-600 mr-2" />
                      <div>
                        <h4 className="font-semibold text-green-800">✅ Documento Firmado</h4>
                        <p className="text-green-700 text-sm">El cliente ha firmado la exención de responsabilidad</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-green-300 text-green-700 hover:bg-green-50"
                      onClick={() => setShowWaiverModal(true)}
                    >
                      Volver a firmar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                      <div>
                        <h4 className="font-semibold text-yellow-800">⚠️ Firma Requerida</h4>
                        <p className="text-yellow-700 text-sm">
                          El cliente debe firmar el documento antes de crear la reserva
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                      onClick={() => setShowWaiverModal(true)}
                      disabled={!formData.customerName.trim()}
                    >
                      Firmar Documento
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Notas adicionales */}
            <div>
              <Label htmlFor="notes">Notas adicionales</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Observaciones, instrucciones especiales..."
                rows={3}
              />
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gold text-black hover:bg-gold/90"
                disabled={loading || !selectedSlot || !formData.salesPerson || !liabilityWaiverId}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Crear Reserva
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 🆕 MODAL DE FIRMA */}
      <ManualWaiverModal
        isOpen={showWaiverModal}
        onClose={() => setShowWaiverModal(false)}
        onWaiverSigned={handleWaiverSigned}
        customerName={formData.customerName}
        customerEmail={
          formData.customerEmail || `${formData.customerName.replace(/\s+/g, "").toLowerCase()}@manual.booking`
        }
      />
    </>
  )
}
