import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { jwtVerify } from "jose"
import { getWaiverContent } from "@/lib/waiver-content" // Importar getWaiverContent

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "tu-secreto-super-seguro-cambiar-en-produccion")

// Función para limpiar nombre para filename (solo para el header)
function cleanFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/ñ/g, "n")
    .replace(/[áàäâ]/g, "a")
    .replace(/[éèëê]/g, "e")
    .replace(/[íìïî]/g, "i")
    .replace(/[óòöô]/g, "o")
    .replace(/[úùüû]/g, "u")
    .replace(/ç/g, "c")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 🔒 VERIFICAR AUTENTICACIÓN
    const token = request.cookies.get("admin-token")?.value
    if (!token) {
      return new NextResponse("Acceso no autorizado", { status: 401 })
    }
    try {
      await jwtVerify(token, JWT_SECRET)
    } catch (jwtError) {
      return new NextResponse("Token inválido", { status: 401 })
    }

    const waiverId = Number.parseInt(params.id)
    console.log(`🔍 PDF: Generating document for waiver ID ${waiverId}`)

    if (isNaN(waiverId)) {
      console.error("❌ PDF: Invalid waiver ID")
      return NextResponse.json({ error: "Invalid waiver ID" }, { status: 400 })
    }

    // ✅ Query para obtener los datos necesarios, incluyendo manual_deposit
    console.log(`🔍 PDF: Querying waiver ${waiverId}...`)
    const result = await db.execute(sql`
      SELECT
        lw.id,
        lw.customer_name,
        lw.customer_email,
        lw.customer_dni,
        lw.ip_address,
        lw.user_agent,
        lw.signature_data,
        lw.signed_at,
        lw.booking_id,
        lw.manual_deposit, -- Seleccionar explícitamente manual_deposit
        b.booking_date,
        b.time_slot, -- Usar time_slot de bookings
        b.total_price,
        v.name as vehicle_name,
        v.type as vehicle_type
      FROM liability_waivers lw
      LEFT JOIN bookings b ON lw.booking_id = b.id
      LEFT JOIN vehicles v ON b.vehicle_id = v.id
      WHERE lw.id = ${waiverId}
    `)

    if (!result || result.length === 0) {
      console.error(`❌ PDF: Waiver ${waiverId} not found`)
      return NextResponse.json({ error: "Waiver not found" }, { status: 404 })
    }

    const waiver = result[0] as any
    console.log(`✅ PDF: Found waiver for ${waiver.customer_name}`)
    console.log(`💰 PDF: Manual deposit from DB: ${waiver.manual_deposit}`)

    // Obtener la dirección IP del cliente (del registro de la exención si existe, si no, de la solicitud)
    const ipAddress = waiver.ip_address || request.headers.get("x-forwarded-for") || request.ip || "N/A"

    // Determinar el idioma (puedes pasarlo como query param, ej: /api/waiver/123/pdf?lang=en)
    const language = request.nextUrl.searchParams.get("lang") === "en" ? "en" : "es"

    // Generar el contenido dinámico de la exención usando la función actualizada
    const waiverHtmlContent = getWaiverContent(
      language,
      waiver.customer_name,
      ipAddress,
      Number(waiver.manual_deposit) || null, // Pasar solo manual_deposit
    )

    // Limpiar nombre para filename
    const cleanName = cleanFilename(waiver.customer_name)
    console.log(`📄 PDF: Clean filename: ${cleanName}`)

    // Generar HTML optimizado para impresión/PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8">
          <title>Exención de Responsabilidad - ${waiver.customer_name}</title>
          <style>
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
              .page-break { page-break-before: always; }
            }
            body {
               font-family: 'Arial', sans-serif;
               margin: 15px; /* Reducido de 20px */
               line-height: 1.4; /* Reducido de 1.5 */
               color: #333;
              font-size: 10px; /* Reducido de 11px */
            }
            .header {
               text-align: center;
               margin-bottom: 20px; /* Reducido de 25px */
               border-bottom: 3px solid #FFD700;
              padding-bottom: 10px; /* Reducido de 15px */
            }
            .logo {
              font-size: 28px; /* Reducido de 32px */
              font-weight: bold;
              color: #FFD700;
              margin-bottom: 5px; /* Reducido de 8px */
            }
            .subtitle {
              font-size: 18px; /* Reducido de 20px */
              font-weight: bold;
              margin: 8px 0; /* Reducido de 10px */
              text-transform: uppercase;
            }
            .info-section {
               background: #f8f9fa;
               padding: 10px; /* Reducido de 15px */
               margin: 10px 0; /* Reducido de 15px */
               border-radius: 5px;
              border-left: 4px solid #FFD700;
            }
            .content {
               margin: 15px 0; /* Reducido de 20px */
              text-align: justify;
              line-height: 1.5; /* Mantenido en 1.5 para legibilidad del texto principal */
            }
            .section {
              margin: 20px 0;
              padding: 15px 0;
            }
            .section-title {
              font-weight: bold;
              font-size: 11px; /* Reducido de 12px */
              margin-bottom: 8px; /* Reducido de 10px */
              color: #333;
              border-bottom: 1px solid #ddd;
              padding-bottom: 3px; /* Reducido de 5px */
            }
            .section-content {
              margin-left: 10px;
              text-align: justify;
            }
            .list-item {
              margin: 3px 0; /* Reducido de 5px */
              padding-left: 15px;
              position: relative;
            }
            .list-item:before {
              content: "•";
              position: absolute;
              left: 0;
              color: #FFD700;
              font-weight: bold;
            }
            .signature-section {
              background: #e8f5e8;
              padding: 15px; /* Reducido de 20px */
              margin-top: 20px; /* Reducido de 30px */
              border-radius: 5px;
              border: 2px solid #4CAF50;
              position: relative;
              min-height: 150px; /* Reducido de 180px */
            }
            .signature-image {
              position: absolute;
              bottom: 15px; /* Reducido de 20px */
              right: 15px; /* Reducido de 20px */
              max-width: 250px; /* Reducido de 300px */
              max-height: 100px; /* Reducido de 120px */
              border: 2px solid #333;
              border-radius: 5px;
              background: white;
              padding: 5px; /* Reducido de 8px */
            }
            .signature-placeholder {
              position: absolute;
              bottom: 15px; /* Reducido de 20px */
              right: 15px; /* Reducido de 20px */
              width: 250px; /* Reducido de 300px */
              height: 100px; /* Reducido de 120px */
              border: 2px dashed #999;
              border-radius: 5px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #666;
              font-style: italic;
              background: #f9f9f9;
            }
            .footer {
              margin-top: 30px; /* Reducido de 40px */
              text-align: center;
              font-size: 9px; /* Reducido de 10px */
              color: #666;
              border-top: 2px solid #FFD700;
              padding-top: 15px; /* Reducido de 20px */
            }
            .download-btn, .print-btn {
              padding: 12px 24px;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-weight: bold;
              margin: 10px;
              font-size: 14px;
            }
            .download-btn {
              background: #FFD700;
              color: #333;
            }
            .print-btn {
              background: #4CAF50;
              color: white;
            }
            .important-box {
              background: #fff3cd;
              border: 2px solid #ffeaa7;
              padding: 12px; /* Reducido de 15px */
              border-radius: 8px;
              margin: 15px 0; /* Reducido de 20px */
              font-weight: bold;
            }
            .deposit-highlight {
              background: #e3f2fd;
              border: 2px solid #2196F3;
              padding: 8px; /* Reducido de 10px */
              border-radius: 5px;
              margin: 8px 0; /* Reducido de 10px */
              font-weight: bold;
              color: #1976D2;
            }
            .prohibition-list {
              background: #ffebee;
              border-left: 4px solid #f44336;
              padding: 12px; /* Reducido de 15px */
              margin: 12px 0; /* Reducido de 15px */
            }
            .grid-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
            }
            @media print {
              .grid-2 {
                display: block;
              }
              .grid-2 > * {
                display: inline-block;
                width: 48%;
                margin-right: 2%;
              }
            }
            .waiver-text {
              white-space: pre-wrap;
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button class="print-btn" onclick="window.print()">🖨️ Imprimir Documento</button>
            <button class="download-btn" onclick="downloadAsFile()">💾 Guardar como HTML</button>
          </div>
          <div class="header">
            <div class="logo">🚤 OroBoats</div>
            <div class="subtitle">Exención de Responsabilidad y Asunción de Riesgo</div>
            <div style="font-size: 14px; margin-top: 10px;">ALQUILER DE EMBARCACIONES Y MOTOS ACUÁTICAS</div>
          </div>
          <div class="info-section">
            <h3>📋 Información de la Reserva</h3>
            <div class="grid-2">
              <p><strong>Cliente:</strong> ${waiver.customer_name}</p>
              <p><strong>Email:</strong> ${waiver.customer_email}</p>
              <p><strong>DNI/NIE:</strong> ${waiver.customer_dni || "N/A"}</p>
              <p><strong>Vehículo:</strong> ${waiver.vehicle_name || "N/A"}</p>
              <p><strong>Tipo:</strong> ${waiver.vehicle_type || "N/A"}</p>
              <p><strong>Fecha:</strong> ${waiver.booking_date ? new Date(waiver.booking_date).toLocaleDateString("es-ES") : new Date().toLocaleDateString("es-ES")}</p>
              <p><strong>Horario:</strong> ${waiver.time_slot || "N/A"}</p>
            </div>
            <p><strong>ID Documento:</strong> ${waiver.id} | <strong>ID Reserva:</strong> ${waiver.booking_id || "Manual"}</p>${waiver.total_price ? `<p><strong>Precio Total:</strong> €${waiver.total_price}</p>` : ""}
          </div>
          <div class="important-box">
            <strong>⚠️ DECLARACIÓN IMPORTANTE:</strong><br>
            Yo, <strong>${waiver.customer_name}</strong>, con fecha <strong>${new Date(waiver.signed_at).toLocaleDateString("es-ES")}</strong>, declaro y acepto lo siguiente:
          </div>
          <div class="content waiver-text">
            ${waiverHtmlContent}
          </div>
          <div class="signature-section">
            <h3>✅ Información de la Firma Digital</h3>
            <div class="grid-2" style="margin-bottom: 20px;">
              <div>
                <p><strong>Firmado por:</strong> ${waiver.customer_name}</p>
                <p><strong>DNI/NIE:</strong> ${waiver.customer_dni || "N/A"}</p>
                <p><strong>Email:</strong> ${waiver.customer_email}</p>
                <p><strong>Fecha y hora:</strong> ${new Date(waiver.signed_at).toLocaleString("es-ES")}</p>
              </div>
              <div>
                <p><strong>Dirección IP:</strong> ${waiver.ip_address || "N/A"}</p>
                <p><strong>ID del documento:</strong> ${waiver.id}</p>
                <p><strong>Estado:</strong> ✅ <span style="color: green; font-weight: bold;">FIRMADO DIGITALMENTE</span></p>
              </div>
            </div>
            <div style="text-align: center; margin: 20px 0; padding: 15px; background: white; border-radius: 5px;">
              <strong>FIRMA DIGITAL: ${waiver.customer_name}</strong><br>
              <strong>FECHA: ${new Date(waiver.signed_at).toLocaleDateString("es-ES")}</strong><br>
              <strong>HORA: ${new Date(waiver.signed_at).toLocaleTimeString("es-ES")}</strong>
            </div>
            ${
              waiver.signature_data && waiver.signature_data.startsWith("data:image/")
                ? `<img src="${waiver.signature_data}" alt="Firma digital del cliente" class="signature-image" />`
                : `<div class="signature-placeholder">Sin firma digital guardada</div>`
            }
          </div>
          <div style="margin-top: 20px; padding: 15px; background: #f0f8ff; border-radius: 5px; text-align: center;">
            <strong>Este documento ha sido firmado electrónicamente y tiene la misma validez legal que una firma manuscrita.</strong>
          </div>
          <div class="footer">
            <p><strong>🚤 OroBoats</strong> - Alquiler de Embarcaciones y Motos Acuáticas</p>
            <p>Documento generado automáticamente el ${new Date().toLocaleString("es-ES")}</p>
            <p>📧 Contacto: info@oroboats.com | 📞 Teléfono: +34 655 52 79 88</p>
            <p style="margin-top: 10px; font-size: 9px;">
              Este documento constituye un acuerdo legal vinculante entre el cliente y OroBoats.<br>
              Conserve una copia para sus registros.
            </p>
          </div>
          <script class="no-print">
            function downloadAsFile() {
              const element = document.createElement('a');
              const file = new Blob([document.documentElement.outerHTML], {type: 'text/html'});
              element.href = URL.createObjectURL(file);
              element.download = 'exencion-responsabilidad-${cleanName}-${waiverId}.html';
              document.body.appendChild(element);
              element.click();
              document.body.removeChild(element);
            }
          </script>
        </body>
      </html>
    `
    console.log(`✅ PDF: Generated complete HTML document for waiver ${waiverId}`)

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
        "Content-Disposition": `inline; filename="exencion-responsabilidad-${cleanName}-${waiverId}.html"`,
      },
    })
  } catch (error) {
    console.error("❌ PDF: Error generating waiver document:", error)
    if (error instanceof Error) {
      console.error("❌ PDF: Error message:", error.message)
      console.error("❌ PDF: Error stack:", error.stack)
    }
    return NextResponse.json(
      {
        error: "Failed to generate document",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : "Internal server error",
        waiverId: params.id,
      },
      { status: 500 },
    )
  }
}
