import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "tu-secreto-super-seguro-cambiar-en-produccion")

export async function middleware(request: NextRequest) {
  console.log("🛡️ Middleware ejecutándose para:", request.nextUrl.pathname)

  // ✅ PERMITIR LOGIN
  if (request.nextUrl.pathname === "/auth/login") {
    return NextResponse.next()
  }

  // ✅ PROTEGER RUTAS ADMIN, DASHBOARD Y APIs SENSIBLES
  const protectedPaths = [
    "/admin",
    "/dashboard",
    "/test-descuentos",
    "/api/liability-waiver", // 🔒 PROTEGER DOCUMENTOS
    "/api/bookings", // 🔒 PROTEGER RESERVAS
    "/api/discount-codes", // 🔒 PROTEGER CÓDIGOS DESCUENTO
    "/api/deposits", // 🔒 PROTEGER FIANZAS
    "/api/analytics", // 🔒 PROTEGER ANALYTICS
  ]

  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (isProtectedPath) {
    const token = request.cookies.get("admin-token")?.value
    console.log("🔍 Token encontrado:", !!token)

    if (!token) {
      console.log("❌ No token, redirigiendo a login")
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      console.log("✅ Token válido:", payload)
      return NextResponse.next()
    } catch (error) {
      console.log("❌ Token inválido:", error)
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/auth/login",
    "/test-descuentos",
    "/api/liability-waiver/:path*", // 🔒 DOCUMENTOS
    "/api/bookings/:path*", // 🔒 RESERVAS
    "/api/discount-codes/:path*", // 🔒 CÓDIGOS
    "/api/deposits/:path*", // 🔒 FIANZAS
    "/api/analytics/:path*", // 🔒 ANALYTICS
  ],
}
