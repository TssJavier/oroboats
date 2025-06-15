import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file received" }, { status: 400 })
    }

    // Validar tipo de archivo
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido. Solo se permiten: JPG, PNG, GIF, WebP" },
        { status: 400 },
      )
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "El archivo es demasiado grande. Máximo 5MB" }, { status: 400 })
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const fileName = `${timestamp}_${originalName}`

    // Determinar carpeta según el tipo de vehículo
    const vehicleType = formData.get("vehicleType") as string
    const folder = vehicleType === "boat" ? "barcos" : "motos"
    const blobName = `${folder}/${fileName}`

    // Subir a Vercel Blob
    const blob = await put(blobName, file, {
      access: "public",
    })

    console.log(`✅ File uploaded to Vercel Blob: ${blob.url}`)

    return NextResponse.json({
      success: true,
      url: blob.url,
      fileName,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("❌ Upload error:", error)
    return NextResponse.json({ error: "Error al subir el archivo" }, { status: 500 })
  }
}
