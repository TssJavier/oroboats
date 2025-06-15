import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getWaiverContent } from "@/lib/waiver-content"
import { sql } from "drizzle-orm"

// Función para validar y limpiar datos base64
function validateAndCleanBase64(signatureData: string): string | null {
  try {
    // Verificar que es una imagen base64 válida
    if (!signatureData.startsWith("data:image/")) {
      console.error("❌ Invalid signature format: not a data URL")
      return null
    }

    // Extraer solo la parte base64 (sin el prefijo data:image/png;base64,)
    const base64Match = signatureData.match(/^data:image\/[a-zA-Z]+;base64,(.+)$/)
    if (!base64Match) {
      console.error("❌ Invalid base64 format")
      return null
    }

    const base64Data = base64Match[1]

    // Verificar que el base64 es válido
    try {
      atob(base64Data) // Esto lanzará error si no es base64 válido
    } catch (e) {
      console.error("❌ Invalid base64 encoding")
      return null
    }

    // Verificar longitud razonable (máximo 1MB en base64)
    if (base64Data.length > (1024 * 1024 * 4) / 3) {
      console.error("❌ Signature too large")
      return null
    }

    console.log(`✅ Signature validation passed. Length: ${signatureData.length}`)
    return signatureData
  } catch (error) {
    console.error("❌ Error validating signature:", error)
    return null
  }
}

export async function POST(request: NextRequest) {
  console.log("🚀 LIABILITY WAIVER API - Starting request processing...")

  try {
    // ✅ MEJOR MANEJO DE ERRORES DE PARSING
    let body: any
    try {
      const rawBody = await request.text()
      console.log("📦 Raw request body length:", rawBody.length)
      console.log("📦 Raw request body preview:", rawBody.substring(0, 100))

      body = JSON.parse(rawBody)
      console.log("📦 Parsed body keys:", Object.keys(body))
    } catch (parseError) {
      console.error("❌ JSON parsing error:", parseError)
      return NextResponse.json(
        {
          error: "Invalid JSON in request body",
          details: parseError instanceof Error ? parseError.message : "Unknown parsing error",
        },
        { status: 400 },
      )
    }

    const { customerName, customerEmail, language = "es", signatureData } = body

    // Verificar que tenemos los datos necesarios
    if (!customerName || !customerEmail) {
      console.error("❌ Missing required fields:", { customerName: !!customerName, customerEmail: !!customerEmail })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validar y limpiar la firma
    let validatedSignature: string | null = null
    if (signatureData) {
      validatedSignature = validateAndCleanBase64(signatureData)
      if (!validatedSignature) {
        console.error("❌ Signature validation failed")
        return NextResponse.json(
          {
            error: "Invalid signature format",
            details: "The signature data is not in a valid format",
          },
          { status: 400 },
        )
      }
    } else {
      console.error("❌ No signature data provided")
      return NextResponse.json(
        {
          error: "Signature required",
          details: "Digital signature is required to complete the waiver",
        },
        { status: 400 },
      )
    }

    // Obtener IP del cliente
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown"

    // Obtener User Agent
    const userAgent = request.headers.get("user-agent") || "unknown"

    console.log("🔍 Request info:", { ip, userAgent: userAgent.substring(0, 50) })

    // Generar contenido del documento
    let waiverContent: string
    try {
      waiverContent = getWaiverContent(language, customerName, ip)
      console.log("📝 Waiver content generated, length:", waiverContent.length)
    } catch (contentError) {
      console.error("❌ Error generating waiver content:", contentError)
      return NextResponse.json(
        {
          error: "Error generating waiver content",
          details: contentError instanceof Error ? contentError.message : "Unknown content error",
        },
        { status: 500 },
      )
    }

    console.log(`📝 Creating waiver for ${customerName} with validated signature`)

    // ✅ VERIFICAR CONEXIÓN A BASE DE DATOS ANTES DE INSERTAR
    try {
      console.log("🔍 Testing database connection...")
      await db.execute(sql`SELECT 1 as test`)
      console.log("✅ Database connection OK")
    } catch (dbTestError) {
      console.error("❌ Database connection failed:", dbTestError)
      return NextResponse.json(
        {
          error: "Database connection error",
          details: "Unable to connect to database",
        },
        { status: 500 },
      )
    }

    // Guardar en base de datos con manejo de errores mejorado
    try {
      console.log("💾 Inserting into database...")

      // Usar parámetros seguros para evitar problemas de SQL injection y formato
      const result = await db.execute(sql`
        INSERT INTO liability_waivers 
        (customer_name, customer_email, waiver_content, ip_address, user_agent, signature_data, signed_at, created_at)
        VALUES 
        (${customerName}, ${customerEmail}, ${waiverContent}, ${ip}, ${userAgent}, ${validatedSignature}, NOW(), NOW())
        RETURNING id
      `)

      if (!result || result.length === 0) {
        throw new Error("No se pudo crear el waiver en la base de datos")
      }

      const waiverId = result[0].id

      console.log(`✅ Waiver created successfully with ID: ${waiverId}`)

      // Verificar que se guardó correctamente
      const verification = await db.execute(sql`
        SELECT id, customer_name, 
               CASE WHEN signature_data IS NOT NULL THEN true ELSE false END AS has_signature,
               CASE WHEN signature_data IS NOT NULL THEN LENGTH(signature_data) ELSE 0 END AS sig_length
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
        hasSignature: true,
      })
    } catch (dbError) {
      console.error("❌ Database error details:", {
        error: dbError,
        message: dbError instanceof Error ? dbError.message : "Unknown database error",
        customerName,
        signatureLength: validatedSignature?.length || 0,
      })

      return NextResponse.json(
        {
          error: "Database error",
          details: dbError instanceof Error ? dbError.message : "Unknown database error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("❌ CRITICAL ERROR in liability waiver API:", error)

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
