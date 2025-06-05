import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

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

// ✅ EMAIL AL ADMIN CUANDO HAY NUEVA RESERVA
export async function sendAdminNotification(booking: BookingEmailData) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "info@oroboats.com"

    const { data, error } = await resend.emails.send({
      from: "OroBoats <noreply@oroboats.com>",
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
              <p><strong>Fianza retenida:</strong> €${booking.securityDeposit}</p>
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
      console.error("Error sending admin notification:", error)
      return false
    }

    console.log("✅ Admin notification sent:", data?.id)
    return true
  } catch (error) {
    console.error("Error sending admin notification:", error)
    return false
  }
}

// ✅ EMAIL DE CONFIRMACIÓN AL CLIENTE
export async function sendCustomerConfirmation(booking: BookingEmailData) {
  try {
    const { data, error } = await resend.emails.send({
      from: "OroBoats Granada <noreply@oroboats.com>",
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
                <strong>Fianza retenida:</strong> €${booking.securityDeposit}<br>
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
      console.error("Error sending customer confirmation:", error)
      return false
    }

    console.log("✅ Customer confirmation sent:", data?.id)
    return true
  } catch (error) {
    console.error("Error sending customer confirmation:", error)
    return false
  }
}
