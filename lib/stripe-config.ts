import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
})

// ✅ CONFIGURACIÓN DE MÉTODOS DE PAGO
export const PAYMENT_METHODS = {
  card: {
    enabled: true,
    name: "Tarjeta de Crédito/Débito",
    description: "Visa, Mastercard, American Express",
    icon: "💳",
  },
  paypal: {
    enabled: true,
    name: "PayPal",
    description: "Paga con tu cuenta PayPal",
    icon: "🅿️",
  },
  apple_pay: {
    enabled: true,
    name: "Apple Pay",
    description: "Pago rápido con Touch ID",
    icon: "🍎",
  },
  google_pay: {
    enabled: true,
    name: "Google Pay",
    description: "Pago rápido con Google",
    icon: "🔵",
  },
  // Bizum estará disponible próximamente en Stripe
  bizum: {
    enabled: false, // Activar cuando esté disponible
    name: "Bizum",
    description: "Pago instantáneo con Bizum",
    icon: "📱",
  },
}

// ✅ CREAR PAYMENT INTENT CON FIANZA
export async function createPaymentWithDeposit({
  amount,
  depositAmount,
  currency = "eur",
  metadata = {},
}: {
  amount: number
  depositAmount: number
  currency?: string
  metadata?: Record<string, string>
}) {
  try {
    // 1. Payment Intent para el alquiler (se captura inmediatamente)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convertir a centavos
      currency,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never", // Evitar redirects para mejor UX
      },
      metadata: {
        ...metadata,
        type: "rental_payment",
      },
    })

    // 2. Payment Intent para la fianza (se autoriza pero no se captura)
    const depositIntent = await stripe.paymentIntents.create({
      amount: Math.round(depositAmount * 100),
      currency,
      capture_method: "manual", // ✅ CLAVE: No capturar automáticamente
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
      metadata: {
        ...metadata,
        type: "security_deposit",
      },
    })

    return {
      paymentIntent,
      depositIntent,
      totalAuthorized: amount + depositAmount,
    }
  } catch (error) {
    console.error("Error creating payment intents:", error)
    throw error
  }
}

export default stripe
