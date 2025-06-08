import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { liabilityWaivers } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const waiverId = Number.parseInt(params.id)

    // Obtener el documento de la base de datos
    const waiver = await db.query.liabilityWaivers.findFirst({
      where: eq(liabilityWaivers.id, waiverId),
    })

    if (!waiver) {
      return NextResponse.json({ error: "Waiver not found" }, { status: 404 })
    }

    // Generar PDF simple (puedes usar una librería como puppeteer para PDFs más complejos)
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Exención de Responsabilidad - ${waiver.customerName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; }
            .signature-info { background: #f5f5f5; padding: 15px; margin-top: 20px; }
            .content { white-space: pre-line; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>OroBoats - Exención de Responsabilidad</h1>
            <p>Documento firmado digitalmente</p>
          </div>
          
          <div class="content">${waiver.waiverContent}</div>
          
          <div class="signature-info">
            <h3>Información de la Firma Digital:</h3>
            <p><strong>Firmado por:</strong> ${waiver.customerName}</p>
            <p><strong>Email:</strong> ${waiver.customerEmail}</p>
            <p><strong>Fecha y hora:</strong> ${new Date(waiver.signedAt).toLocaleString("es-ES")}</p>
            <p><strong>Dirección IP:</strong> ${waiver.ipAddress}</p>
          </div>
        </body>
      </html>
    `

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="waiver-${waiver.customerName}-${waiverId}.html"`,
      },
    })
  } catch (error) {
    console.error("Error generating waiver PDF:", error)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  }
}
