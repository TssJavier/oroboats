import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getCurrentUser } from "@/lib/auth"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// API específica para obtener solo los comerciales (para el dropdown del modal)
export async function GET() {
  try {
    console.log("🔍 API: Fetching commercials for dropdown...")

    // Verificar autenticación
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener solo comerciales activos
    const { data: commercials, error } = await supabase
      .from("admin_users")
      .select("id, name, email")
      .eq("role", "comercial")
      .order("name")

    if (error) {
      console.error("❌ Error fetching commercials:", error)
      return NextResponse.json({ error: "Error al obtener comerciales" }, { status: 500 })
    }

    console.log(`✅ Found ${commercials?.length || 0} commercials`)

    // Formatear para el dropdown (mantener compatibilidad con el formato anterior)
    const formattedCommercials =
      commercials?.map((commercial) => ({
        id: commercial.email, // Usar email como ID para compatibilidad
        name: commercial.name,
        email: commercial.email,
      })) || []

    return NextResponse.json({ commercials: formattedCommercials })
  } catch (error) {
    console.error("❌ Error in commercials API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
