"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Ship,
  Zap,
  Loader2,
  Printer,
  FileText,
  TrendingUp,
  Clock,
  ShoppingBag,
  Calendar,
} from "lucide-react"
import {
  ALL_SEASONS,
  getCurrentSeasonYear,
  getSeasonLabel,
  getSeasonRange,
  listSeasonYears,
} from "@/lib/season"

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

interface FiscalTotals {
  bookings: number
  total: number
  avgSpend: number
  blanco: number
  negro: number
  avgDurationMin: number
}

interface FiscalReport {
  categories: CategoryRow[]
  totals: FiscalTotals
}

const fmtEur = (n: number) =>
  (Number.isFinite(n) ? n : 0).toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const fmtDuration = (min: number) => {
  if (!min || min <= 0) return "—"
  const rounded = Math.round(min)
  const h = Math.floor(rounded / 60)
  const m = rounded % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${m} min`
}

const categoryIcon = (category: string) => {
  if (category.startsWith("jetski")) return Zap
  if (category.startsWith("boat")) return Ship
  return FileText
}

export function AdminFiscalReport() {
  const [report, setReport] = useState<FiscalReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // ✅ Selector de temporada propio del cajón fiscal (por defecto, la temporada actual)
  const [selectedSeason, setSelectedSeason] = useState<string>(String(getCurrentSeasonYear()))
  const seasonYears = listSeasonYears()

  const seasonRange = selectedSeason !== ALL_SEASONS ? getSeasonRange(Number(selectedSeason)) : null
  const seasonLabel = selectedSeason !== ALL_SEASONS ? getSeasonLabel(Number(selectedSeason)) : "Histórico (todas)"

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true)
        setError(null)
        const url = new URL("/api/admin/fiscal-report", window.location.origin)
        if (seasonRange) {
          url.searchParams.set("startDate", seasonRange.startDate)
          url.searchParams.set("endDate", seasonRange.endDate)
        }
        const res = await fetch(url.toString())
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || `Error ${res.status}`)
        }
        const data: FiscalReport = await res.json()
        setReport(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar el informe fiscal")
      } finally {
        setLoading(false)
      }
    }
    fetchReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSeason])

  return (
    <Card className="border-2 border-gray-200 print:border-0 print:shadow-none">
      <CardHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-600" />
                Resumen fiscal por tipo de vehículo
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Blanco = cobrado por Stripe · Negro (B) = efectivo a pie de playa + reservas manuales
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="print:hidden shrink-0"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir / PDF
            </Button>
          </div>

          {/* ✅ Selector de temporada propio (para no tener que scrollear arriba) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 print:hidden">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Temporada</span>
            </div>
            <Select value={selectedSeason} onValueChange={setSelectedSeason}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Selecciona temporada" />
              </SelectTrigger>
              <SelectContent>
                {seasonYears.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {getSeasonLabel(year)}
                  </SelectItem>
                ))}
                <SelectItem value={ALL_SEASONS}>Histórico (todas)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground sm:ml-auto">Del 1 de junio al 31 de mayo del año siguiente</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Etiqueta de temporada visible también al imprimir */}
        <p className="text-sm font-medium text-gray-700 mb-4 hidden print:block">{seasonLabel}</p>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Calculando informe...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            <p className="font-medium">No se pudo cargar el informe</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
          </div>
        ) : !report ? (
          <p className="text-center text-gray-500 py-8">Sin datos.</p>
        ) : (
          <div className="space-y-6">
            {/* Totales destacados */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                  <ShoppingBag className="h-4 w-4" />
                  Reservas
                </div>
                <p className="text-2xl font-bold text-black mt-1">{report.totals.bookings}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                  <TrendingUp className="h-4 w-4" />
                  Facturación total
                </div>
                <p className="text-2xl font-bold text-black mt-1">{fmtEur(report.totals.total)}</p>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="text-xs font-medium text-green-700">Total en Blanco (declarado)</div>
                <p className="text-2xl font-bold text-green-700 mt-1">{fmtEur(report.totals.blanco)}</p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="text-xs font-medium text-amber-700">Total en B (negro)</div>
                <p className="text-2xl font-bold text-amber-700 mt-1">{fmtEur(report.totals.negro)}</p>
              </div>
            </div>

            {/* Tarjetas por tipo de vehículo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {report.categories.map((cat) => {
                const Icon = categoryIcon(cat.category)
                const blancoPct = cat.total > 0 ? (cat.blanco / cat.total) * 100 : 0
                const negroPct = cat.total > 0 ? (cat.negro / cat.total) * 100 : 0
                return (
                  <div
                    key={cat.category}
                    className="rounded-lg border border-gray-200 p-4 flex flex-col gap-3 break-inside-avoid"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gray-100 rounded-full">
                        <Icon className="h-4 w-4 text-gray-700" />
                      </div>
                      <h4 className="font-semibold text-sm text-black leading-tight">{cat.label}</h4>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-bold text-black">{cat.bookings}</span>
                      <span className="text-xs text-gray-500">reservas</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Gasto medio</p>
                        <p className="font-semibold text-black">{fmtEur(cat.avgSpend)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Duración media
                        </p>
                        <p className="font-semibold text-black">{fmtDuration(cat.avgDurationMin)}</p>
                      </div>
                    </div>

                    {/* Reparto blanco / negro */}
                    <div className="space-y-1.5">
                      <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div className="bg-green-500" style={{ width: `${blancoPct}%` }} />
                        <div className="bg-amber-500" style={{ width: `${negroPct}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-green-700 font-medium">Blanco {fmtEur(cat.blanco)}</span>
                        <span className="text-amber-700 font-medium">B {fmtEur(cat.negro)}</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-500">Total</span>
                      <span className="font-bold text-black">{fmtEur(cat.total)}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Tabla resumen (cómoda para el asesor / impresión) */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200 text-gray-600">
                    <th className="text-left py-2 px-2 font-semibold">Tipo</th>
                    <th className="text-right py-2 px-2 font-semibold">Reservas</th>
                    <th className="text-right py-2 px-2 font-semibold">Gasto medio</th>
                    <th className="text-right py-2 px-2 font-semibold">Duración media</th>
                    <th className="text-right py-2 px-2 font-semibold text-green-700">Blanco</th>
                    <th className="text-right py-2 px-2 font-semibold text-amber-700">B (negro)</th>
                    <th className="text-right py-2 px-2 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.categories.map((cat) => (
                    <tr key={cat.category} className="border-b border-gray-100">
                      <td className="py-2 px-2 font-medium">{cat.label}</td>
                      <td className="py-2 px-2 text-right">{cat.bookings}</td>
                      <td className="py-2 px-2 text-right">{fmtEur(cat.avgSpend)}</td>
                      <td className="py-2 px-2 text-right">{fmtDuration(cat.avgDurationMin)}</td>
                      <td className="py-2 px-2 text-right text-green-700">{fmtEur(cat.blanco)}</td>
                      <td className="py-2 px-2 text-right text-amber-700">{fmtEur(cat.negro)}</td>
                      <td className="py-2 px-2 text-right font-semibold">{fmtEur(cat.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 font-bold">
                    <td className="py-2 px-2">TOTAL</td>
                    <td className="py-2 px-2 text-right">{report.totals.bookings}</td>
                    <td className="py-2 px-2 text-right">{fmtEur(report.totals.avgSpend)}</td>
                    <td className="py-2 px-2 text-right">{fmtDuration(report.totals.avgDurationMin)}</td>
                    <td className="py-2 px-2 text-right text-green-700">{fmtEur(report.totals.blanco)}</td>
                    <td className="py-2 px-2 text-right text-amber-700">{fmtEur(report.totals.negro)}</td>
                    <td className="py-2 px-2 text-right">{fmtEur(report.totals.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <p className="text-xs text-gray-400">
              Incluye solo reservas confirmadas y completadas (excluye pruebas y canceladas). El importe es el precio del
              alquiler; las fianzas no se contabilizan. Blanco + B = total de cada reserva. Las reservas pagadas 100%
              online cuentan íntegras como Blanco.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
