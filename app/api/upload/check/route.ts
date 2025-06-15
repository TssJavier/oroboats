import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ exists: false, error: "No URL provided" })
    }

    // Para URLs de Vercel Blob, siempre asumimos que existen si tienen el formato correcto
    if (url.includes("blob.vercel-storage.com")) {
      return NextResponse.json({
        exists: true,
        url,
        message: "Vercel Blob URL - assumed to exist",
      })
    }

    // Para URLs externas, intentar hacer un HEAD request
    if (url.startsWith("http")) {
      try {
        const response = await fetch(url, { method: "HEAD" })
        return NextResponse.json({
          exists: response.ok,
          url,
          message: response.ok ? "URL accesible" : "URL no accesible",
        })
      } catch {
        return NextResponse.json({
          exists: false,
          url,
          message: "Error al verificar URL externa",
        })
      }
    }

    // Para rutas locales, asumir que no existen (ya no usamos filesystem)
    return NextResponse.json({
      exists: false,
      url,
      message: "Rutas locales no soportadas - usar Vercel Blob",
    })
  } catch (error) {
    console.error("❌ Check file error:", error)
    return NextResponse.json({ exists: false, error: "Error al verificar archivo" })
  }
}
