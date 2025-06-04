"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export function SimpleTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // ✅ DETERMINAR TIPO DE PÁGINA
    let pageType = "other"

    if (pathname === "/") {
      pageType = "home"
    } else if (pathname.startsWith("/reservar")) {
      pageType = "reservar"
    }

    // ✅ SOLO TRACKEAR HOME Y RESERVAR
    if (pageType === "home" || pageType === "reservar") {
      // ✅ ENVIAR DATOS AL BACKEND
      fetch("/api/analytics/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pageType,
          pageUrl: pathname,
        }),
      }).catch((error) => {
        // ✅ SILENCIOSO - NO AFECTAR LA UX SI FALLA
        console.log("Analytics tracking failed:", error)
      })
    }
  }, [pathname])

  // ✅ COMPONENTE INVISIBLE
  return null
}
