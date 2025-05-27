import { type NextRequest, NextResponse } from "next/server"
import { existsSync } from "fs"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ exists: false, error: "No URL provided" })
    }

    // Solo verificar rutas locales que empiecen con /
    if (!url.startsWith("/")) {
      return NextResponse.json({ exists: true, message: "External URL - cannot verify" })
    }

    // Construir la ruta del archivo
    const filePath = path.join(process.cwd(), "public", url)
    const exists = existsSync(filePath)

    return NextResponse.json({
      exists,
      url,
      message: exists ? "Archivo encontrado" : "Archivo no encontrado",
    })
  } catch (error) {
    console.error("❌ Check file error:", error)
    return NextResponse.json({ exists: false, error: "Error al verificar archivo" })
  }
}
