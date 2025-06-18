import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import {
  renderAdminBookingNotification,
  renderCustomerBookingConfirmation,
  renderContactNotification,
  renderContactConfirmation,
} from "@/lib/email-templates"

export async function POST(request: NextRequest) {
  try {
    // ✅ Validar API key antes de inicializar Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL_RESEND || "info@oroboats.com"

    console.log("🔍 Checking environment variables...")
    console.log("🔍 RESEND_API_KEY:", RESEND_API_KEY ? "✅ Found" : "❌ Missing")
    console.log("🔍 ADMIN_EMAIL_RESEND:", ADMIN_EMAIL)

    if (!RESEND_API_KEY) {
      console.error("❌ RESEND_API_KEY not found in environment variables")
      return NextResponse.json({ error: "Email service not configured - missing API key" }, { status: 500 })
    }

    // ✅ Inicializar Resend solo después de validar la API key
    const resend = new Resend(RESEND_API_KEY)

    const { type, data } = await request.json()
    console.log(`📧 API: Processing ${type} email request`)

    // Validar tipo de email
    if (!type || !data) {
      return NextResponse.json({ error: "Missing email type or data" }, { status: 400 })
    }

    // Procesar según el tipo de email
    switch (type) {
      case "booking-admin-notification": {
        console.log("📧 API: Sending booking admin notification")
        const html = renderAdminBookingNotification(data)
        const { data: result, error } = await resend.emails.send({
          from: "OroBoats Granada <info@oroboats.com>", // ✅ Dominio verificado
          to: [ADMIN_EMAIL],
          subject: `Nueva reserva #${data.bookingId} - ${data.vehicleName}`,
          html,
        })

        if (error) {
          console.error("❌ API: Resend error:", error)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        console.log("✅ API: Booking admin notification sent:", result)
        return NextResponse.json({ success: true, data: result })
      }

      case "booking-customer-confirmation": {
        console.log("📧 API: Sending booking customer confirmation")
        const html = renderCustomerBookingConfirmation(data)
        const { data: result, error } = await resend.emails.send({
          from: "OroBoats Granada <info@oroboats.com>", // ✅ Dominio verificado
          to: [data.customerEmail],
          subject: `Confirmación de reserva #${data.bookingId} - OroBoats`,
          html,
        })

        if (error) {
          console.error("❌ API: Resend error:", error)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        console.log("✅ API: Booking customer confirmation sent:", result)
        return NextResponse.json({ success: true, data: result })
      }

      case "booking-complete": {
        console.log("📧 API: Sending complete booking emails")

        // Enviar email al admin
        const adminHtml = renderAdminBookingNotification(data)
        const adminResult = await resend.emails.send({
          from: "OroBoats Granada <info@oroboats.com>", // ✅ Dominio verificado
          to: [ADMIN_EMAIL],
          subject: `Nueva reserva #${data.bookingId} - ${data.vehicleName}`,
          html: adminHtml,
        })

        // Enviar email al cliente
        const customerHtml = renderCustomerBookingConfirmation(data)
        const customerResult = await resend.emails.send({
          from: "OroBoats Granada <info@oroboats.com>", // ✅ Dominio verificado
          to: [data.customerEmail],
          subject: `Confirmación de reserva #${data.bookingId} - OroBoats`,
          html: customerHtml,
        })

        // Verificar resultados
        const adminSuccess = !adminResult.error
        const customerSuccess = !customerResult.error

        if (!adminSuccess) {
          console.error("❌ API: Admin email error:", adminResult.error)
        }
        if (!customerSuccess) {
          console.error("❌ API: Customer email error:", customerResult.error)
        }

        console.log("✅ API: Booking emails sent:", {
          adminSuccess,
          customerSuccess,
        })

        return NextResponse.json({
          success: adminSuccess || customerSuccess,
          adminSent: adminSuccess,
          customerSent: customerSuccess,
        })
      }

      case "contact": {
        console.log("📧 API: Sending contact emails")

        // Enviar notificación al admin
        const adminHtml = renderContactNotification(data)
        const adminResult = await resend.emails.send({
          from: "OroBoats Granada <info@oroboats.com>", // ✅ Dominio verificado
          to: [ADMIN_EMAIL],
          subject: `Nuevo mensaje de contacto - ${data.name}`,
          html: adminHtml,
        })

        // Enviar confirmación al cliente
        const customerHtml = renderContactConfirmation(data)
        const customerResult = await resend.emails.send({
          from: "OroBoats Granada <info@oroboats.com>", // ✅ Dominio verificado
          to: [data.email],
          subject: "Hemos recibido tu mensaje - OroBoats",
          html: customerHtml,
        })

        // Verificar resultados
        const adminSuccess = !adminResult.error
        const customerSuccess = !customerResult.error

        console.log("✅ API: Contact emails sent:", {
          adminSuccess,
          customerSuccess,
        })

        return NextResponse.json({
          success: adminSuccess || customerSuccess,
          adminSent: adminSuccess,
          customerSent: customerSuccess,
        })
      }

      case "contact-notification": {
        console.log("📧 API: Sending contact notification to admin")
        const html = renderContactNotification(data)
        const { data: result, error } = await resend.emails.send({
          from: "OroBoats Granada <info@oroboats.com>", // ✅ Dominio verificado
          to: [ADMIN_EMAIL],
          subject: `Nuevo mensaje de contacto - ${data.name}`,
          html,
        })

        if (error) {
          console.error("❌ API: Resend error:", error)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        console.log("✅ API: Contact notification sent:", result)
        return NextResponse.json({ success: true, data: result })
      }

      case "contact-confirmation": {
        console.log("📧 API: Sending contact confirmation to customer")
        const html = renderContactConfirmation(data)
        const { data: result, error } = await resend.emails.send({
          from: "OroBoats Granada <info@oroboats.com>", // ✅ Dominio verificado
          to: [data.email],
          subject: "Hemos recibido tu mensaje - OroBoats",
          html,
        })

        if (error) {
          console.error("❌ API: Resend error:", error)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        console.log("✅ API: Contact confirmation sent:", result)
        return NextResponse.json({ success: true, data: result })
      }

      default:
        return NextResponse.json({ error: "Invalid email type" }, { status: 400 })
    }
  } catch (error) {
    console.error("❌ API: Error processing email request:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
