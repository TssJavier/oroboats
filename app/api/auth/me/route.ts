import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // ✅ MANTENER COMPATIBILIDAD: Devolver en el formato original
    return NextResponse.json({
      user: {
        email: user.email,
        isAdmin: user.isAdmin,
        // ✅ NUEVOS CAMPOS OPCIONALES
        id: user.id,
        name: user.name,
        role: user.role || (user.isAdmin ? "admin" : "comercial"),
      },
    })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
