"use client"

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { useApp } from "@/components/providers"

const translations = {
  es: {
    title: "Política de Privacidad",
    lastUpdated: "Última actualización: Enero 2025",
    intro:
      "En OroBoats, nos comprometemos a proteger su privacidad y garantizar la seguridad de sus datos personales. Esta política explica cómo recopilamos, utilizamos y protegemos su información.",
    section1: {
      title: "1. Información que Recopilamos",
      content:
        "Recopilamos información personal cuando realiza una reserva, se registra en nuestro sitio web o se comunica con nosotros. Esto incluye nombre, dirección de correo electrónico, número de teléfono, información de pago y preferencias de navegación.",
    },
    section2: {
      title: "2. Uso de la Información",
      content:
        "Utilizamos su información para procesar reservas, proporcionar servicios de alquiler de embarcaciones, comunicarnos con usted sobre su reserva, mejorar nuestros servicios y cumplir con las obligaciones legales.",
    },
    section3: {
      title: "3. Protección de Datos",
      content:
        "Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger sus datos personales contra el acceso no autorizado, alteración, divulgación o destrucción.",
    },
    section4: {
      title: "4. Sus Derechos",
      content:
        "Bajo el RGPD, tiene derecho a acceder, rectificar, suprimir, limitar el procesamiento, portabilidad de datos y oposición al tratamiento de sus datos personales. Para ejercer estos derechos, contáctenos en info@oroboats.com.",
    },
    section5: {
      title: "5. Cookies",
      content:
        "Utilizamos cookies para mejorar su experiencia en nuestro sitio web, analizar el tráfico y personalizar el contenido. Puede gestionar las preferencias de cookies en la configuración de su navegador.",
    },
    section6: {
      title: "6. Contacto",
      content:
        "Si tiene preguntas sobre esta política de privacidad, puede contactarnos en info@oroboats.com o llamar al +34 655 52 79 88.",
    },
  },
  en: {
    title: "Privacy Policy",
    lastUpdated: "Last updated: January 2025",
    intro:
      "At OroBoats, we are committed to protecting your privacy and ensuring the security of your personal data. This policy explains how we collect, use, and protect your information.",
    section1: {
      title: "1. Information We Collect",
      content:
        "We collect personal information when you make a booking, register on our website, or communicate with us. This includes name, email address, phone number, payment information, and navigation preferences.",
    },
    section2: {
      title: "2. Use of Information",
      content:
        "We use your information to process bookings, provide boat rental services, communicate with you about your reservation, improve our services, and comply with legal obligations.",
    },
    section3: {
      title: "3. Data Protection",
      content:
        "We implement appropriate technical and organizational security measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.",
    },
    section4: {
      title: "4. Your Rights",
      content:
        "Under GDPR, you have the right to access, rectify, delete, limit processing, data portability, and object to the processing of your personal data. To exercise these rights, contact us at info@oroboats.com.",
    },
    section5: {
      title: "5. Cookies",
      content:
        "We use cookies to improve your experience on our website, analyze traffic, and personalize content. You can manage cookie preferences in your browser settings.",
    },
    section6: {
      title: "6. Contact",
      content:
        "If you have questions about this privacy policy, you can contact us at info@oroboats.com or call +34 655 52 79 88.",
    },
  },
}

export default function PrivacyPage() {
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
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
