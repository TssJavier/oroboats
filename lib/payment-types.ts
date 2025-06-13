// ✅ TIPOS Y CONSTANTES PARA PAGOS PARCIALES

export type PaymentType = "full_payment" | "partial_payment"
export type PaymentLocation = "online" | "on_site" | "mixed"

export interface PaymentOption {
  type: PaymentType
  label: string
  description: string
  onlineAmount: number
  remainingAmount: number
  totalAmount: number
}

// ✅ CONSTANTES PARA PAGOS PARCIALES
export const PARTIAL_PAYMENT_AMOUNTS = {
  jetski: 50, // 50€ para motos
  boat: 100, // 100€ para barcos
} as const

// ✅ FUNCIÓN PARA CALCULAR OPCIONES DE PAGO
export function calculatePaymentOptions(
  vehicleType: "jetski" | "boat",
  totalPrice: number,
  securityDeposit = 0,
): PaymentOption[] {
  const partialAmount = PARTIAL_PAYMENT_AMOUNTS[vehicleType]
  const remainingAmount = totalPrice - partialAmount

  // Si el precio total es menor que el pago parcial estándar, no ofrecemos pago parcial
  if (totalPrice <= partialAmount) {
    return [
      {
        type: "full_payment",
        label: "Pago Completo Online",
        description: "Paga todo ahora con tarjeta",
        onlineAmount: totalPrice + securityDeposit,
        remainingAmount: 0,
        totalAmount: totalPrice + securityDeposit,
      },
    ]
  }

  return [
    {
      type: "full_payment",
      label: "Pago Completo Online",
      description: "Paga todo ahora con tarjeta",
      onlineAmount: totalPrice + securityDeposit,
      remainingAmount: 0,
      totalAmount: totalPrice + securityDeposit,
    },
    {
      type: "partial_payment",
      label: "Pago Parcial",
      description: `Paga ${partialAmount}€ ahora + ${remainingAmount}€ en el sitio`,
      onlineAmount: partialAmount + securityDeposit,
      remainingAmount: remainingAmount,
      totalAmount: totalPrice + securityDeposit,
    },
  ]
}

// ✅ FUNCIÓN PARA DETERMINAR TIPO DE VEHÍCULO
export function getVehicleTypeFromCategory(category: string): "jetski" | "boat" {
  if (category?.includes("jetski")) return "jetski"
  return "boat" // default a boat si no es claramente jetski
}
