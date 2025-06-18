"use client"
import { Facebook, Instagram, Mail, Phone } from "lucide-react"
import { useApp } from "@/components/providers"
import { OroLoading, useNavigationLoading } from "@/components/ui/oro-loading"
import { useRouter } from "next/navigation"
import Image from "next/image"

const translations = {
  es: {
    company: "Empresa",
    about: "Sobre Nosotros",
    contact: "Contacto",
    privacy: "Política de Privacidad",
    terms: "Términos y Condiciones",
    services: "Servicios",
    boats: "Barcos de Lujo",
    jetskis: "Motos Premium",
    parties: "Fiestas VIP",
    booking: "Reservas",
    follow: "Síguenos",
    rights: "Todos los derechos reservados.",
    tagline: "Experiencias premium en el mar",
  },
  en: {
    company: "Company",
    about: "About Us",
    contact: "Contact",
    privacy: "Privacy Policy",
    terms: "Terms & Conditions",
    services: "Services",
    boats: "Luxury Boats",
    jetskis: "Premium Jet Skis",
    parties: "VIP Parties",
    booking: "Booking",
    follow: "Follow Us",
    rights: "All rights reserved.",
    tagline: "Premium experiences at sea",
  },
}

export function Footer() {
  const { language } = useApp()
  const t = translations[language]
  const router = useRouter()
  const { isLoading, startLoading, stopLoading } = useNavigationLoading()

  const handleNavigation = (path: string) => {
    startLoading()
    setTimeout(() => {
      router.push(path)
      setTimeout(() => stopLoading(), 500)
    }, 1500)
  }

  if (isLoading) {
    return <OroLoading />
  }

  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              {/* ✅ CAMBIO: Usar imagen en lugar del icono Ship */}
              <Image src="/assets/logo.png" alt="OroBoats Logo" width={24} height={24} className="h-12 w-12" />
              <span className="text-2xl font-bold">
                Oro<span className="text-gold">Boats</span>
              </span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">{t.tagline}</p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gold" />
                <span className="text-gray-300">info@oroboats.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gold" />
                <span className="text-gray-300">+34 655 52 79 88</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6 text-white">{t.company}</h4>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => handleNavigation("/about")}
                  className="text-gray-400 hover:text-gold transition-colors duration-300 text-left"
                >
                  {t.about}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigation("/contact")}
                  className="text-gray-400 hover:text-gold transition-colors duration-300 text-left"
                >
                  {t.contact}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigation("/privacy")}
                  className="text-gray-400 hover:text-gold transition-colors duration-300 text-left"
                >
                  {t.privacy}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigation("/terms")}
                  className="text-gray-400 hover:text-gold transition-colors duration-300 text-left"
                >
                  {t.terms}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6 text-white">{t.services}</h4>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => handleNavigation("/boats?type=boats")}
                  className="text-gray-400 hover:text-gold transition-colors duration-300 text-left"
                >
                  {t.boats}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigation("/boats?type=jetskis")}
                  className="text-gray-400 hover:text-gold transition-colors duration-300 text-left"
                >
                  {t.jetskis}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigation("/fiestas")}
                  className="text-gray-400 hover:text-gold transition-colors duration-300 text-left"
                >
                  {t.parties}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigation("/boats")}
                  className="text-gray-400 hover:text-gold transition-colors duration-300 text-left"
                >
                  {t.booking}
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 mb-4 md:mb-0">
              © {new Date().getFullYear()} OroBoats. {t.rights}
            </p>

            <div className="flex items-center space-x-6">
              <span className="text-gray-400 font-medium mr-4">{t.follow}</span>
              <a
                href="https://www.facebook.com/oroboats/"
                className="text-gray-400 hover:text-gold transition-colors duration-300"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/oroboats"
                className="text-gray-400 hover:text-gold transition-colors duration-300"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
