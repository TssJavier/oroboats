"use client"

/**
 * Utilidades simples para gestionar cookies en el cliente
 */
export const cookieUtils = {
  // Establecer una cookie
  set: (name: string, value: string, days = 365) => {
    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`
  },

  // Obtener una cookie
  get: (name: string): string | null => {
    const nameEQ = name + "="
    const ca = document.cookie.split(";")
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i]
      while (c.charAt(0) === " ") c = c.substring(1, c.length)
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
    }
    return null
  },

  // Eliminar una cookie
  delete: (name: string) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
  },

  // Verificar si una cookie existe
  exists: (name: string): boolean => {
    return cookieUtils.get(name) !== null
  },
}

// Funciones de conveniencia (compatibilidad con código anterior)
export function setCookie(name: string, value: string, days = 30): void {
  cookieUtils.set(name, value, days)
}

export function getCookie(name: string): string | null {
  return cookieUtils.get(name)
}

export function deleteCookie(name: string): void {
  cookieUtils.delete(name)
}

export function hasCookie(name: string): boolean {
  return cookieUtils.exists(name)
}
