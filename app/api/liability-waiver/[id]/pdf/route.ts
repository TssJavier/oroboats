import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "tu-secreto-super-seguro-cambiar-en-produccion")

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // ✅ CORREGIDO: Await params antes de usar
    const resolvedParams = await params
    const waiverId = Number.parseInt(resolvedParams.id)
    console.log(`🔍 PDF: Generating document for waiver ID ${waiverId}`)

    if (isNaN(waiverId)) {
      console.error("❌ PDF: Invalid waiver ID")
      return NextResponse.json({ error: "Invalid waiver ID" }, { status: 400 })
    }

    // ✅ MEJORADO: Query más específica para debug
    console.log(`🔍 PDF: Querying waiver ${waiverId}...`)

    const result = await db.execute(sql`
      SELECT 
        lw.id,
        lw.customer_name,
        lw.customer_email,
        lw.waiver_content,
        lw.ip_address,
        lw.user_agent,
        lw.signature_data,
        lw.signed_at,
        lw.booking_id,
        LENGTH(lw.signature_data) as signature_length,
        CASE 
          WHEN lw.signature_data IS NULL THEN 'NULL'
          WHEN lw.signature_data = '' THEN 'EMPTY'
          WHEN lw.signature_data LIKE 'data:image/%' THEN 'VALID_BASE64'
          ELSE 'UNKNOWN_FORMAT'
        END as signature_status,
        b.customer_name as booking_customer_name,
        b.customer_email as booking_customer_email,
        b.booking_date,
        b.start_time,
        b.end_time,
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
    console.log(`🖊️ PDF: Signature status: ${waiver.signature_status}`)
    console.log(`📏 PDF: Signature length: ${waiver.signature_length || 0} characters`)

    // Debug adicional para la firma
    if (waiver.signature_data) {
      console.log(`🔍 PDF: Signature preview: ${waiver.signature_data.substring(0, 50)}...`)
    } else {
      console.log(`⚠️ PDF: No signature data found for waiver ${waiverId}`)
    }

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
            }
            
            body { 
              font-family: 'Arial', sans-serif; 
              margin: 20px; 
              line-height: 1.4; 
              color: #333;
              font-size: 12px;
            }
            
            .header { 
              text-align: center; 
              margin-bottom: 20px; 
              border-bottom: 3px solid #FFD700;
              padding-bottom: 15px;
            }
            
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #FFD700;
              margin-bottom: 5px;
            }
            
            .subtitle {
              font-size: 18px;
              font-weight: bold;
              margin: 10px 0;
            }
            
            .info-section { 
              background: #f8f9fa; 
              padding: 15px; 
              margin: 15px 0; 
              border-radius: 5px;
              border-left: 4px solid #FFD700;
            }
            
            .content { 
              margin: 15px 0;
              text-align: justify;
              line-height: 1.6;
            }
            
            .signature-section {
              background: #e8f5e8;
              padding: 15px;
              margin-top: 20px;
              border-radius: 5px;
              border: 2px solid #4CAF50;
              position: relative;
              min-height: 150px;
            }
            
            .signature-image {
              position: absolute;
              bottom: 15px;
              right: 15px;
              max-width: 250px;
              max-height: 100px;
              border: 1px solid #333;
              border-radius: 5px;
              background: white;
              padding: 5px;
            }
            
            .signature-placeholder {
              position: absolute;
              bottom: 15px;
              right: 15px;
              width: 250px;
              height: 100px;
              border: 2px dashed #999;
              border-radius: 5px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #666;
              font-style: italic;
              background: #f9f9f9;
            }
            
            .debug-info {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              padding: 10px;
              border-radius: 5px;
              margin: 10px 0;
              font-size: 10px;
              color: #856404;
            }
            
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 10px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 15px;
            }
            
            .download-btn {
              background: #FFD700;
              color: #333;
              padding: 10px 20px;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-weight: bold;
              margin: 10px;
            }
            
            .print-btn {
              background: #4CAF50;
              color: white;
              padding: 10px 20px;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-weight: bold;
              margin: 10px;
            }
            
            h3 {
              color: #333;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            
            .important {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              padding: 10px;
              border-radius: 5px;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button class="print-btn" onclick="window.print()">🖨️ Imprimir</button>
            <button class="download-btn" onclick="downloadAsFile()">💾 Guardar como HTML</button>
          </div>

          <div class="header">
            <div class="logo">🚤 OroBoats</div>
            <div class="subtitle">EXENCIÓN DE RESPONSABILIDAD</div>
            <p>Documento firmado digitalmente</p>
          </div>
          
          <div class="info-section">
            <h3>📋 Información de la Reserva</h3>
            <p><strong>Cliente:</strong> ${waiver.customer_name}</p>
            <p><strong>Email:</strong> ${waiver.customer_email}</p>
            <p><strong>Vehículo:</strong> ${waiver.vehicle_name || "N/A"} (${waiver.vehicle_type || "N/A"})</p>
            <p><strong>Fecha:</strong> ${waiver.booking_date ? new Date(waiver.booking_date).toLocaleDateString("es-ES") : "N/A"}</p>
            <p><strong>Horario:</strong> ${waiver.start_time || "N/A"} - ${waiver.end_time || "N/A"}</p>
            <p><strong>Precio total:</strong> €${waiver.total_price || "N/A"}</p>
            <p><strong>ID Reserva:</strong> ${waiver.booking_id}</p>
          </div>

          <div class="important">
            <strong>⚠️ IMPORTANTE:</strong> Este documento constituye un acuerdo legal vinculante. 
            Léalo cuidadosamente antes de participar en actividades náuticas.
          </div>
          
          <div class="content">
            <h3>📄 TÉRMINOS Y CONDICIONES</h3>
            
            <p><strong>1. ASUNCIÓN DE RIESGO</strong><br>
            Yo, <strong>${waiver.customer_name}</strong>, entiendo y acepto que las actividades náuticas conllevan riesgos inherentes que pueden resultar en lesiones personales, daños a la propiedad o incluso la muerte.</p>
            
            <p><strong>2. EXENCIÓN DE RESPONSABILIDAD</strong><br>
            Por la presente, libero y exonero a OroBoats, sus propietarios, empleados y representantes de cualquier reclamación por lesiones o daños que puedan surgir del uso del equipo alquilado.</p>
            
            <p><strong>3. COMPETENCIA DEL OPERADOR</strong><br>
            Declaro que tengo la experiencia y habilidad necesarias para operar de manera segura el equipo alquilado, o acepto recibir las instrucciones de seguridad correspondientes.</p>
            
            <p><strong>4. CUMPLIMIENTO DE NORMAS</strong><br>
            Me comprometo a cumplir con todas las leyes marítimas, regulaciones de navegación y normas de seguridad durante el período de alquiler.</p>
            
            <p><strong>5. RESPONSABILIDAD POR DAÑOS</strong><br>
            Acepto ser responsable de cualquier daño al equipo que resulte de negligencia, mal uso o violación de las condiciones de alquiler.</p>
            
            <p><strong>6. CONDICIONES MÉDICAS</strong><br>
            Declaro que no tengo condiciones médicas que puedan afectar mi capacidad para operar el equipo de manera segura.</p>
          </div>
          
          <div class="signature-section">
            <h3>✅ Información de la Firma Digital</h3>
            <p><strong>Firmado por:</strong> ${waiver.customer_name}</p>
            <p><strong>Email:</strong> ${waiver.customer_email}</p>
            <p><strong>Fecha y hora:</strong> ${new Date(waiver.signed_at).toLocaleString("es-ES")}</p>
            <p><strong>Dirección IP:</strong> ${waiver.ip_address || "N/A"}</p>
            <p><strong>ID del documento:</strong> ${waiver.id}</p>
            <p><strong>Estado:</strong> ✅ <span style="color: green; font-weight: bold;">FIRMADO DIGITALMENTE</span></p>
            
            ${
              waiver.signature_data && waiver.signature_status === "VALID_BASE64"
                ? `<img src="${waiver.signature_data}" alt="Firma digital del cliente" class="signature-image" />`
                : `<div class="signature-placeholder">
                     ${
                       waiver.signature_status === "NULL"
                         ? "Sin firma digital guardada"
                         : waiver.signature_status === "EMPTY"
                           ? "Firma vacía"
                           : "Formato de firma no válido"
                     }
                   </div>`
            }
          </div>

          <div class="footer">
            <p><strong>OroBoats</strong> - Alquiler de Embarcaciones y Motos Acuáticas</p>
            <p>Documento generado automáticamente el ${new Date().toLocaleString("es-ES")}</p>
            <p>Este documento tiene validez legal equivalente a una firma manuscrita</p>
          </div>

          <script class="no-print">
            function downloadAsFile() {
              const element = document.createElement('a');
              const file = new Blob([document.documentElement.outerHTML], {type: 'text/html'});
              element.href = URL.createObjectURL(file);
              element.download = 'exencion-responsabilidad-${waiver.customer_name.replace(/\s+/g, "-")}-${waiverId}.html';
              document.body.appendChild(element);
              element.click();
              document.body.removeChild(element);
            }
          </script>
        </body>
      </html>
    `

    console.log(`✅ PDF: Generated HTML document for waiver ${waiverId}`)

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("❌ PDF: Error generating waiver document:", error)
    return NextResponse.json(
      {
        error: "Failed to generate document",
        details: error instanceof Error ? error.message : "Unknown error",
        waiverId: (await params).id,
      },
      { status: 500 },
    )
  }
}
