import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

// ✅ SUPABASE CLIENT
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser()

    // ✅ VERIFICAR PERMISOS: Solo admin puede editar comerciales
    if (!currentUser || (currentUser.role !== "admin" && !currentUser.isAdmin)) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const { name, password } = await request.json()
    const userId = params.id

    if (!name) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    }

    // Preparar datos para actualizar
    const updateData: any = { name }

    // Si se proporciona nueva contraseña, hashearla
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 12)
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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser()

    // ✅ VERIFICAR PERMISOS: Solo admin puede eliminar comerciales
    if (!currentUser || (currentUser.role !== "admin" && !currentUser.isAdmin)) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const userId = params.id

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
