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

  // ✅ ENDPOINTS PÚBLICOS - Los clientes necesitan acceso para hacer reservas
  const publicEndpoints = [
    "/api/liability-waiver", // 🔓 Los clientes deben poder firmar el waiver
    "/api/create-payment-intent", // 🔓 Necesario para iniciar pagos
    "/api/confirm-booking", // 🔓 Necesario para confirmar reservas después del pago
  ]

  // ✅ VERIFICAR SI ES UN ENDPOINT PÚBLICO
  const isPublicEndpoint = publicEndpoints.some((path) => request.nextUrl.pathname.startsWith(path))

  if (isPublicEndpoint) {
    console.log("✅ Endpoint público permitido:", request.nextUrl.pathname)
    return NextResponse.next()
  }

  // ✅ MANEJO ESPECIAL PARA /api/bookings
  if (request.nextUrl.pathname.startsWith("/api/bookings")) {
    // 🔓 PERMITIR POST (crear reservas) - público para clientes
    if (request.method === "POST") {
      console.log("✅ POST a /api/bookings permitido (crear reserva)")
      return NextResponse.next()
    }
    // 🔒 PROTEGER GET/PUT/DELETE (gestionar reservas) - solo admin
    console.log("🔒 Método", request.method, "en /api/bookings requiere autenticación")
    // Continúa con la verificación de token abajo
  }

  // ✅ PROTEGER RUTAS ADMIN, DASHBOARD Y APIs SENSIBLES
  const protectedPaths = [
    "/admin",
    "/dashboard",
    "/test-descuentos",
    "/api/bookings", // 🔒 GET/PUT/DELETE requieren auth (POST ya se maneja arriba)
    "/api/discount-codes", // 🔒 PROTEGER CÓDIGOS DESCUENTO
    "/api/deposits", // 🔒 PROTEGER FIANZAS
    "/api/analytics", // 🔒 PROTEGER ANALYTICS
    "/api/users", // 🔒 PROTEGER GESTIÓN DE USUARIOS
  ]

  // ✅ RUTAS QUE SOLO ADMIN PUEDE ACCEDER
  const adminOnlyPaths = [
    "/admin/codigos",
    "/test-descuentos",
    "/api/discount-codes",
    "/api/users", // Solo admin puede gestionar usuarios
  ]

  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))
  const isAdminOnlyPath = adminOnlyPaths.some((path) => request.nextUrl.pathname.startsWith(path))

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
    "/api/liability-waiver/:path*", // ✅ Incluir para logging, pero permitir acceso público
    "/api/bookings/:path*", // ✅ POST público, GET/PUT/DELETE protegido
    "/api/create-payment-intent/:path*", // ✅ Público para pagos
    "/api/confirm-booking/:path*", // ✅ Público para confirmaciones
    "/api/discount-codes/:path*", // 🔒 CÓDIGOS
    "/api/deposits/:path*", // 🔒 FIANZAS
    "/api/analytics/:path*", // 🔒 ANALYTICS
    "/api/users/:path*", // 🔒 USUARIOS
  ],
}
