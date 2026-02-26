import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { supabaseAdmin } from "@/lib/db-supabase"

const supabase = supabaseAdmin

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser()

    // ✅ VERIFICAR PERMISOS: Solo admin puede editar comerciales
    if (!currentUser || (currentUser.role !== "admin" && !currentUser.isAdmin)) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const { id: userId } = await params
    if (!userId) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    const { name, password } = body

    if (typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    }

    // Preparar datos para actualizar
    const updateData: any = { name }

    // Si se proporciona nueva contraseña, validar y hashearla
    if (typeof password === "string" && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 12)
    } else if (password !== undefined && password !== null && password !== "") {
      return NextResponse.json({ error: "Contraseña inválida" }, { status: 400 })
    }

    // Actualizar usuario
    const { data: updatedUser, error } = await supabase
      .from("admin_users")
      .update(updateData)
      .eq("id", userId)
      .select("id, email, name, role, created_at, last_login")
      .single()

    if (error) {
      console.error("Error updating user:", error)
      return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 })
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser()

    // ✅ VERIFICAR PERMISOS: Solo admin puede eliminar comerciales
    if (!currentUser || (currentUser.role !== "admin" && !currentUser.isAdmin)) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const { id: userId } = await params
    if (!userId) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 })
    }

    // Eliminar usuario
    const { error } = await supabase.from("admin_users").delete().eq("id", userId)

    if (error) {
      console.error("Error deleting user:", error)
      return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 })
    }

    return NextResponse.json({ message: "Usuario eliminado correctamente" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
