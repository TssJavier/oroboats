import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken } from "./lib/auth"

export async function middleware(request: NextRequest) {
  // Rutas que requieren autenticación
  const protectedPaths = ["/dashboard"]
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (isProtectedPath) {
    const token = request.cookies.get("admin-token")?.value

    if (!token) {
      // No hay token, redirigir al login
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }

    try {
      // Verificar token
      const user = await verifyToken(token)
      if (!user || !user.isAdmin) {
        // Token inválido o usuario no es admin
        return NextResponse.redirect(new URL("/auth/login", request.url))
      }

      // Token válido, continuar
      return NextResponse.next()
    } catch {
      // Error al verificar token
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
