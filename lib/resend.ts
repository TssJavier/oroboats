import { Resend } from "resend"

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not defined")
}

export const resend = new Resend(process.env.RESEND_API_KEY)

// Email de administrador para recibir notificaciones
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL_RESEND || "info@feribu.com"
export const FROM_EMAIL = "noreply@oroboats.com" // Cambiar por tu dominio verificado
