import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "oroboats-secret-key-2024")

export async function middleware(request: NextRequest) {
  console.log("🛡️ Middleware ejecutándose para:", request.nextUrl.pathname)

  // ✅ PERMITIR LOGIN
  if (request.nextUrl.pathname === "/auth/login") {
    return NextResponse.next()
  }

  // ✅ RUTAS PÚBLICAS PARA CLIENTES (sin autenticación)
  const publicApiRoutes = [
    "/api/liability-waiver",
    "/api/create-payment-intent",
    "/api/confirm-booking",
    "/api/discount/validate", // ✅ CORREGIDO: Validar códigos es público
  ]

  const isPublicApi = publicApiRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  if (isPublicApi) {
    console.log("✅ Ruta pública, permitiendo acceso:", request.nextUrl.pathname)
    return NextResponse.next()
  }

  // ✅ MANEJO ESPECIAL PARA /api/bookings
  if (request.nextUrl.pathname.startsWith("/api/bookings")) {
    if (request.method === "POST") {
      console.log("✅ POST a /api/bookings permitido (crear reserva)")
      return NextResponse.next()
    }
    // GET, PUT, DELETE requieren autenticación (gestión admin)
    console.log("🔒 Método", request.method, "en /api/bookings requiere autenticación")
  }

  // ✅ PROTEGER RUTAS ADMIN, DASHBOARD Y APIs SENSIBLES
  const protectedPaths = [
    "/admin",
    "/dashboard",
    "/test-descuentos",
    "/api/discount-codes", // 🔒 GESTIÓN DE CÓDIGOS (admin only)
    "/api/deposits", // 🔒 PROTEGER FIANZAS
    "/api/analytics", // 🔒 PROTEGER ANALYTICS
    "/api/users", // 🔒 PROTEGER GESTIÓN DE USUARIOS
  ]

  // ✅ RUTAS QUE SOLO ADMIN PUEDE ACCEDER
  const adminOnlyPaths = [
    "/admin/codigos",
    "/test-descuentos",
    "/api/discount-codes", // Solo admin puede gestionar códigos
    "/api/users", // Solo admin puede gestionar usuarios
  ]

  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))
  const isAdminOnlyPath = adminOnlyPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  // ✅ PROTEGER /api/bookings para métodos que no sean POST
  const needsAuth =
    isProtectedPath || (request.nextUrl.pathname.startsWith("/api/bookings") && request.method !== "POST")

  if (needsAuth) {
    const token = request.cookies.get("admin-token")?.value
    console.log("🔍 Token encontrado:", !!token)

    if (!token) {
      console.log("❌ No token, redirigiendo a login")
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      console.log("✅ Token válido:", payload)

      // ✅ VERIFICAR PERMISOS PARA RUTAS ADMIN-ONLY
      if (isAdminOnlyPath) {
        // ✅ COMPATIBILIDAD: Verificar tanto isAdmin como role
        const isAdmin = payload.isAdmin === true || payload.role === "admin"

        if (!isAdmin) {
          console.log("❌ Acceso denegado: Se requiere rol admin")
          return NextResponse.redirect(new URL("/admin?error=access-denied", request.url))
        }
      }

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
    "/api/liability-waiver/:path*",
    "/api/bookings/:path*",
    "/api/discount-codes/:path*", // 🔒 GESTIÓN ADMIN
    "/api/discount/:path*", // ✅ INCLUIR VALIDACIÓN (pero permitir público)
    "/api/create-payment-intent/:path*",
    "/api/confirm-booking/:path*",
    "/api/deposits/:path*",
    "/api/analytics/:path*",
    "/api/users/:path*",
  ],
}
