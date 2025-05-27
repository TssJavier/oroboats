import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "tu-secreto-super-seguro-cambiar-en-produccion")

export interface AdminUser {
  email: string
  isAdmin: boolean
}

// Verificar credenciales de admin
export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  return email === adminEmail && password === adminPassword
}

// Crear token JWT
export async function createToken(user: AdminUser): Promise<string> {
  return await new SignJWT({ email: user.email, isAdmin: user.isAdmin })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET)
}

// Verificar token JWT
export async function verifyToken(token: string): Promise<AdminUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as AdminUser
  } catch {
    return null
  }
}

// Obtener usuario actual desde cookies
export async function getCurrentUser(): Promise<AdminUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin-token")?.value

  if (!token) return null

  return await verifyToken(token)
}

// Establecer cookie de autenticación
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set("admin-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 horas
    path: "/",
  })
}

// Eliminar cookie de autenticación
export async function removeAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete("admin-token")
}
