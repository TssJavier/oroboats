import { type NextRequest, NextResponse } from "next/server"
import { verifyAdminCredentials, createToken, getUserInfo } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // 🔍 DEBUG - MANTENER TUS LOGS
    console.log("🔐 Login attempt:", { email, password })
    console.log("🔑 Expected credentials:", {
      adminEmail: process.env.ADMIN_EMAIL,
      adminPassword: process.env.ADMIN_PASSWORD,
    })

    console.log("🔐 Login attempt:", { email, providedPassword: password })

    // ✅ VERIFICAR CREDENCIALES (funciona con env vars Y base de datos)
    const isValid = await verifyAdminCredentials(email, password)

    if (!isValid) {
      console.log("❌ Invalid credentials")
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    // ✅ OBTENER INFORMACIÓN COMPLETA DEL USUARIO
    const userInfo = await getUserInfo(email)

    if (!userInfo) {
      return NextResponse.json({ error: "Error al obtener información del usuario" }, { status: 500 })
    }

    // ✅ CREAR TOKEN USANDO TU FUNCIÓN MEJORADA
    const token = await createToken(userInfo)

    // ✅ CREAR RESPUESTA CON COOKIE (MANTENER TU ESTRUCTURA)
    const response = NextResponse.json({
      success: true,
      message: "Login exitoso",
      user: {
        email: userInfo.email,
        role: userInfo.role || "admin",
        isAdmin: userInfo.isAdmin,
        id: userInfo.id,
        name: userInfo.name,
      },
    })

    // ✅ ESTABLECER COOKIE SEGURA (MANTENER TU CONFIGURACIÓN)
    response.cookies.set("admin-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 horas
      path: "/",
    })

    return response
  } catch (error) {
    console.error("❌ Login error:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
