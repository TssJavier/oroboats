// ✅ TEMPLATES DE EMAIL PARA OROBOATS

export const contactEmailTemplate = (data: {
  name: string
  email: string
  phone?: string
  message: string
}) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nuevo mensaje de contacto - OroBoats</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #D4AF37 0%, #F4E4BC 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: #000; margin: 0; font-size: 28px; font-weight: bold;">OroBoats</h1>
        <p style="color: #333; margin: 10px 0 0 0; font-size: 16px;">Nuevo mensaje de contacto</p>
      </div>
      
      <div style="background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none;">
        <h2 style="color: #D4AF37; margin-top: 0;">Detalles del mensaje</h2>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Nombre:</strong> ${data.name}</p>
          <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${data.email}</p>
          ${data.phone ? `<p style="margin: 0 0 10px 0;"><strong>Teléfono:</strong> ${data.phone}</p>` : ""}
        </div>
        
        <div style="background: #f0f8ff; padding: 20px; border-radius: 8px; border-left: 4px solid #D4AF37;">
          <h3 style="margin-top: 0; color: #333;">Mensaje:</h3>
          <p style="margin: 0; white-space: pre-wrap;">${data.message}</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
          <p style="color: #666; font-size: 14px; margin: 0;">
            Este mensaje fue enviado desde el formulario de contacto de OroBoats
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

export const bookingConfirmationTemplate = (data: {
  bookingId: number
  customerName: string
  vehicleName: string
  bookingDate: string
  startTime: string
  endTime: string
  totalPrice: number
  securityDeposit?: number
  discountAmount?: number
  originalPrice?: number
  discountCode?: string
}) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmación de reserva - OroBoats</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #D4AF37 0%, #F4E4BC 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: #000; margin: 0; font-size: 28px; font-weight: bold;">OroBoats</h1>
        <p style="color: #333; margin: 10px 0 0 0; font-size: 16px;">¡Reserva confirmada!</p>
      </div>
      
      <div style="background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none;">
        <h2 style="color: #D4AF37; margin-top: 0;">Hola ${data.customerName},</h2>
        <p>¡Tu reserva ha sido confirmada exitosamente! Aquí tienes todos los detalles:</p>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Detalles de la reserva</h3>
          <p style="margin: 5px 0;"><strong>ID de reserva:</strong> #${data.bookingId}</p>
          <p style="margin: 5px 0;"><strong>Vehículo:</strong> ${data.vehicleName}</p>
          <p style="margin: 5px 0;"><strong>Fecha:</strong> ${data.bookingDate}</p>
          <p style="margin: 5px 0;"><strong>Horario:</strong> ${data.startTime} - ${data.endTime}</p>
        </div>
        
        <div style="background: #f0f8ff; padding: 20px; border-radius: 8px; border-left: 4px solid #D4AF37;">
          <h3 style="margin-top: 0; color: #333;">Resumen de pago</h3>
          ${
            data.originalPrice && data.discountAmount
              ? `
            <p style="margin: 5px 0;">Precio original: €${data.originalPrice}</p>
            <p style="margin: 5px 0; color: #28a745;">Descuento (${data.discountCode}): -€${data.discountAmount}</p>
            <hr style="margin: 10px 0;">
          `
              : ""
          }
          <p style="margin: 5px 0;"><strong>Precio del alquiler: €${data.totalPrice}</strong></p>
          ${
            data.securityDeposit
              ? `
            <p style="margin: 5px 0; color: #007bff;">Fianza (reembolsable): €${data.securityDeposit}</p>
            <hr style="margin: 10px 0;">
            <p style="margin: 5px 0; font-size: 18px;"><strong>Total pagado: €${data.totalPrice + data.securityDeposit}</strong></p>
          `
              : ""
          }
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border: 1px solid #ffeaa7; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #856404;">Información importante:</h4>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Llega 15 minutos antes de tu horario reservado</li>
            <li>Trae tu DNI o documento de identidad</li>
            <li>Se requiere licencia de navegación para algunos vehículos</li>
            ${data.securityDeposit ? "<li>La fianza se devolverá al finalizar la reserva si no hay daños</li>" : ""}
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #666;">¿Tienes alguna pregunta?</p>
          <p style="margin: 10px 0;">
            <strong>Teléfono:</strong> +34 655 52 79 88<br>
            <strong>WhatsApp:</strong> +34 643 44 23 64<br>
            <strong>Email:</strong> info@oroboats.com
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
          <p style="color: #666; font-size: 14px; margin: 0;">
            ¡Gracias por elegir OroBoats para tu aventura náutica!
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

export const adminNotificationTemplate = (data: {
  bookingId: number
  customerName: string
  customerEmail: string
  customerPhone: string
  vehicleName: string
  bookingDate: string
  startTime: string
  endTime: string
  totalPrice: number
  securityDeposit?: number
  discountAmount?: number
  originalPrice?: number
  discountCode?: string
}) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nueva reserva - OroBoats Admin</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #D4AF37 0%, #F4E4BC 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: #000; margin: 0; font-size: 28px; font-weight: bold;">OroBoats Admin</h1>
        <p style="color: #333; margin: 10px 0 0 0; font-size: 16px;">Nueva reserva recibida</p>
      </div>
      
      <div style="background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none;">
        <h2 style="color: #D4AF37; margin-top: 0;">Nueva reserva #${data.bookingId}</h2>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Datos del cliente</h3>
          <p style="margin: 5px 0;"><strong>Nombre:</strong> ${data.customerName}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${data.customerEmail}</p>
          <p style="margin: 5px 0;"><strong>Teléfono:</strong> ${data.customerPhone}</p>
        </div>
        
        <div style="background: #f0f8ff; padding: 20px; border-radius: 8px; border-left: 4px solid #D4AF37;">
          <h3 style="margin-top: 0; color: #333;">Detalles de la reserva</h3>
          <p style="margin: 5px 0;"><strong>Vehículo:</strong> ${data.vehicleName}</p>
          <p style="margin: 5px 0;"><strong>Fecha:</strong> ${data.bookingDate}</p>
          <p style="margin: 5px 0;"><strong>Horario:</strong> ${data.startTime} - ${data.endTime}</p>
        </div>
        
        <div style="background: #d4edda; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745;">
          <h3 style="margin-top: 0; color: #333;">Resumen financiero</h3>
          ${
            data.originalPrice && data.discountAmount
              ? `
            <p style="margin: 5px 0;">Precio original: €${data.originalPrice}</p>
            <p style="margin: 5px 0; color: #28a745;">Descuento aplicado (${data.discountCode}): -€${data.discountAmount}</p>
            <hr style="margin: 10px 0;">
          `
              : ""
          }
          <p style="margin: 5px 0;"><strong>Precio del alquiler: €${data.totalPrice}</strong></p>
          ${
            data.securityDeposit
              ? `
            <p style="margin: 5px 0;">Fianza cobrada: €${data.securityDeposit}</p>
            <hr style="margin: 10px 0;">
            <p style="margin: 5px 0; font-size: 18px;"><strong>Total cobrado: €${data.totalPrice + data.securityDeposit}</strong></p>
          `
              : ""
          }
        </div>
        
        <div style="text-align: center; margin: 30px 0; padding: 20px; background: #fff3cd; border-radius: 8px;">
          <p style="margin: 0; color: #856404;">
            <strong>Acción requerida:</strong> Preparar el vehículo para la fecha y hora indicada
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

// ✅ FUNCIONES WRAPPER CON LOS NOMBRES ESPERADOS POR LAS IMPORTACIONES

export const renderContactNotification = (data: {
  name: string
  email: string
  phone?: string
  message: string
}) => {
  return contactEmailTemplate(data)
}

export const renderContactConfirmation = (data: {
  name: string
  email: string
  phone?: string
  message: string
}) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mensaje recibido - OroBoats</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #D4AF37 0%, #F4E4BC 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: #000; margin: 0; font-size: 28px; font-weight: bold;">OroBoats</h1>
        <p style="color: #333; margin: 10px 0 0 0; font-size: 16px;">¡Mensaje recibido!</p>
      </div>
      
      <div style="background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none;">
        <h2 style="color: #D4AF37; margin-top: 0;">Hola ${data.name},</h2>
        <p>¡Gracias por contactar con nosotros! Hemos recibido tu mensaje y te responderemos lo antes posible.</p>
        
        <div style="background: #f0f8ff; padding: 20px; border-radius: 8px; border-left: 4px solid #D4AF37; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Tu mensaje:</h3>
          <p style="margin: 0; white-space: pre-wrap;">${data.message}</p>
        </div>
        
        <div style="background: #d4edda; padding: 15px; border-radius: 8px; border: 1px solid #c3e6cb; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #155724;">Tiempo de respuesta:</h4>
          <p style="margin: 0; color: #155724;">Normalmente respondemos en menos de 24 horas. Si tu consulta es urgente, puedes llamarnos directamente.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #666;">¿Necesitas una respuesta inmediata?</p>
          <p style="margin: 10px 0;">
            <strong>Teléfono:</strong> +34 655 52 79 88<br>
            <strong>WhatsApp:</strong> +34 643 44 23 64<br>
            <strong>Email:</strong> info@oroboats.com
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
          <p style="color: #666; font-size: 14px; margin: 0;">
            ¡Gracias por elegir OroBoats!
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

export const renderAdminBookingNotification = (data: {
  bookingId: number
  customerName: string
  customerEmail: string
  customerPhone: string
  vehicleName: string
  bookingDate: string
  startTime: string
  endTime: string
  totalPrice: number
  securityDeposit?: number
  discountAmount?: number
  originalPrice?: number
  discountCode?: string
}) => {
  return adminNotificationTemplate(data)
}

export const renderCustomerBookingConfirmation = (data: {
  bookingId: number
  customerName: string
  vehicleName: string
  bookingDate: string
  startTime: string
  endTime: string
  totalPrice: number
  securityDeposit?: number
  discountAmount?: number
  originalPrice?: number
  discountCode?: string
}) => {
  return bookingConfirmationTemplate(data)
}
