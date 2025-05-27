"use client"

import Link from "next/link"
import { Facebook, Instagram, Twitter, Youtube, Ship, Mail, Phone } from "lucide-react"
import { useApp } from "@/components/providers"

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

  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Ship className="h-6 w-6 text-gold" />
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
                <span className="text-gray-300">+34 643 44 23 64</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6 text-white">{t.company}</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-gold transition-colors duration-300">
                  {t.about}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-gold transition-colors duration-300">
                  {t.contact}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-gold transition-colors duration-300">
                  {t.privacy}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-gold transition-colors duration-300">
                  {t.terms}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6 text-white">{t.services}</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/boats?type=boats" className="text-gray-400 hover:text-gold transition-colors duration-300">
                  {t.boats}
                </Link>
              </li>
              <li>
                <Link
                  href="/boats?type=jetskis"
                  className="text-gray-400 hover:text-gold transition-colors duration-300"
                >
                  {t.jetskis}
                </Link>
              </li>
              <li>
                <Link href="/fiestas" className="text-gray-400 hover:text-gold transition-colors duration-300">
                  {t.parties}
                </Link>
              </li>
              <li>
                <Link href="/boats" className="text-gray-400 hover:text-gold transition-colors duration-300">
                  {t.booking}
                </Link>
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
              <a href="#" className="text-gray-400 hover:text-gold transition-colors duration-300">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gold transition-colors duration-300">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gold transition-colors duration-300">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gold transition-colors duration-300">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
