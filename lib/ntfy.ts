// Notificaciones push al equipo (dueños de OroBoats) vía ntfy cuando entra una reserva.
// Docs: https://docs.ntfy.sh/publish/
//
// Config por variables de entorno (en Vercel):
//   NTFY_TOPIC   -> nombre del canal, ej "oroboats-reservas-x7f3k9q2" (obligatorio para que envíe)
//   NTFY_SERVER  -> opcional, por defecto https://ntfy.sh
//
// Si NTFY_TOPIC no está definido, la función no hace nada (no rompe la reserva).

export interface BookingPushData {
  bookingId: number | string
  vehicleName?: string | null
  beachLocationName?: string | null
  bookingDate?: string | null
  timeRange?: string | null
  customerName?: string | null
  customerPhone?: string | null
  totalPrice?: number | string | null
  paymentLabel?: string | null
}

export async function sendBookingPushNotification(b: BookingPushData): Promise<void> {
  const topic = process.env.NTFY_TOPIC
  if (!topic) {
    console.warn("⚠️ NTFY_TOPIC no configurado; se omite la notificación push de la reserva")
    return
  }

  const server = (process.env.NTFY_SERVER || "https://ntfy.sh").replace(/\/+$/, "")

  // El cuerpo va en UTF-8 (admite tildes y emojis sin problema).
  const lines = [
    b.vehicleName || "Vehículo",
    b.beachLocationName ? `📍 ${b.beachLocationName}` : null,
    [b.bookingDate, b.timeRange].filter(Boolean).join("  "),
    b.customerName ? `👤 ${b.customerName}${b.customerPhone ? " · " + b.customerPhone : ""}` : null,
    b.totalPrice != null ? `💶 ${b.totalPrice}€${b.paymentLabel ? " · " + b.paymentLabel : ""}` : null,
  ].filter((l) => l && String(l).trim().length > 0)

  const body = "🚤 " + lines.join("\n")

  try {
    // OJO: las cabeceras de ntfy (Title) deben ser ASCII. El nº de reserva lo es.
    const res = await fetch(`${server}/${encodeURIComponent(topic)}`, {
      method: "POST",
      headers: {
        Title: `Nueva reserva #${b.bookingId}`,
        Priority: "high",
        Tags: "ship",
      },
      body,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      console.error(`❌ ntfy respondió ${res.status}: ${text}`)
    } else {
      console.log("📲 Notificación push (ntfy) enviada para la reserva", b.bookingId)
    }
  } catch (error) {
    // Nunca debe romper el flujo de la reserva
    console.error("❌ Error enviando la notificación push (ntfy):", error)
  }
}
