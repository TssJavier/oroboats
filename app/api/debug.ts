// Este archivo es solo para referencia y depuración
// Muestra cómo debería ser la estructura de la API

interface BookingResponse {
  booking: {
    id: number
    customerName: string
    // ... otros campos

    // Posibles variaciones del campo de tipo de pago
    payment_type?: string // Formato snake_case (desde la base de datos)
    paymentType?: string // Formato camelCase (posiblemente transformado)

    // Campos relacionados con el pago parcial
    amountPaid?: string
    amountPending?: string
  }
  vehicle: {
    name: string
    type: string
  } | null
}

// Ejemplo de cómo podría ser un mapeo correcto
function mapDatabaseToFrontend(dbBooking: any): BookingResponse {
  return {
    booking: {
      // ... mapeo de otros campos
      id: dbBooking.id,
      customerName: dbBooking.customerName,

      // Asegurarse de que ambos formatos estén disponibles
      payment_type: dbBooking.payment_type,
      paymentType: dbBooking.payment_type, // Transformar a camelCase si es necesario

      amountPaid: dbBooking.amount_paid,
      amountPending: dbBooking.amount_pending,
    },
    vehicle: dbBooking.vehicle,
  }
}
