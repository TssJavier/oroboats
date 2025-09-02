"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

type Language = "es" | "en"

interface User {
  id: string
  name: string
  email: string
}

interface AppContextType {
  language: Language
  setLanguage: (lang: Language) => void
  user: User | null
  setUser: (user: User | null) => void
  settings: Record<string, string>
  setSettings: (settings: Record<string, string>) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useApp must be used within Providers")
  }
  return context
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("es")
  const [user, setUser] = useState<User | null>(null)
  const [settings, setSettings] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data: Array<{ key: string; value: string }>) => {
        const map: Record<string, string> = {}
        data.forEach((s) => {
          map[s.key] = s.value
          if (s.key === "contact_info") {
            try {
              const parsed = JSON.parse(s.value)
              Object.entries(parsed).forEach(([k, v]) => {
                map[`contact_${k}`] = String(v)
              })
            } catch {
              /* ignore */
            }
          }
        })
        setSettings(map)
        document.documentElement.style.setProperty(
          "--brand-primary",
          map.primary_color || "#000000",
        )
        document.documentElement.style.setProperty(
          "--brand-secondary",
          map.secondary_color || "#FFD700",
        )
        document.documentElement.style.setProperty(
          "--brand-background",
          map.background_color || "#FFFFFF",
        )
        document.documentElement.style.setProperty(
          "--brand-loading-background",
          map.loading_background_color || map.background_color || "#FFFFFF",
        )
        document.body.style.backgroundColor = map.background_color || "#FFFFFF"

      })
      .catch((err) => console.error("Error fetching settings:", err))
  }, [])

  return (
    <AppContext.Provider value={{ language, setLanguage, user, setUser, settings, setSettings }}>
      {children}
    </AppContext.Provider>
  )
}
