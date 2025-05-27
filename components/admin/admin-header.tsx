"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, User, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

export function AdminHeader() {
  const [loggingOut, setLoggingOut] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setLoggingOut(true)

    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/auth/login")
      router.refresh()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-6">Panel de Administración</h1>
        <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto">
          Gestiona productos, reservas y configuración de OroBoats
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="border-gray-300">
            <User className="h-4 w-4 mr-2" />
            Admin
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-white border-gray-200">
          <DropdownMenuItem disabled>
            <User className="h-4 w-4 mr-2" />
            admin@oroboats.com
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} disabled={loggingOut} className="text-red-600 hover:bg-red-50">
            {loggingOut ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogOut className="h-4 w-4 mr-2" />}
            Cerrar Sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
