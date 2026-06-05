// ✅ LÓGICA DE TEMPORADAS PARA OROBOATS
// Una temporada va del 1 de junio de un año al 31 de mayo del año siguiente.
// Ej: la "Temporada 2026" abarca del 2026-06-01 al 2027-05-31.
// La temporada se identifica por su AÑO DE INICIO (el año del 1 de junio).
//
// Este módulo es isomórfico (sin dependencias de servidor) para poder
// usarse tanto en componentes de cliente como en rutas de API.

// Mes (0-based) en el que arranca la temporada: 5 = junio
const SEASON_START_MONTH = 5

/** Año de inicio de la temporada a la que pertenece una fecha dada. */
export function getSeasonYear(date: Date = new Date()): number {
  const month = date.getMonth() // 0-based
  const year = date.getFullYear()
  // Si estamos en junio o después, la temporada empezó este año.
  // Si estamos antes de junio, pertenecemos a la temporada que empezó el año anterior.
  return month >= SEASON_START_MONTH ? year : year - 1
}

/** Año de inicio de la temporada actual. */
export function getCurrentSeasonYear(): number {
  return getSeasonYear(new Date())
}

/** Rango de fechas (inclusive) de una temporada, en formato 'YYYY-MM-DD'. */
export function getSeasonRange(seasonYear: number): { startDate: string; endDate: string } {
  return {
    startDate: `${seasonYear}-06-01`,
    endDate: `${seasonYear + 1}-05-31`,
  }
}

/** Etiqueta legible de la temporada, ej: "Temporada 2026/27". */
export function getSeasonLabel(seasonYear: number): string {
  const endShort = String((seasonYear + 1) % 100).padStart(2, "0")
  return `Temporada ${seasonYear}/${endShort}`
}

/**
 * Lista de años de inicio de temporada para mostrar en el selector,
 * en orden descendente. Va desde la temporada actual hacia atrás.
 */
export function listSeasonYears(opts?: { from?: number; current?: number }): number[] {
  const current = opts?.current ?? getCurrentSeasonYear()
  const from = opts?.from ?? 2024 // primera temporada que se ofrece en el selector
  const start = Math.min(from, current)
  const years: number[] = []
  for (let y = current; y >= start; y--) {
    years.push(y)
  }
  return years
}

// Valor especial del selector para "todas las temporadas" (histórico).
export const ALL_SEASONS = "all"
