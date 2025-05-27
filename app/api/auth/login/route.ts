import { type NextRequest, NextResponse } from "next/server"
import { verifyAdminCredentials, createToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 })
    }

    // Verificar credenciales
    const isValid = await verifyAdminCredentials(email, password)

    if (!isValid) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    // Crear token
    const token = await createToken({ email, isAdmin: true })

    // Crear respuesta
    const response = NextResponse.json({ success: true, message: "Login exitoso" })

    // Establecer cookie
    response.cookies.set("admin-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 horas
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
