import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const jwtSecret = process.env.JWT_SECRET
if (!jwtSecret) {
  throw new Error("JWT_SECRET is not defined")
}
const JWT_SECRET = new TextEncoder().encode(jwtSecret)

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/auth/login") {
    return NextResponse.next()
  }

  const publicApiRoutes = [
    "/api/liability-waiver",
    "/api/create-payment-intent",
    "/api/confirm-booking",
    "/api/discount/validate",
    "/api/analytics/track",
  ]

  if (publicApiRoutes.some((route) => request.nextUrl.pathname.startsWith(route))) {
    return NextResponse.next()
  }

  if (request.nextUrl.pathname.startsWith("/api/bookings")) {
    if (request.method === "POST") {
      return NextResponse.next()
    }
  }

  const protectedPaths = [
    "/admin",
    "/dashboard",
    "/test-descuentos",
    "/api/discount-codes",
    "/api/deposits",
    "/api/admin/analytics",
    "/api/users",
  ]

  const adminOnlyPaths = [
    "/admin/codigos",
    "/test-descuentos",
    "/api/discount-codes",
    "/api/users",
  ]

  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))
  const isAdminOnlyPath = adminOnlyPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  const needsAuth =
    isProtectedPath || (request.nextUrl.pathname.startsWith("/api/bookings") && request.method !== "POST")

  if (needsAuth) {
    const token = request.cookies.get("admin-token")?.value

    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)

      if (isAdminOnlyPath) {
        const isAdmin = payload.isAdmin === true || payload.role === "admin"
        if (!isAdmin) {
          return NextResponse.redirect(new URL("/admin?error=access-denied", request.url))
        }
      }
      return NextResponse.next()
    } catch {
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
    "/api/analytics/:path*", // Esto cubre /api/admin/analytics y /api/analytics/track
    "/api/users/:path*",
  ],
}
