"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cookieUtils } from "@/lib/cookies"
import { Cookie, X } from "lucide-react"

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // No mostrar cookies en el embed (iframe)
    if (pathname?.startsWith("/embed")) return

    const hasConsent = cookieUtils.exists("cookie-consent")
    if (!hasConsent) {
      const timer = setTimeout(() => setShowBanner(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [pathname])

  const acceptCookies = () => {
    cookieUtils.set("cookie-consent", "accepted", 365)
    setShowBanner(false)
  }

  const rejectCookies = () => {
    cookieUtils.set("cookie-consent", "rejected", 365)
    setShowBanner(false)
  }

  const closeBanner = () => {
    // Si cierra sin elegir, asumimos que acepta solo las esenciales
    cookieUtils.set("cookie-consent", "essential-only", 365)
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-500">
      <Card className="mx-auto max-w-5xl bg-white border-2 border-gray-200 shadow-xl">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Cookie className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />

            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">🍪 Utilizamos cookies</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeBanner}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-sm text-gray-700 mb-3">
                Usamos cookies esenciales para el funcionamiento del sitio (como tu sesión de administrador) y cookies
                de análisis para mejorar tu experiencia. Puedes aceptar todas o solo las esenciales.
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={rejectCookies}
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                  Solo esenciales
                </Button>
                <Button size="sm" onClick={acceptCookies} className="bg-amber-600 hover:bg-amber-700 text-white">
                  Aceptar todas
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
