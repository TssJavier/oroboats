import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json()

    console.log("📧 Email API called with type:", type)

    if (!process.env.RESEND_API_KEY) {
      console.error("❌ RESEND_API_KEY not found in server environment")
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 })
    }

    // ✅ ACTUALIZADO: Usar la nueva variable de entorno
    const adminEmail = process.env.ADMIN_EMAIL_RESEND || "javitricking@hotmail.com"
    console.log("📧 Admin email configured as:", adminEmail)

    switch (type) {
      case "contact": {
        // Enviar ambos emails de contacto
        const adminResult = await sendContactNotificationEmail(data, adminEmail)
        const customerResult = await sendContactConfirmationEmail(data)

        return NextResponse.json({
          success: adminResult.success && customerResult.success,
          adminSent: adminResult.success,
          customerSent: customerResult.success,
          adminId: adminResult.id,
          customerId: customerResult.id,
        })
      }

      case "contact-notification": {
        const result = await sendContactNotificationEmail(data, adminEmail)
        return NextResponse.json(result)
      }

      case "contact-confirmation": {
        const result = await sendContactConfirmationEmail(data)
        return NextResponse.json(result)
      }

      case "booking-admin-notification": {
        console.log("📧 Processing booking admin notification...")
        const result = await sendBookingAdminNotificationEmail(data, adminEmail)
        return NextResponse.json(result)
      }

      case "booking-customer-confirmation": {
        console.log("📧 Processing booking customer confirmation...")
        const result = await sendBookingCustomerConfirmationEmail(data)
        return NextResponse.json(result)
      }

      case "booking-complete": {
        console.log("📧 Processing complete booking emails...")
        const adminResult = await sendBookingAdminNotificationEmail(data, adminEmail)
        const customerResult = await sendBookingCustomerConfirmationEmail(data)

        return NextResponse.json({
          success: adminResult.success && customerResult.success,
          adminSent: adminResult.success,
          customerSent: customerResult.success,
          adminId: adminResult.id,
          customerId: customerResult.id,
        })
      }

      default:
        return NextResponse.json({ error: "Invalid email type" }, { status: 400 })
    }
  } catch (error) {
    console.error("❌ Email API Error:", error)
    return NextResponse.json(
      { error: "Failed to send email", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

// ✅ FUNCIÓN PARA EMAIL DE CONTACTO AL ADMIN
async function sendContactNotificationEmail(data: any, adminEmail: string) {
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: "OroBoats <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `📧 Nuevo Mensaje de Contacto - ${data.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #FFD700, #FFA500); padding: 20px; text-align: center;">
            <h1 style="color: #000; margin: 0;">📧 Nuevo Mensaje de Contacto</h1>
            <p style="color: #000; margin: 5px 0;">OroBoats Granada</p>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h2 style="color: #333;">Mensaje de: ${data.name}</h2>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
              <h3 style="color: #FFD700; margin-top: 0;">👤 Datos del Cliente</h3>
              <p><strong>Nombre:</strong> ${data.name}</p>
              <p><strong>Email:</strong> ${data.email}</p>
              ${data.phone ? `<p><strong>Teléfono:</strong> ${data.phone}</p>` : ""}
            </div>

            <div style="background: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
              <h3 style="color: #FFD700; margin-top: 0;">💬 Mensaje</h3>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #FFD700;">
                <p style="margin: 0; white-space: pre-wrap;">${data.message}</p>
              </div>
            </div>

            <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <p style="margin: 0; color: #155724;">
                <strong>✅ Acción requerida:</strong> Responder al cliente lo antes posible.
              </p>
            </div>
          </div>
          
          <div style="background: #333; color: white; padding: 15px; text-align: center;">
            <p style="margin: 0;">OroBoats Granada - Formulario de Contacto</p>
            <p style="margin: 5px 0; font-size: 12px;">Responde directamente a: ${data.email}</p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error("❌ Error sending contact notification:", error)
      return { success: false, error }
    }

    console.log("✅ Contact notification sent to admin:", emailData?.id)
    return { success: true, id: emailData?.id }
  } catch (error) {
    console.error("❌ Error in sendContactNotificationEmail:", error)
    return { success: false, error }
  }
}

// ✅ FUNCIÓN PARA EMAIL DE CONFIRMACIÓN AL CLIENTE (CONTACTO)
async function sendContactConfirmationEmail(data: any) {
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: "OroBoats Granada <onboarding@resend.dev>",
      to: [data.email],
      subject: `✅ Mensaje Recibido - OroBoats Granada`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #FFD700, #FFA500); padding: 20px; text-align: center;">
            <h1 style="color: #000; margin: 0;">✅ ¡Mensaje Recibido!</h1>
            <p style="color: #000; margin: 5px 0;">OroBoats Granada</p>
          </div>
          
          <div style="padding: 20px;">
            <p>Hola <strong>${data.name}</strong>,</p>
            <p>¡Gracias por contactar con nosotros! Hemos recibido tu mensaje y te responderemos lo antes posible.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #FFD700; margin-top: 0;">📋 Tu Mensaje</h3>
              <div style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #FFD700;">
                <p style="margin: 0; white-space: pre-wrap;">${data.message}</p>
              </div>
            </div>

            <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #155724; margin-top: 0;">⏰ Tiempo de Respuesta</h3>
              <p style="color: #155724; margin: 0;">
                Normalmente respondemos en <strong>menos de 24 horas</strong>. 
                Si tu consulta es urgente, puedes llamarnos directamente.
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <p><strong>¿Necesitas una respuesta inmediata?</strong></p>
              <p>
                📞 <strong>Teléfono:</strong> +34 655 52 79 88<br>
                📱 <strong>WhatsApp:</strong> +34 643 44 23 64<br>
                ✉️ <strong>Email:</strong> info@oroboats.com
              </p>
            </div>
          </div>
          
          <div style="background: #333; color: white; padding: 15px; text-align: center;">
            <p style="margin: 0;">¡Gracias por elegir OroBoats Granada!</p>
            <p style="margin: 5px 0; font-size: 12px;">Experiencias únicas en la costa mediterránea</p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error("❌ Error sending contact confirmation:", error)
      return { success: false, error }
    }

    console.log("✅ Contact confirmation sent to customer:", emailData?.id)
    return { success: true, id: emailData?.id }
  } catch (error) {
    console.error("❌ Error in sendContactConfirmationEmail:", error)
    return { success: false, error }
  }
}

// ✅ NUEVA FUNCIÓN: EMAIL AL ADMIN CUANDO HAY UNA NUEVA RESERVA
async function sendBookingAdminNotificationEmail(booking: any, adminEmail: string) {
  try {
    console.log("📧 Sending booking admin notification to:", adminEmail)
    console.log("📧 Booking data:", {
      bookingId: booking.bookingId,
      customerName: booking.customerName,
      vehicleName: booking.vehicleName,
    })

    const { data: emailData, error } = await resend.emails.send({
      from: "OroBoats <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `🚤 Nueva Reserva #${booking.bookingId} - ${booking.vehicleName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #FFD700, #FFA500); padding: 20px; text-align: center;">
            <h1 style="color: #000; margin: 0;">🚤 Nueva Reserva - OroBoats</h1>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h2 style="color: #333;">Detalles de la Reserva #${booking.bookingId}</h2>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
              <h3 style="color: #FFD700; margin-top: 0;">🚤 Vehículo</h3>
              <p><strong>${booking.vehicleName}</strong></p>
            </div>

            <div style="background: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
              <h3 style="color: #FFD700; margin-top: 0;">👤 Cliente</h3>
              <p><strong>Nombre:</strong> ${booking.customerName}</p>
              <p><strong>Email:</strong> ${booking.customerEmail}</p>
              <p><strong>Teléfono:</strong> ${booking.customerPhone}</p>
            </div>

            <div style="background: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
              <h3 style="color: #FFD700; margin-top: 0;">📅 Fecha y Hora</h3>
              <p><strong>Fecha:</strong> ${booking.bookingDate}</p>
              <p><strong>Hora:</strong> ${booking.startTime} - ${booking.endTime}</p>
            </div>

            <div style="background: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
              <h3 style="color: #FFD700; margin-top: 0;">💰 Precios</h3>
              ${
                booking.originalPrice && booking.discountAmount
                  ? `
                <p><strong>Precio original:</strong> €${booking.originalPrice}</p>
                <p><strong>Descuento (${booking.discountCode}):</strong> -€${booking.discountAmount}</p>
                <p style="color: #28a745;"><strong>Precio final:</strong> €${booking.totalPrice}</p>
              `
                  : `
                <p><strong>Precio total:</strong> €${booking.totalPrice}</p>
              `
              }
              <p><strong>Fianza retenida:</strong> €${booking.securityDeposit || 0}</p>
            </div>

            <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <p style="margin: 0; color: #155724;">
                <strong>✅ Acción requerida:</strong> Confirmar disponibilidad y preparar vehículo para la fecha indicada.
              </p>
            </div>
          </div>
          
          <div style="background: #333; color: white; padding: 15px; text-align: center;">
            <p style="margin: 0;">OroBoats Granada - Panel de Administración</p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error("❌ Error sending booking admin notification:", error)
      return { success: false, error }
    }

    console.log("✅ Booking admin notification sent:", emailData?.id)
    return { success: true, id: emailData?.id }
  } catch (error) {
    console.error("❌ Error in sendBookingAdminNotificationEmail:", error)
    return { success: false, error }
  }
}

// ✅ NUEVA FUNCIÓN: EMAIL DE CONFIRMACIÓN AL CLIENTE (RESERVA)
async function sendBookingCustomerConfirmationEmail(booking: any) {
  try {
    console.log("📧 Sending booking customer confirmation to:", booking.customerEmail)

    const { data: emailData, error } = await resend.emails.send({
      from: "OroBoats Granada <onboarding@resend.dev>",
      to: [booking.customerEmail],
      subject: `✅ Reserva Confirmada #${booking.bookingId} - ${booking.vehicleName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #FFD700, #FFA500); padding: 20px; text-align: center;">
            <h1 style="color: #000; margin: 0;">🚤 ¡Reserva Confirmada!</h1>
            <p style="color: #000; margin: 5px 0;">OroBoats Granada</p>
          </div>
          
          <div style="padding: 20px;">
            <p>Hola <strong>${booking.customerName}</strong>,</p>
            <p>¡Tu reserva ha sido confirmada! Aquí tienes todos los detalles:</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #FFD700; margin-top: 0;">📋 Detalles de tu Reserva #${booking.bookingId}</h2>
              
              <p><strong>🚤 Vehículo:</strong> ${booking.vehicleName}</p>
              <p><strong>📅 Fecha:</strong> ${booking.bookingDate}</p>
              <p><strong>🕐 Horario:</strong> ${booking.startTime} - ${booking.endTime}</p>
              
              <hr style="border: 1px solid #ddd; margin: 15px 0;">
              
              ${
                booking.originalPrice && booking.discountAmount
                  ? `
                <p><strong>💰 Precio original:</strong> €${booking.originalPrice}</p>
                <p style="color: #28a745;"><strong>🎉 Descuento aplicado (${booking.discountCode}):</strong> -€${booking.discountAmount}</p>
                <p style="font-size: 18px; color: #28a745;"><strong>💰 Total pagado:</strong> €${booking.totalPrice}</p>
              `
                  : `
                <p style="font-size: 18px;"><strong>💰 Total pagado:</strong> €${booking.totalPrice}</p>
              `
              }
            </div>

            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #856404; margin-top: 0;">🛡️ Información sobre la Fianza</h3>
              <p style="color: #856404; margin: 0;">
                <strong>Fianza retenida:</strong> €${booking.securityDeposit || 0}<br>
                <strong>✅ Se devolverá íntegramente</strong> al finalizar el alquiler si el vehículo se devuelve en las mismas condiciones en que se entregó.
              </p>
            </div>

            <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #155724; margin-top: 0;">📍 Información Importante</h3>
              <ul style="color: #155724; margin: 0; padding-left: 20px;">
                <li>Llega 15 minutos antes de tu hora de reserva</li>
                <li>Trae tu DNI/Pasaporte original</li>
                <li>La fianza se libera automáticamente si no hay daños</li>
                <li>Respeta las normas de navegación y seguridad</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <p>¿Tienes alguna pregunta?</p>
              <p>
                📞 <strong>Teléfono:</strong> +34 655 52 79 88<br>
                📱 <strong>WhatsApp:</strong> +34 643 44 23 64<br>
                ✉️ <strong>Email:</strong> info@oroboats.com
              </p>
            </div>
          </div>
          
          <div style="background: #333; color: white; padding: 15px; text-align: center;">
            <p style="margin: 0;">¡Gracias por elegir OroBoats Granada!</p>
            <p style="margin: 5px 0; font-size: 12px;">Experiencias únicas en la costa mediterránea</p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error("❌ Error sending booking customer confirmation:", error)
      return { success: false, error }
    }

    console.log("✅ Booking customer confirmation sent:", emailData?.id)
    return { success: true, id: emailData?.id }
  } catch (error) {
    console.error("❌ Error in sendBookingCustomerConfirmationEmail:", error)
    return { success: false, error }
  }
}
