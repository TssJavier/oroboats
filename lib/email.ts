// ✅ FUNCIONES HELPER PARA ENVIAR EMAILS VIA API
// No necesitamos Resend aquí porque todo se maneja en la API route

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

// ✅ EMAIL AL ADMIN CUANDO HAY NUEVA RESERVA
export async function sendAdminNotification(booking: BookingEmailData) {
  try {
    console.log("📧 Sending admin notification for booking:", booking.bookingId)

    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "booking-admin-notification",
        data: booking,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to send admin notification")
    }

    const result = await response.json()
    console.log("✅ Admin notification sent:", result)
    return true
  } catch (error) {
    console.error("❌ Error sending admin notification:", error)
    return false
  }
}

// ✅ EMAIL DE CONFIRMACIÓN AL CLIENTE
export async function sendCustomerConfirmation(booking: BookingEmailData) {
  try {
    console.log("📧 Sending customer confirmation for booking:", booking.bookingId)

    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "booking-customer-confirmation",
        data: booking,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to send customer confirmation")
    }

    const result = await response.json()
    console.log("✅ Customer confirmation sent:", result)
    return true
  } catch (error) {
    console.error("❌ Error sending customer confirmation:", error)
    return false
  }
}

// ✅ NUEVA FUNCIÓN: ENVIAR AMBOS EMAILS DE RESERVA
export async function sendBookingEmails(booking: BookingEmailData) {
  try {
    console.log("📧 Sending complete booking emails for:", booking.bookingId)

    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "booking-complete",
        data: booking,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to send booking emails")
    }

    const result = await response.json()
    console.log("✅ Booking emails sent:", result)
    return {
      success: result.success,
      adminSent: result.adminSent,
      customerSent: result.customerSent,
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

// ✅ FUNCIÓN HELPER PARA ENVIAR EMAILS DE CONTACTO
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

// ✅ FUNCIÓN INDIVIDUAL PARA NOTIFICACIÓN AL ADMIN
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

// ✅ FUNCIÓN INDIVIDUAL PARA CONFIRMACIÓN AL CLIENTE
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
