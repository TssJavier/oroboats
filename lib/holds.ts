// ✅ LÓGICA DE BLOQUEOS COMERCIALES ("holds")
//
// Un "bloqueo" es una reserva en espera creada por un comercial para apartar
// un hueco (vehículo + día + hora) y que nadie más lo coja, mientras le pasa
// al cliente una URL para que pague online.
//
// Diseño SIN migración de BD: el bloqueo se guarda en la tabla `bookings`
// reutilizando columnas existentes:
//   - status         = 'pending'   -> ocupa el hueco (la disponibilidad ya
//                                      cuenta pending como ocupado)
//   - payment_status = 'hold'      -> marca que es un bloqueo (no una reserva real)
//   - sales_person   = email del comercial que lo creó (para listar "sus" bloqueos)
//   - created_at                   -> base para la caducidad (8h)
//
// La URL de pago lleva un token firmado (HMAC) derivado del id del bloqueo,
// así no hace falta una columna extra y no es falsificable.

import crypto from "crypto"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

const JWT_SECRET = process.env.JWT_SECRET || "tu-secreto-super-seguro-cambiar-en-produccion"

// Marcador de pago para distinguir un bloqueo de una reserva real
export const HOLD_PAYMENT_STATUS = "hold"

// Horas que dura un bloqueo antes de liberarse solo
export const HOLD_EXPIRY_HOURS = 8

/** Genera el token firmado para la URL de pago a partir del id del bloqueo. */
export function generateHoldToken(holdId: number): string {
  const sig = crypto.createHmac("sha256", JWT_SECRET).update(`hold:${holdId}`).digest("hex").slice(0, 24)
  return `${holdId}.${sig}`
}

/** Verifica un token de bloqueo y devuelve su id, o null si no es válido. */
export function verifyHoldToken(token: string | null | undefined): number | null {
  if (!token || typeof token !== "string" || !token.includes(".")) return null
  const [idPart, sig] = token.split(".")
  const holdId = Number.parseInt(idPart, 10)
  if (!holdId || Number.isNaN(holdId)) return null
  const expected = crypto.createHmac("sha256", JWT_SECRET).update(`hold:${holdId}`).digest("hex").slice(0, 24)
  // Comparación en tiempo constante
  if (sig.length !== expected.length) return null
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  } catch {
    return null
  }
  return holdId
}

/**
 * Libera (cancela) los bloqueos caducados: más de HOLD_EXPIRY_HOURS desde su
 * creación. Opcionalmente acotado a un vehículo y/o fecha para hacerlo barato.
 * Es idempotente y seguro de llamar en cualquier lectura de disponibilidad.
 */
export async function releaseExpiredHolds(vehicleId?: number, date?: string): Promise<void> {
  try {
    const conditions = [
      sql`payment_status = ${HOLD_PAYMENT_STATUS}`,
      sql`status = 'pending'`,
      sql`created_at < (now() - ${sql.raw(`interval '${HOLD_EXPIRY_HOURS} hours'`)})`,
    ]
    if (vehicleId) conditions.push(sql`vehicle_id = ${vehicleId}`)
    if (date) conditions.push(sql`booking_date = ${date}`)

    await db.execute(sql`
      UPDATE bookings
      SET status = 'cancelled', updated_at = now()
      WHERE ${sql.join(conditions, sql` AND `)}
    `)
  } catch (err) {
    // Nunca debe romper el flujo de disponibilidad/reservas
    console.error("⚠️ releaseExpiredHolds error:", err)
  }
}

/** Cancela un bloqueo concreto (al pagarse el cliente o al desbloquear). */
export async function releaseHoldById(holdId: number): Promise<void> {
  await db.execute(sql`
    UPDATE bookings
    SET status = 'cancelled', updated_at = now()
    WHERE id = ${holdId} AND payment_status = ${HOLD_PAYMENT_STATUS}
  `)
}
