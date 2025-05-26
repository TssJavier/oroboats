"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"

type Language = "es" | "en"

interface AppContextType {
  language: Language
  setLanguage: (lang: Language) => void
  user: any
  setUser: (user: any) => void
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
  const [user, setUser] = useState(null)

  return <AppContext.Provider value={{ language, setLanguage, user, setUser }}>{children}</AppContext.Provider>
}
