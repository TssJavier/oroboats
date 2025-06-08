import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { liabilityWaivers } from "@/lib/db/schema"
import { getWaiverContent } from "@/lib/waiver-content"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerName, customerEmail, language = "es" } = body

    // Obtener IP del cliente
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown"

    // Obtener User Agent
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Generar contenido del documento
    const waiverContent = getWaiverContent(language, customerName, ip)

    // Guardar en base de datos
    const waiver = await db
      .insert(liabilityWaivers)
      .values({
        customerName,
        customerEmail,
        waiverContent,
        ipAddress: ip,
        userAgent,
      })
      .returning()

    return NextResponse.json({
      success: true,
      waiverId: waiver[0].id,
      content: waiverContent,
    })
  } catch (error) {
    console.error("Error creating liability waiver:", error)
    return NextResponse.json({ error: "Failed to create liability waiver" }, { status: 500 })
  }
}
