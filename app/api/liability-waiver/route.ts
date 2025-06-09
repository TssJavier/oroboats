import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getWaiverContent } from "@/lib/waiver-content"
import { sql } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("📦 Request body keys:", Object.keys(body))

    const { customerName, customerEmail, language = "es", signatureData } = body

    // Verificar que tenemos los datos necesarios
    if (!customerName || !customerEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verificar que tenemos la firma
    if (!signatureData) {
      console.warn("⚠️ No signature data provided for waiver")
    } else {
      console.log(`📏 Signature data length: ${signatureData.length} characters`)
      console.log(`🔍 Signature preview: ${signatureData.substring(0, 50)}...`)
    }

    // Obtener IP del cliente
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown"

    // Obtener User Agent
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Generar contenido del documento
    const waiverContent = getWaiverContent(language, customerName, ip)

    console.log(`📝 Creating waiver for ${customerName} with signature: ${signatureData ? "YES" : "NO"}`)

    // Crear objeto con valores explícitos para evitar problemas de tipo
    const waiverData = {
      customerName,
      customerEmail,
      waiverContent,
      ipAddress: ip,
      userAgent,
      // Usar el nombre correcto del campo en la base de datos
      signature_data: signatureData,
    }

    console.log("📊 Waiver data prepared:", {
      customerName: waiverData.customerName,
      hasSignature: !!waiverData.signature_data,
      signatureLength: waiverData.signature_data ? waiverData.signature_data.length : 0,
    })

    // Guardar en base de datos con manejo de errores mejorado
    try {
      // Usar SQL directo para mayor control
      const result = await db.execute(sql`
        INSERT INTO liability_waivers 
        (customer_name, customer_email, waiver_content, ip_address, user_agent, signature_data, signed_at, created_at)
        VALUES 
        (${customerName}, ${customerEmail}, ${waiverContent}, ${ip}, ${userAgent}, ${signatureData}, NOW(), NOW())
        RETURNING id, signature_data IS NOT NULL AS has_signature
      `)

      if (!result || result.length === 0) {
        throw new Error("No se pudo crear el waiver")
      }

      const waiverId = result[0].id
      const hasSignature = result[0].has_signature

      console.log(`✅ Waiver created with ID: ${waiverId}, has signature: ${hasSignature}`)

      // Verificar que se guardó correctamente
      const verification = await db.execute(sql`
        SELECT id, customer_name, signature_data IS NOT NULL AS has_signature, LENGTH(signature_data) AS sig_length
        FROM liability_waivers
        WHERE id = ${waiverId}
      `)

      if (verification && verification.length > 0) {
        console.log(
          `✅ Verification: Waiver ${waiverId} for ${verification[0].customer_name}, has signature: ${verification[0].has_signature}, length: ${verification[0].sig_length}`,
        )
      }

      return NextResponse.json({
        success: true,
        waiverId: waiverId,
        content: waiverContent,
        hasSignature: hasSignature,
      })
    } catch (dbError) {
      console.error("❌ Database error:", dbError)
      throw dbError
    }
  } catch (error) {
    console.error("❌ Error creating liability waiver:", error)
    return NextResponse.json(
      {
        error: "Failed to create liability waiver",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
