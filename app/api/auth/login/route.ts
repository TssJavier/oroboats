import { type NextRequest, NextResponse } from "next/server"
import { SignJWT } from "jose"

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "oroboats-secret-key-2024")

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // 🔍 DEBUG - AÑADIR ESTOS LOGS
    console.log("🔐 Login attempt:", { email, password })
    console.log("🔑 Expected credentials:", {
      adminEmail: process.env.ADMIN_EMAIL,
      adminPassword: process.env.ADMIN_PASSWORD,
    })

    // ✅ CREDENCIALES DEL ADMIN (desde .env.local)
    const adminEmail = process.env.ADMIN_EMAIL 
    const adminPassword = process.env.ADMIN_PASSWORD 

    console.log("🔐 Login attempt:", { email, providedPassword: password })
    console.log("🔑 Expected:", { adminEmail, adminPassword })

    // ✅ VERIFICAR CREDENCIALES
    if (email === adminEmail && password === adminPassword) {
      // ✅ CREAR JWT TOKEN
      const token = await new SignJWT({
        email: adminEmail,
        role: "admin",
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 horas
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(secret)

      // ✅ CREAR RESPUESTA CON COOKIE
      const response = NextResponse.json({
        success: true,
        message: "Login exitoso",
        user: { email: adminEmail, role: "admin" },
      })

      // ✅ ESTABLECER COOKIE SEGURA
      response.cookies.set("admin-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60, // 24 horas
        path: "/",
      })

      return response
    } else {
      console.log("❌ Invalid credentials")
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }
  } catch (error) {
    console.error("❌ Login error:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
