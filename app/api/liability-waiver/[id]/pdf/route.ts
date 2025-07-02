import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "tu-secreto-super-seguro-cambiar-en-produccion")

// ✅ NUEVA FUNCIÓN: Limpiar nombre para filename (solo para el header)
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

    // ✅ CORREGIDO: Await params antes de usar
    const waiverId = Number.parseInt(params.id)

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
        lw.customer_dni,
        lw.waiver_content,
        lw.ip_address,
        lw.user_agent,
        lw.signature_data,
        lw.signed_at,
        lw.booking_id,
        lw.manualdeposit,
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
    console.log(`💰 PDF: Manual deposit: ${waiver.manualdeposit}`)

    // Debug adicional para la firma
    if (waiver.signature_data) {
      console.log(`🔍 PDF: Signature preview: ${waiver.signature_data.substring(0, 50)}...`)
    } else {
      console.log(`⚠️ PDF: No signature data found for waiver ${waiverId}`)
    }

    // ✅ NUEVO: Obtener fianza del manual_deposit o calcular por defecto
    const manualDeposit = Number(waiver.manualdeposit) || 0
    const depositText = manualDeposit > 0 ? `${manualDeposit.toFixed(2)} €` : "0.00 €"

    console.log(`💰 PDF: Using deposit amount: ${depositText}`)

    // ✅ NUEVO: Limpiar nombre para filename (mantener original en el documento)
    const cleanName = cleanFilename(waiver.customer_name)
    console.log(`📄 PDF: Clean filename: ${cleanName}`)

    // Generar HTML optimizado para impresión/PDF con contenido completo
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
              margin: 20px; 
              line-height: 1.5; 
              color: #333;
              font-size: 11px;
            }
            
            .header { 
              text-align: center; 
              margin-bottom: 25px; 
              border-bottom: 3px solid #FFD700;
              padding-bottom: 15px;
            }
            
            .logo {
              font-size: 32px;
              font-weight: bold;
              color: #FFD700;
              margin-bottom: 8px;
            }
            
            .subtitle {
              font-size: 20px;
              font-weight: bold;
              margin: 10px 0;
              text-transform: uppercase;
            }
            
            .info-section { 
              background: #f8f9fa; 
              padding: 15px; 
              margin: 15px 0; 
              border-radius: 5px;
              border-left: 4px solid #FFD700;
            }
            
            .content { 
              margin: 20px 0;
              text-align: justify;
              line-height: 1.6;
            }
            
            .section {
              margin: 20px 0;
              padding: 15px 0;
            }
            
            .section-title {
              font-weight: bold;
              font-size: 12px;
              margin-bottom: 10px;
              color: #333;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            
            .section-content {
              margin-left: 10px;
              text-align: justify;
            }
            
            .list-item {
              margin: 5px 0;
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
              padding: 20px;
              margin-top: 30px;
              border-radius: 5px;
              border: 2px solid #4CAF50;
              position: relative;
              min-height: 180px;
            }
            
            .signature-image {
              position: absolute;
              bottom: 20px;
              right: 20px;
              max-width: 300px;
              max-height: 120px;
              border: 2px solid #333;
              border-radius: 5px;
              background: white;
              padding: 8px;
            }
            
            .signature-placeholder {
              position: absolute;
              bottom: 20px;
              right: 20px;
              width: 300px;
              height: 120px;
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
              margin-top: 40px;
              text-align: center;
              font-size: 10px;
              color: #666;
              border-top: 2px solid #FFD700;
              padding-top: 20px;
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
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
              font-weight: bold;
            }
            
            .deposit-highlight {
              background: #e3f2fd;
              border: 2px solid #2196F3;
              padding: 10px;
              border-radius: 5px;
              margin: 10px 0;
              font-weight: bold;
              color: #1976D2;
            }
            
            .prohibition-list {
              background: #ffebee;
              border-left: 4px solid #f44336;
              padding: 15px;
              margin: 15px 0;
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
              <p><strong>Horario:</strong> ${waiver.start_time || "N/A"} - ${waiver.end_time || "N/A"}</p>
            </div>
            <p><strong>ID Documento:</strong> ${waiver.id} | <strong>ID Reserva:</strong> ${waiver.booking_id || "Manual"}</p>
            ${waiver.total_price ? `<p><strong>Precio Total:</strong> €${waiver.total_price}</p>` : ""}
          </div>
          <div class="important-box">
            <strong>⚠️ DECLARACIÓN IMPORTANTE:</strong><br>
            Yo, <strong>${waiver.customer_name}</strong>, con fecha <strong>${new Date(waiver.signed_at).toLocaleDateString("es-ES")}</strong>, declaro y acepto lo siguiente:
          </div>
          
          <div class="content">
            <div class="section">
              <div class="section-title">1. ASUNCIÓN DE RIESGO</div>
              <div class="section-content">
                Entiendo y acepto que las actividades náuticas, incluyendo el uso de embarcaciones y motos acuáticas, conllevan riesgos inherentes que pueden resultar en lesiones personales, daños a la propiedad o incluso la muerte. Estos riesgos incluyen, pero no se limitan a:
                <div style="margin: 10px 0;">
                  <div class="list-item">Condiciones meteorológicas adversas</div>
                  <div class="list-item">Colisiones con otros vehículos acuáticos u objetos</div>
                  <div class="list-item">Caídas al agua</div>
                  <div class="list-item">Mal funcionamiento del equipo</div>
                  <div class="list-item">Errores de juicio del operador</div>
                </div>
              </div>
            </div>
            <div class="section">
              <div class="section-title">2. EXENCIÓN DE RESPONSABILIDAD</div>
              <div class="section-content">
                Por la presente, libero, exonero y mantengo indemne a <strong>OroBoats</strong>, sus propietarios, empleados, agentes y representantes de cualquier reclamación, demanda, acción legal o responsabilidad por lesiones personales, daños a la propiedad o muerte que puedan surgir del uso del equipo alquilado.
              </div>
            </div>
            <div class="section">
              <div class="section-title">3. COMPETENCIA Y EXPERIENCIA</div>
              <div class="section-content">
                Declaro que tengo la experiencia, competencia y habilidad necesarias para operar de manera segura el equipo alquilado. Si no tengo experiencia previa, acepto recibir y seguir todas las instrucciones de seguridad proporcionadas.
              </div>
            </div>
            <div class="section">
              <div class="section-title">4. CUMPLIMIENTO DE NORMAS</div>
              <div class="section-content">
                Me comprometo a cumplir con todas las leyes marítimas aplicables, regulaciones de navegación y normas de seguridad durante el período de alquiler.
              </div>
            </div>
            <div class="section">
              <div class="section-title">5. INSPECCIÓN DEL EQUIPO</div>
              <div class="section-content">
                Acepto inspeccionar el equipo antes del uso y notificar inmediatamente cualquier defecto o problema de seguridad.
              </div>
            </div>
            <div class="section">
              <div class="section-title">6. RESPONSABILIDAD POR DAÑOS</div>
              <div class="section-content">
                Acepto ser responsable de cualquier daño al equipo alquilado que resulte de mi negligencia, mal uso o violación de las condiciones de alquiler.
              </div>
            </div>
            <div class="section">
              <div class="section-title">7. CONDICIONES MÉDICAS</div>
              <div class="section-content">
                Declaro que no tengo condiciones médicas que puedan afectar mi capacidad para operar el equipo de manera segura.
              </div>
            </div>
            <div class="section">
              <div class="section-title">8. SEGURO</div>
              <div class="section-content">
                Entiendo que debo tener un seguro adecuado que cubra las actividades náuticas o acepto la responsabilidad personal por cualquier pérdida o daño.
              </div>
            </div>
            <div class="section">
              <div class="section-title">9. CONDICIONES ECONÓMICAS Y FIANZA</div>
              <div class="section-content">
                Para formalizar la reserva se deberá abonar un anticipo de:
                <div style="margin: 10px 0;">
                  <div class="list-item">50 € en el caso de motos de agua</div>
                  <div class="list-item">100 € en el caso de embarcaciones</div>
                </div>
                <div class="deposit-highlight">
                  El importe restante se abonará el mismo día de la reserva, junto con la fianza correspondiente al vehículo alquilado que asciende a <strong>${depositText}</strong>.
                </div>
                Dicha fianza será devuelta íntegramente si el equipo se devuelve en buen estado, con el depósito lleno (si corresponde) y dentro del horario establecido.
              </div>
            </div>
            <div class="section">
              <div class="section-title">10. USO INDEBIDO Y PENALIZACIONES</div>
              <div class="section-content">
                <div class="prohibition-list">
                  <strong>Está estrictamente prohibido:</strong>
                  <div class="list-item">Consumir alcohol o sustancias estupefacientes durante el uso del equipo</div>
                  <div class="list-item">Participar en regatas o competiciones</div>
                  <div class="list-item">Ceder el uso a terceros no autorizados</div>
                  <div class="list-item">Utilizar el equipo con fines comerciales sin autorización expresa</div>
                </div>
                <p style="margin-top: 15px;">
                  El incumplimiento podrá suponer la <strong>pérdida total de la fianza</strong> y la cancelación inmediata del servicio sin reembolso.<br>
                  En caso de retraso en la devolución del vehículo, se aplicará una <strong>penalización de 100 € por hora</strong>.
                </p>
              </div>
            </div>
            <div class="important-box" style="margin-top: 30px;">
              Al firmar este documento, reconozco que he leído y entendido completamente sus términos y que esta exención de responsabilidad es vinculante para mí, mis herederos, sucesores y cesionarios.
            </div>
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

    // ✅ MEJORADO: Log más detallado del error
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
