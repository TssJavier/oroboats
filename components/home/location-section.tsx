"use client"

import { MapPin, Clock, Phone, ExternalLink } from "lucide-react"
import { useApp } from "@/components/providers"
import Image from "next/image"

const translations = {
  es: {
    title: "Ubicación Exclusiva",
    subtitle: "Encuéntranos en el puerto más prestigioso de la costa",
    address: "Paseo Andrés Segovia, 62",
    location: "La herradura, Granada",
    hours: "Abierto todos los días: 9:00 - 21:00",
    phone: "+34 655 52 79 88",
    openInMaps: "Abrir en Google Maps",
    clickToOpen: "Haz clic para abrir en Google Maps",
  },
  en: {
    title: "Exclusive Location",
    subtitle: "Find us at the most prestigious marina on the coast",
    address: "Paseo Andrés Segovia, 62",
    location: "La herradura, Granada",
    hours: "Open every day: 9:00 AM - 9:00 PM",
    phone: "+34 655 52 79 88",
    openInMaps: "Open in Google Maps",
    clickToOpen: "Click to open in Google Maps",
  },
}

export function LocationSection() {
  const { language } = useApp()
  const t = translations[language]

  const openInGoogleMaps = () => {
    window.open(
      "https://maps.google.com/?q=Paseo+Andrés+Segovia+62+La+Herradura+Granada",
      "_blank",
      "noopener,noreferrer",
    )
  }

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-6">{t.title}</h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">{t.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center">
                <MapPin className="h-6 w-6 text-black" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-black mb-2">{t.address}</h3>
                <p className="text-gray-600">{t.location}</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-black" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-black mb-2">Horarios</h3>
                <p className="text-gray-600">{t.hours}</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Phone className="h-6 w-6 text-black" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-black mb-2">Contacto</h3>
                <p className="text-gray-600">{t.phone}</p>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={openInGoogleMaps}
                className="inline-flex items-center px-6 py-3 bg-gold hover:bg-yellow-500 text-black font-medium rounded-lg transition-colors duration-200"
              >
                <ExternalLink className="h-5 w-5 mr-2" />
                {t.openInMaps}
              </button>
            </div>
          </div>

          {/* ✅ IMAGEN ESTÁTICA CLICKEABLE */}
          <div className="relative">
            <div
              className="h-96 rounded-lg border border-gray-200 overflow-hidden shadow-sm cursor-pointer group relative"
              onClick={openInGoogleMaps}
            >
              <Image
                src="/assets/sitio.png"
                alt="Ubicación OroBoats - Paseo Andrés Segovia, 62, La Herradura, Granada"
                fill
                className="object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 50vw"
              />

              {/* Overlay con efecto hover */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg flex items-center justify-center transition-all duration-300">
                <div className="bg-white bg-opacity-0 group-hover:bg-opacity-95 rounded-lg px-4 py-2 transition-all duration-300">
                  <div className="flex items-center text-sm font-medium text-black opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t.clickToOpen}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
