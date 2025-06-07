"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { HelpCircle, X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export function BookingStatusHelp() {
  const [showHelp, setShowHelp] = useState(false)

  if (!showHelp) {
    return (
      <Button variant="outline" size="sm" onClick={() => setShowHelp(true)} className="flex items-center gap-2">
        <HelpCircle className="h-4 w-4" />
        ¿Qué significan los estados?
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Guía de Estados de Reservas</h2>
          <Button variant="ghost" onClick={() => setShowHelp(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          <Tabs defaultValue="booking" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="booking">Estados de Reserva</TabsTrigger>
              <TabsTrigger value="deposit">Estados de Fianza</TabsTrigger>
            </TabsList>

            <TabsContent value="booking" className="space-y-6 pt-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Estados de Reserva</h3>
                <p className="text-gray-600">Cada reserva pasa por diferentes estados durante su ciclo de vida:</p>

                <div className="space-y-4">
                  <StatusExplanation
                    status="pending"
                    color="bg-yellow-600"
                    title="Pendiente"
                    description="La reserva ha sido creada pero aún no ha sido confirmada. El cliente ha seleccionado fecha y hora, pero el proceso no está completo."
                    actions={[
                      "Confirmar la reserva manualmente",
                      "Contactar al cliente si hay dudas",
                      "Cancelar si es necesario",
                    ]}
                  />

                  <StatusExplanation
                    status="confirmed"
                    color="bg-green-600"
                    title="Confirmada"
                    description="La reserva ha sido confirmada y está lista para ser utilizada. El pago ha sido procesado correctamente y el cliente puede utilizar el servicio en la fecha reservada."
                    actions={[
                      "Preparar el vehículo/producto para el cliente",
                      "Enviar recordatorio al cliente",
                      "Marcar como completada después del uso",
                    ]}
                  />

                  <StatusExplanation
                    status="completed"
                    color="bg-blue-600"
                    title="Completada"
                    description="El servicio ha sido utilizado por el cliente y la reserva ha finalizado correctamente. El cliente ha devuelto el vehículo/producto y se ha verificado su estado."
                    actions={[
                      "Realizar inspección de daños",
                      "Procesar la devolución de fianza",
                      "Solicitar valoración al cliente",
                    ]}
                  />

                  <StatusExplanation
                    status="cancelled"
                    color="bg-red-600"
                    title="Cancelada"
                    description="La reserva ha sido cancelada y no se llevará a cabo. Puede ser cancelada por el cliente o por el administrador."
                    actions={[
                      "Procesar reembolso si corresponde",
                      "Liberar el horario para otras reservas",
                      "Registrar motivo de cancelación",
                    ]}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="deposit" className="space-y-6 pt-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Estados de Fianza</h3>
                <p className="text-gray-600">
                  Las fianzas de seguridad tienen su propio ciclo de vida independiente del estado de la reserva:
                </p>

                <div className="space-y-4">
                  <StatusExplanation
                    status="pending"
                    color="bg-yellow-500"
                    title="Pendiente"
                    description="La fianza ha sido autorizada pero aún no ha sido inspeccionada. El cliente ha completado el servicio pero no se ha verificado si hay daños."
                    actions={[
                      "Realizar inspección del vehículo/producto",
                      "Aprobar la fianza si no hay daños",
                      "Registrar daños si existen",
                    ]}
                  />

                  <StatusExplanation
                    status="approved"
                    color="bg-green-500"
                    title="Aprobada"
                    description="La inspección ha sido completada y no se han encontrado daños. La fianza será devuelta al cliente en su totalidad."
                    actions={["La fianza se devuelve automáticamente", "Notificar al cliente", "Cerrar el proceso"]}
                  />

                  <StatusExplanation
                    status="damaged"
                    color="bg-red-500"
                    title="Con Daños"
                    description="Se han encontrado daños durante la inspección. Parte o toda la fianza será retenida para cubrir los costes de reparación."
                    actions={[
                      "Documentar los daños con fotos",
                      "Calcular el coste de reparación",
                      "Retener la cantidad correspondiente",
                      "Devolver el resto si procede",
                    ]}
                  />
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">¿Cómo funciona el proceso de fianzas?</h4>
                  <ol className="list-decimal pl-5 space-y-2 text-blue-700">
                    <li>
                      <span className="font-medium">Autorización:</span> Al hacer la reserva, se autoriza (no se cobra)
                      la fianza en la tarjeta del cliente
                    </li>
                    <li>
                      <span className="font-medium">Uso del servicio:</span> El cliente utiliza el vehículo/producto
                    </li>
                    <li>
                      <span className="font-medium">Inspección:</span> Al finalizar, se inspecciona para verificar su
                      estado
                    </li>
                    <li>
                      <span className="font-medium">Decisión:</span> Se aprueba la devolución o se registran daños
                    </li>
                    <li>
                      <span className="font-medium">Procesamiento:</span> Se devuelve la fianza completa o parcial según
                      corresponda
                    </li>
                  </ol>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

function StatusExplanation({
  status,
  color,
  title,
  description,
  actions,
}: {
  status: string
  color: string
  title: string
  description: string
  actions: string[]
}) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-lg">{title}</h4>
        <Badge className={color}>{status}</Badge>
      </div>
      <p className="text-gray-600 mb-3">{description}</p>
      <div>
        <h5 className="font-medium text-sm text-gray-700 mb-1">Acciones recomendadas:</h5>
        <ul className="list-disc pl-5 text-sm text-gray-600">
          {actions.map((action, i) => (
            <li key={i}>{action}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
