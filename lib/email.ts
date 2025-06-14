// ✅ FUNCIONES HELPER PARA ENVIAR EMAILS VIA API
import { Resend } from "resend"
import { renderAdminBookingNotification, renderCustomerBookingConfirmation } from "./email-templates"

// Variables para configuración
const ADMIN_EMAIL = process.env.ADMIN_EMAIL_RESEND || "fergsaenz@gmail.com"

// Función para obtener una instancia de Resend con validación
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.error("❌ RESEND_API_KEY no está configurada en las variables de entorno")
    throw new Error("RESEND_API_KEY is required")
  }

  return new Resend(apiKey)
}

interface BookingEmailData {
  bookingId: number
  customerName: string
  customerEmail: string
  customerPhone: string
  vehicleName: string
  bookingDate: string
  startTime: string
  endTime: string
  totalPrice: number
  discountAmount?: number
  originalPrice?: number
  discountCode?: string
  securityDeposit: number
}

interface ContactEmailData {
  name: string
  email: string
  phone?: string
  message: string
}

// ✅ EMAIL AL ADMIN CUANDO HAY NUEVA RESERVA - VERSIÓN DIRECTA
export async function sendAdminNotification(booking: BookingEmailData) {
  try {
    console.log("📧 Sending admin notification for booking:", booking.bookingId)

    // Obtener cliente Resend
    const resend = getResendClient()

    // Renderizar el HTML del email
    const emailHtml = renderAdminBookingNotification(booking)

    // Enviar email directamente con Resend
    const { data, error } = await resend.emails.send({
      from: "OroBoats Granada <onboarding@resend.dev>",
      to: [ADMIN_EMAIL],
      subject: `Nueva reserva #${booking.bookingId} - ${booking.vehicleName}`,
      html: emailHtml,
    })

    if (error) {
      console.error("❌ Resend API error:", error)
      return false
    }

    console.log("✅ Admin notification sent:", data)
    return true
  } catch (error) {
    console.error("❌ Error sending admin notification:", error)
    return false
  }
}

// ✅ EMAIL DE CONFIRMACIÓN AL CLIENTE - VERSIÓN DIRECTA
export async function sendCustomerConfirmation(booking: BookingEmailData) {
  try {
    console.log("📧 Sending customer confirmation for booking:", booking.bookingId)

    // Obtener cliente Resend
    const resend = getResendClient()

    // Renderizar el HTML del email
    const emailHtml = renderCustomerBookingConfirmation(booking)

    // Enviar email directamente con Resend
    const { data, error } = await resend.emails.send({
      from: "OroBoats Granada <onboarding@resend.dev>",
      to: [booking.customerEmail],
      subject: `Confirmación de reserva #${booking.bookingId} - Oro Boats`,
      html: emailHtml,
    })

    if (error) {
      console.error("❌ Resend API error:", error)
      return false
    }

    console.log("✅ Customer confirmation sent:", data)
    return true
  } catch (error) {
    console.error("❌ Error sending customer confirmation:", error)
    return false
  }
}

// ✅ NUEVA FUNCIÓN: ENVIAR AMBOS EMAILS DE RESERVA - VERSIÓN DIRECTA
export async function sendBookingEmails(booking: BookingEmailData) {
  try {
    console.log("📧 Sending complete booking emails for:", booking.bookingId)

    // Enviar ambos emails
    const adminResult = await sendAdminNotification(booking)
    const customerResult = await sendCustomerConfirmation(booking)

    return {
      success: adminResult || customerResult,
      adminSent: adminResult,
      customerSent: customerResult,
    }
  } catch (error) {
    console.error("❌ Error sending booking emails:", error)
    return {
      success: false,
      adminSent: false,
      customerSent: false,
    }
  }
}

// ✅ FUNCIONES PARA EL CLIENTE (BROWSER)
// Estas funciones usan fetch y son para llamadas desde el navegador

// Función helper para enviar emails de contacto desde el cliente
export async function sendContactEmails(data: ContactEmailData) {
  try {
    console.log("📧 Sending contact email via API...")

    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "contact",
        data,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("❌ API Error:", errorData)
      throw new Error(errorData.error || "Failed to send contact email")
    }

    const result = await response.json()
    console.log("✅ Contact emails sent successfully:", result)
    return {
      success: true,
      ...result,
    }
  } catch (error) {
    console.error("❌ Error sending contact email:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Función individual para notificación al admin desde el cliente
export async function sendContactNotification(contactData: ContactEmailData) {
  try {
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "contact-notification",
        data: contactData,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to send contact notification")
    }

    return await response.json()
  } catch (error) {
    console.error("Error sending contact notification:", error)
    throw error
  }
}

// Función individual para confirmación al cliente desde el cliente
export async function sendContactConfirmation(contactData: ContactEmailData) {
  try {
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "contact-confirmation",
        data: contactData,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to send contact confirmation")
    }

    return await response.json()
  } catch (error) {
    console.error("Error sending contact confirmation:", error)
    throw error
  }
}
