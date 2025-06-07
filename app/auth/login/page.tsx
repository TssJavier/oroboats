"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Ship, Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ INCLUIR COOKIES
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      console.log("🔐 Login response:", { status: response.status, data })
      console.log("🍪 Document cookies:", document.cookie)

      if (response.ok) {
        console.log("✅ Login exitoso, redirigiendo...")
        // Cambiar la redirección
        setTimeout(() => {
          window.location.href = "/admin"
        }, 100)
      } else {
        setError(data.error || "Error al iniciar sesión")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Ship className="h-12 w-12 text-yellow-500" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-black">
            Oro<span className="text-yellow-500">Boats</span>
          </h2>
          <p className="mt-2 text-sm text-gray-600">Panel de Administración</p>
        </div>

        <Card className="bg-white border border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-black text-center">Iniciar Sesión</CardTitle>
            <CardDescription className="text-center">Accede al panel de administración</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                    <span className="text-red-700 text-sm">{error}</span>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="info@oroboats.com"
                  required
                  disabled={loading}
                  className="bg-gray-50 border-gray-200"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    className="bg-gray-50 border-gray-200 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white hover:bg-yellow-500 hover:text-black transition-all duration-300 font-medium py-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
