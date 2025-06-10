"use client"

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { useApp } from "@/components/providers"

const translations = {
  es: {
    title: "Términos y Condiciones",
    lastUpdated: "Última actualización: Enero 2025",
    intro:
      "Estos términos y condiciones rigen el uso de nuestros servicios de alquiler de embarcaciones. Al realizar una reserva con OroBoats, acepta estos términos.",
    section1: {
      title: "1. Servicios",
      content:
        "OroBoats ofrece servicios de alquiler de barcos y motos acuáticas en La Herradura, Granada. Todos los alquileres están sujetos a disponibilidad y condiciones meteorológicas favorables.",
    },
    section2: {
      title: "2. Reservas y Pagos",
      content:
        "Las reservas requieren un depósito del 50% para confirmar la disponibilidad. El pago restante debe realizarse antes del inicio del alquiler. Aceptamos pagos con tarjeta de crédito y transferencia bancaria.",
    },
    section3: {
      title: "3. Requisitos del Cliente",
      content:
        "Los clientes deben tener al menos 18 años y poseer una licencia de navegación válida para embarcaciones que la requieran. Se requiere identificación válida para todos los alquileres.",
    },
    section4: {
      title: "4. Responsabilidades",
      content:
        "El cliente es responsable del uso seguro de la embarcación y debe seguir todas las instrucciones de seguridad. OroBoats no se hace responsable de accidentes causados por negligencia del usuario.",
    },
    section5: {
      title: "5. Cancelaciones",
      content:
        "Las cancelaciones realizadas con más de 48 horas de antelación recibirán un reembolso completo. Las cancelaciones con menos de 48 horas están sujetas a una tarifa del 50%.",
    },
    section6: {
      title: "6. Daños y Depósito de Seguridad",
      content:
        "Se requiere un depósito de seguridad que será devuelto tras la inspección de la embarcación. El cliente será responsable de cualquier daño causado durante el alquiler.",
    },
    section7: {
      title: "7. Condiciones Meteorológicas",
      content:
        "OroBoats se reserva el derecho de cancelar o modificar reservas debido a condiciones meteorológicas adversas por razones de seguridad.",
    },
    section8: {
      title: "8. Contacto",
      content:
        "Para cualquier consulta sobre estos términos, contacte con nosotros en info@oroboats.com o llame al +34 655 52 79 88.",
    },
  },
  en: {
    title: "Terms and Conditions",
    lastUpdated: "Last updated: January 2025",
    intro:
      "These terms and conditions govern the use of our boat rental services. By making a booking with OroBoats, you agree to these terms.",
    section1: {
      title: "1. Services",
      content:
        "OroBoats offers boat and jet ski rental services in La Herradura, Granada. All rentals are subject to availability and favorable weather conditions.",
    },
    section2: {
      title: "2. Bookings and Payments",
      content:
        "Bookings require a 50% deposit to confirm availability. The remaining payment must be made before the start of the rental. We accept credit card and bank transfer payments.",
    },
    section3: {
      title: "3. Customer Requirements",
      content:
        "Customers must be at least 18 years old and possess a valid navigation license for boats that require it. Valid identification is required for all rentals.",
    },
    section4: {
      title: "4. Responsibilities",
      content:
        "The customer is responsible for the safe use of the vessel and must follow all safety instructions. OroBoats is not responsible for accidents caused by user negligence.",
    },
    section5: {
      title: "5. Cancellations",
      content:
        "Cancellations made more than 48 hours in advance will receive a full refund. Cancellations with less than 48 hours are subject to a 50% fee.",
    },
    section6: {
      title: "6. Damages and Security Deposit",
      content:
        "A security deposit is required and will be returned after vessel inspection. The customer will be responsible for any damage caused during the rental.",
    },
    section7: {
      title: "7. Weather Conditions",
      content:
        "OroBoats reserves the right to cancel or modify bookings due to adverse weather conditions for safety reasons.",
    },
    section8: {
      title: "8. Contact",
      content: "For any questions about these terms, contact us at info@oroboats.com or call +34 655 52 79 88.",
    },
  },
}

export default function TermsPage() {
  const { language } = useApp()
  const t = translations[language]

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{t.title}</h1>
            <p className="text-gray-600">{t.lastUpdated}</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-gray-700 mb-8">{t.intro}</p>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.section1.title}</h2>
                <p className="text-gray-700">{t.section1.content}</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.section2.title}</h2>
                <p className="text-gray-700">{t.section2.content}</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.section3.title}</h2>
                <p className="text-gray-700">{t.section3.content}</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.section4.title}</h2>
                <p className="text-gray-700">{t.section4.content}</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.section5.title}</h2>
                <p className="text-gray-700">{t.section5.content}</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.section6.title}</h2>
                <p className="text-gray-700">{t.section6.content}</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.section7.title}</h2>
                <p className="text-gray-700">{t.section7.content}</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.section8.title}</h2>
                <p className="text-gray-700">{t.section8.content}</p>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
