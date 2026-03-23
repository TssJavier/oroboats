// ✅ FUNCIONES HELPER PARA ENVIAR EMAILS VIA API
import { Resend } from "resend"
import { renderAdminBookingNotification, renderCustomerBookingConfirmation } from "./email-templates"

// Variables para configuración
const ADMIN_EMAIL = process.env.ADMIN_EMAIL_RESEND || "info@oroboats.com"

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
      from: "OroBoats Granada <info@oroboats.com>",
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
      from: "OroBoats Granada <info@oroboats.com>",
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

// ✅ EMAIL AL COMERCIAL CUANDO HAY RESERVA CON SU CÓDIGO
export async function sendCommercialNotification(booking: BookingEmailData & { hotelCode?: string | null }, commercialEmail: string, hotelName: string) {
  try {
    if (!commercialEmail || !booking.hotelCode) return false

    console.log(`📧 Sending commercial notification to ${commercialEmail} for booking:`, booking.bookingId)

    const resend = getResendClient()

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8" /></head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f8f9fa; padding: 20px; margin: 0;">
        <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
          <div style="background: linear-gradient(135deg, #f59e0b, #eab308); padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px;">Nueva reserva con tu código</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Código: <strong>${booking.hotelCode}</strong> · ${hotelName}</p>
          </div>
          <div style="padding: 24px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Reserva</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: 600; text-align: right;">#${booking.bookingId}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Cliente</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: 600; text-align: right;">${booking.customerName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Vehículo</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: 600; text-align: right;">${booking.vehicleName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Fecha</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: 600; text-align: right;">${booking.bookingDate}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Horario</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: 600; text-align: right;">${booking.startTime} - ${booking.endTime}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666;">Importe</td>
                <td style="padding: 10px 0; font-weight: 700; text-align: right; font-size: 18px; color: #16a34a;">€${booking.totalPrice.toFixed(2)}</td>
              </tr>
            </table>
            <div style="margin-top: 20px; padding: 16px; background: #fefce8; border-radius: 8px; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #854d0e;">Puedes ver todas tus ventas y comisiones en tu panel de comercial.</p>
            </div>
          </div>
          <div style="padding: 16px; text-align: center; background: #f9fafb; font-size: 12px; color: #9ca3af;">
            OroBoats · Sistema de reservas
          </div>
        </div>
      </body>
      </html>
    `

    const { data, error } = await resend.emails.send({
      from: "OroBoats <info@oroboats.com>",
      to: [commercialEmail],
      subject: `Nueva reserva #${booking.bookingId} con tu código ${booking.hotelCode}`,
      html: emailHtml,
    })

    if (error) {
      console.error("❌ Resend API error (commercial):", error)
      return false
    }

    console.log("✅ Commercial notification sent:", data)
    return true
  } catch (error) {
    console.error("❌ Error sending commercial notification:", error)
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
