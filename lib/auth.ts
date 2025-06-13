import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "oroboats-secret-key-2024")

// ✅ SUPABASE CLIENT
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export type UserRole = "admin" | "comercial"

export interface AdminUser {
  email: string
  isAdmin: boolean
  // ✅ NUEVOS CAMPOS AÑADIDOS PARA COMPATIBILIDAD
  id?: string
  name?: string
  role?: UserRole
}

// ✅ MANTENER: Verificar credenciales de admin original
export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  // ✅ PRIMERO: Verificar admin original (variables de entorno)
  if (email === adminEmail && password === adminPassword) {
    return true
  }

  // ✅ SEGUNDO: Verificar en base de datos (SUPABASE)
  try {
    const { data: users, error } = await supabase
      .from("admin_users")
      .select("id, email, name, password, role")
      .eq("email", email)
      .eq("is_active", true)

    if (error || !users || users.length === 0) return false

    const user = users[0]
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (isValidPassword) {
      // Actualizar último login
      await supabase.from("admin_users").update({ last_login: new Date().toISOString() }).eq("id", user.id)

      return true
    }

    return false
  } catch (error) {
    console.error("Error verifying database credentials:", error)
    return false
  }
}

// ✅ NUEVA FUNCIÓN: Obtener información completa del usuario
export async function getUserInfo(email: string): Promise<AdminUser | null> {
  const adminEmail = process.env.ADMIN_EMAIL

  // ✅ Si es el admin original (variables de entorno)
  if (email === adminEmail) {
    return {
      email,
      isAdmin: true,
      id: "admin-env",
      name: "Administrador Principal",
      role: "admin",
    }
  }

  // ✅ Si es usuario de base de datos (SUPABASE)
  try {
    const { data: users, error } = await supabase
      .from("admin_users")
      .select("id, email, name, role")
      .eq("email", email)
      .eq("is_active", true)

    if (error || !users || users.length === 0) return null

    const user = users[0]
    return {
      email: user.email,
      isAdmin: user.role === "admin",
      id: user.id.toString(),
      name: user.name,
      role: user.role as UserRole,
    }
  } catch (error) {
    console.error("Error getting user info:", error)
    return null
  }
}

// ✅ ACTUALIZADO: Crear token JWT con nueva información
export async function createToken(user: AdminUser): Promise<string> {
  return await new SignJWT({
    email: user.email,
    isAdmin: user.isAdmin,
    // ✅ NUEVOS CAMPOS
    id: user.id,
    name: user.name,
    role: user.role || (user.isAdmin ? "admin" : "comercial"),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET)
}

// ✅ MANTENER: Verificar token JWT (sin cambios)
export async function verifyToken(token: string): Promise<AdminUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as AdminUser
  } catch {
    return null
  }
}

// ✅ MANTENER: Obtener usuario actual desde cookies (sin cambios)
export async function getCurrentUser(): Promise<AdminUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin-token")?.value

  if (!token) return null

  return await verifyToken(token)
}

// ✅ MANTENER: Establecer cookie de autenticación (sin cambios)
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

// ✅ MANTENER: Eliminar cookie de autenticación (sin cambios)
export async function removeAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete("admin-token")
}

// ✅ NUEVA FUNCIÓN: Verificar permisos
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  if (requiredRole === "admin") {
    return userRole === "admin"
  }
  return true // comercial puede acceder a todo excepto admin-only
}
