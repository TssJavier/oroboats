// Contenido del documento de exención de responsabilidad
export const WAIVER_CONTENT_ES = `EXENCIÓN DE RESPONSABILIDAD Y ASUNCIÓN DE RIESGO
ALQUILER DE EMBARCACIONES Y MOTOS ACUÁTICAS

Yo, [CUSTOMER_NAME], con fecha [DATE][LOCATION_CLAUSE], declaro y acepto lo siguiente:

1. ASUNCIÓN DE RIESGO
Entiendo y acepto que las actividades náuticas, incluyendo el uso de embarcaciones y motos acuáticas, conllevan riesgos inherentes que pueden resultar en lesiones personales, daños a la propiedad o incluso la muerte. Estos riesgos incluyen, pero no se limitan a:
- Condiciones meteorológicas adversas
- Colisiones con otros vehículos acuáticos u objetos
- Caídas al agua
- Mal funcionamiento del equipo
- Errores de juicio del operador

2. EXENCIÓN DE RESPONSABILIDAD
Por la presente, libero, exonero y mantengo indemne a OroBoats, sus propietarios, empleados, agentes y representantes de cualquier reclamación, demanda, acción legal o responsabilidad por lesiones personales, daños a la propiedad o muerte que puedan surgir del uso del equipo alquilado.

3. COMPETENCIA Y EXPERIENCIA
Declaro que tengo la experiencia, competencia y habilidad necesarias para operar de manera segura el equipo alquilado. Si no tengo experiencia previa, acepto recibir y seguir todas las instrucciones de seguridad proporcionadas.

4. CUMPLIMIENTO DE NORMAS
Me comprometo a cumplir con todas las leyes marítimas aplicables, regulaciones de navegación y normas de seguridad durante el período de alquiler.

5. INSPECCIÓN DEL EQUIPO
Acepto inspeccionar el equipo antes del uso y notificar inmediatamente cualquier defecto o problema de seguridad.

6. RESPONSABILIDAD POR DAÑOS
Acepto ser responsable de cualquier daño al equipo alquilado que resulte de mi negligencia, mal uso o violación de las condiciones de alquiler.

7. CONDICIONES MÉDICAS
Declaro que no tengo condiciones médicas que puedan afectar mi capacidad para operar el equipo de manera segura.

8. SEGURO
Entiendo que debo tener un seguro adecuado que cubra las actividades náuticas o acepto la responsabilidad personal por cualquier pérdida o daño.

9. CONDICIONES ECONÓMICAS Y FIANZA
Para formalizar la reserva se deberá abonar un anticipo de:
- 50 € en el caso de motos de agua
- 100 € en el caso de embarcaciones

El importe restante se abonará el mismo día de la reserva, junto con la fianza correspondiente al vehículo alquilado, que asciende a [DEPOSIT].
Dicha fianza será devuelta íntegramente si el equipo se devuelve en buen estado, con el depósito lleno (si corresponde) y dentro del horario establecido.

10. USO INDEBIDO Y PENALIZACIONES
Está estrictamente prohibido:
- Consumir alcohol o sustancias estupefacientes durante el uso del equipo
- Participar en regatas o competiciones
- Ceder el uso a terceros no autorizados
- Utilizar el equipo con fines comerciales sin autorización expresa

El incumplimiento podrá suponer la pérdida total de la fianza y la cancelación inmediata del servicio sin reembolso.
En caso de retraso en la devolución del vehículo, se aplicará una penalización de 100 € por hora.

Al firmar este documento, reconozco que he leído y entendido completamente sus términos y que esta exención de responsabilidad es vinculante para mí, mis herederos, sucesores y cesionarios.

FIRMA DIGITAL: [CUSTOMER_NAME]
FECHA: [DATE]
HORA: [TIME]
Este documento ha sido firmado electrónicamente y tiene la misma validez legal que una firma manuscrita.`

export const WAIVER_CONTENT_EN = `LIABILITY WAIVER AND ASSUMPTION OF RISK
BOAT AND JET SKI RENTAL

I, [CUSTOMER_NAME], on [DATE][LOCATION_CLAUSE], declare and accept the following:

1. ASSUMPTION OF RISK
I understand and accept that nautical activities, including the use of boats and jet skis, carry inherent risks that may result in personal injury, property damage, or even death. These risks include, but are not limited to:
- Adverse weather conditions
- Collisions with other watercraft or objects
- Falls into water
- Equipment malfunction
- Operator judgment errors

2. LIABILITY WAIVER
I hereby release, exonerate, and hold harmless OroBoats, its owners, employees, agents, and representatives from any claims, demands, legal action, or liability for personal injury, property damage, or death that may arise from the use of rented equipment.

3. COMPETENCE AND EXPERIENCE
I declare that I have the necessary experience, competence, and skill to safely operate the rented equipment. If I have no prior experience, I agree to receive and follow all safety instructions provided.

4. COMPLIANCE WITH REGULATIONS
I commit to comply with all applicable maritime laws, navigation regulations, and safety standards during the rental period.

5. EQUIPMENT INSPECTION
I agree to inspect the equipment before use and immediately notify of any defects or safety issues.

6. LIABILITY FOR DAMAGES
I accept responsibility for any damage to rented equipment resulting from my negligence, misuse, or violation of rental conditions.

7. MEDICAL CONDITIONS
I declare that I have no medical conditions that may affect my ability to operate the equipment safely.

8. INSURANCE
I understand that I must have adequate insurance covering nautical activities or accept personal responsibility for any loss or damage.

9. PAYMENT TERMS AND SECURITY DEPOSIT
To confirm the booking, an advance payment must be made:
- €50 for jet skis
- €100 for boats

The remaining amount must be paid on the day of the booking, along with the security deposit corresponding to the rented vehicle, which amounts to [DEPOSIT].
The deposit will be fully refunded if the equipment is returned in good condition, with a full tank (if applicable), and on time.

10. MISUSE AND PENALTIES
The following are strictly prohibited:
- Consumption of alcohol or drugs during rental
- Participation in races or competitions
- Lending the equipment to unauthorized third parties
- Commercial use of the equipment without written consent

Failure to comply may result in full loss of the security deposit and immediate termination of the rental without refund.
A late return will incur a penalty of €100 per hour.

By signing this document, I acknowledge that I have read and fully understood its terms and that this liability waiver is binding on me, my heirs, successors, and assigns.

DIGITAL SIGNATURE: [CUSTOMER_NAME]
DATE: [DATE]
TIME: [TIME]
This document has been signed electronically and has the same legal validity as a handwritten signature.`

export function getWaiverContent(
  language: "es" | "en",
  customerName: string,
  ipAddress: string,
  manualDeposit: number | null, // Solo se pasa manualDeposit
  location?: string | null, // ✅ NUEVO: playa / ubicación de la reserva (opcional)
): string {
  const content = language === "es" ? WAIVER_CONTENT_ES : WAIVER_CONTENT_EN
  const now = new Date()

  // Usar manualDeposit directamente para el placeholder [DEPOSIT]
  const displayDeposit = manualDeposit || 0

  // ✅ NUEVO: Cláusula de ubicación dentro del cuerpo legal. Si no hay playa, queda vacío
  //    para no dejar frases a medias ("...con fecha X, declaro...").
  const trimmedLocation = (location || "").trim()
  const locationClause = trimmedLocation
    ? language === "es"
      ? `, para el alquiler de equipo acuático en ${trimmedLocation}`
      : `, for the rental of watercraft at ${trimmedLocation}`
    : ""

  console.log("🔍 DEBUG - getWaiverContent received:", {
    language,
    customerName,
    ipAddress,
    manualDeposit,
    location: trimmedLocation || "(sin ubicación)",
    displayDeposit: displayDeposit.toFixed(2) + " €",
  })

  return content
    .replace(/\[CUSTOMER_NAME\]/g, customerName)
    .replace(/\[DATE\]/g, now.toLocaleDateString(language === "es" ? "es-ES" : "en-US"))
    .replace(/\[TIME\]/g, now.toLocaleTimeString(language === "es" ? "es-ES" : "en-US"))
    .replace(/\[IP_ADDRESS\]/g, ipAddress)
    .replace(/\[LOCATION_CLAUSE\]/g, locationClause) // ✅ NUEVO
    .replace(/\[DEPOSIT\]/g, displayDeposit.toFixed(2) + " €") // Usar el valor de manualDeposit
}
