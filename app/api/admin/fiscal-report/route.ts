import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { getCurrentUser } from "@/lib/auth"

// Sin caché: siempre datos frescos
export const revalidate = 0

// Las 4 categorías fiscales que pide el asesor, en orden de presentación.
const CATEGORY_ORDER = [
  "boat_with_license",
  "boat_no_license",
  "jetski_with_license",
  "jetski_no_license",
] as const

const CATEGORY_LABELS: Record<string, string> = {
  boat_with_license: "Barco con licencia",
  boat_no_license: "Barco sin licencia",
  jetski_with_license: "Moto con licencia",
  jetski_no_license: "Moto sin licencia",
}

interface CategoryRow {
  category: string
  label: string
  bookings: number
  total: number
  avgSpend: number
  blanco: number
  negro: number
  avgDurationMin: number
}

function mapRow(category: string, r: any | undefined): CategoryRow {
  return {
    category,
    label: CATEGORY_LABELS[category] || "Otros / sin categorizar",
    bookings: r ? Number(r.bookings) : 0,
    total: r ? Number(r.total) : 0,
    avgSpend: r ? Number(r.avg_spend) : 0,
    blanco: r ? Number(r.blanco) : 0,
    negro: r ? Number(r.negro) : 0,
    avgDurationMin: r && r.avg_duration_min != null ? Number(r.avg_duration_min) : 0,
  }
}

export async function GET(request: NextRequest) {
  try {
    // ✅ Solo admins: estos datos (reparto blanco/negro) son sensibles.
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    if (!(user.isAdmin || user.role === "admin")) {
      return NextResponse.json({ error: "Acceso restringido a administradores" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Filtro de temporada (rango de fechas) opcional
    let dateCond = sql``
    if (startDate && endDate) {
      dateCond = sql` AND b.booking_date BETWEEN ${startDate} AND ${endDate}`
    } else if (startDate) {
      dateCond = sql` AND b.booking_date >= ${startDate}`
    } else if (endDate) {
      dateCond = sql` AND b.booking_date <= ${endDate}`
    }

    // Criterio BLANCO / NEGRO (confirmado con el cliente):
    //   - BLANCO (declarado) = solo lo cobrado por Stripe = en reservas online, total - pendiente en efectivo.
    //   - NEGRO (B)          = todo lo demás = pendiente en efectivo de las online + el total de TODAS las manuales.
    //   Por construcción, blanco + negro = total_price de cada reserva.
    //
    // Duración media: a partir de start_time/end_time (presentes en online y manuales).
    // Se usa GROUP BY ROLLUP para obtener también la fila de totales (category = NULL) en exacta.
    const rows = (await db.execute(sql`
      WITH base AS (
        SELECT
          COALESCE(
            v.category,
            CASE
              WHEN b.vehicle_type = 'boat' THEN 'boat_uncategorized'
              WHEN b.vehicle_type = 'jetski' THEN 'jetski_uncategorized'
              ELSE 'uncategorized'
            END
          ) AS cat,
          b.total_price::numeric AS total_price,
          (b.is_manual_booking = true) AS is_manual,
          COALESCE(b.amount_pending::numeric, 0) AS amount_pending,
          CASE
            WHEN b.start_time IS NOT NULL AND b.end_time IS NOT NULL
                 AND b.end_time::time > b.start_time::time
            THEN EXTRACT(EPOCH FROM (b.end_time::time - b.start_time::time)) / 60
            ELSE NULL
          END AS dur_min
        FROM bookings b
        LEFT JOIN vehicles v ON b.vehicle_id = v.id
        WHERE (b.is_test_booking IS NULL OR b.is_test_booking = false)
          AND (b.payment_status IS NULL OR b.payment_status != 'hold')
          AND b.status IN ('confirmed', 'completed')
          ${dateCond}
      )
      SELECT
        cat AS category,
        COUNT(*)::int AS bookings,
        COALESCE(SUM(total_price), 0) AS total,
        COALESCE(AVG(total_price), 0) AS avg_spend,
        COALESCE(SUM(CASE WHEN is_manual THEN 0 ELSE total_price - amount_pending END), 0) AS blanco,
        COALESCE(SUM(CASE WHEN is_manual THEN total_price ELSE amount_pending END), 0) AS negro,
        AVG(dur_min) AS avg_duration_min
      FROM base
      GROUP BY ROLLUP(cat)
    `)) as any[]

    // Separar la fila de totales (cat = NULL del ROLLUP) del resto
    const byCat: Record<string, any> = {}
    let totalsRow: any = null
    for (const r of rows) {
      if (r.category === null || r.category === undefined) {
        totalsRow = r
      } else {
        byCat[r.category] = r
      }
    }

    // Siempre devolvemos las 4 categorías (aunque tengan 0) para que el asesor las vea todas
    const categories: CategoryRow[] = CATEGORY_ORDER.map((cat) => mapRow(cat, byCat[cat]))

    // Cualquier reserva sin categoría reconocida (vehículo borrado, etc.) se agrupa aparte
    const extraKeys = Object.keys(byCat).filter((k) => !CATEGORY_ORDER.includes(k as any))
    if (extraKeys.length > 0) {
      const extraBookings = extraKeys.reduce((s, k) => s + Number(byCat[k].bookings), 0)
      if (extraBookings > 0) {
        const total = extraKeys.reduce((s, k) => s + Number(byCat[k].total), 0)
        categories.push({
          category: "uncategorized",
          label: "Otros / sin categorizar",
          bookings: extraBookings,
          total,
          avgSpend: extraBookings > 0 ? total / extraBookings : 0,
          blanco: extraKeys.reduce((s, k) => s + Number(byCat[k].blanco), 0),
          negro: extraKeys.reduce((s, k) => s + Number(byCat[k].negro), 0),
          avgDurationMin: 0,
        })
      }
    }

    const totals = {
      bookings: totalsRow ? Number(totalsRow.bookings) : 0,
      total: totalsRow ? Number(totalsRow.total) : 0,
      avgSpend: totalsRow ? Number(totalsRow.avg_spend) : 0,
      blanco: totalsRow ? Number(totalsRow.blanco) : 0,
      negro: totalsRow ? Number(totalsRow.negro) : 0,
      avgDurationMin: totalsRow && totalsRow.avg_duration_min != null ? Number(totalsRow.avg_duration_min) : 0,
    }

    return NextResponse.json({ categories, totals })
  } catch (error) {
    console.error("❌ Error generando informe fiscal:", error)
    return NextResponse.json(
      { error: "Error al generar el informe fiscal", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
