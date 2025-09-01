import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { supabaseAdmin } from "@/lib/db-supabase"

const supabase = supabaseAdmin

export async function GET() {
  try {
    const currentUser = await getCurrentUser()

    // ✅ VERIFICAR PERMISOS: Solo admin puede ver comerciales
    if (!currentUser || (currentUser.role !== "admin" && !currentUser.isAdmin)) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const { data: users, error } = await supabase
      .from("admin_users")
      .select("id, email, name, role, created_at, last_login")
      .eq("role", "comercial")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
    }

    return NextResponse.json(users || [])
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()

    // ✅ VERIFICAR PERMISOS: Solo admin puede crear comerciales
    if (!currentUser || (currentUser.role !== "admin" && !currentUser.isAdmin)) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    const { email, name, password } = body

    if (
      typeof email !== "string" ||
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ||
      typeof name !== "string" ||
      name.trim() === "" ||
      typeof password !== "string" ||
      password.length < 6
    ) {
      return NextResponse.json({ error: "Datos de usuario inválidos" }, { status: 400 })
    }

    // Verificar si el email ya existe
    const { data: existingUsers, error: checkError } = await supabase
      .from("admin_users")
      .select("id")
      .eq("email", email)

    if (checkError) {
      console.error("Error checking existing user:", checkError)
      return NextResponse.json({ error: "Error al verificar usuario" }, { status: 500 })
    }

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({ error: "El email ya está en uso" }, { status: 400 })
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 12)

    // Crear el usuario
    const { data: newUser, error: insertError } = await supabase
      .from("admin_users")
      .insert({
        email,
        name,
        password: hashedPassword,
        role: "comercial",
        created_at: new Date().toISOString(),
      })
      .select("id, email, name, role, created_at")
      .single()

    if (insertError) {
      console.error("Error creating user:", insertError)
      return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 })
    }

    return NextResponse.json(newUser)
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
