"use client"

import { MapPin, Clock, Phone } from 'lucide-react'
import { useApp } from "@/components/providers"

const translations = {
  es: {
    title: "Ubicación Exclusiva",
    subtitle: "Encuéntranos en el puerto más prestigioso de la costa",
    address: "Paseo Andrés Segovia, 62",
    location: "La herradura, Granada",
    hours: "Abierto todos los días: 9:00 - 21:00",
    phone: "+34 655 52 79 88",
  },
  en: {
    title: "Exclusive Location",
    subtitle: "Find us at the most prestigious marina on the coast",
    address: "Paseo Andrés Segovia, 62",
    location: "La herradura, Granada",
    hours: "Open every day: 9:00 AM - 9:00 PM",
    phone: "+34 655 52 79 88",
  },
}

export function LocationSection() {
  const { language } = useApp()
  const t = translations[language]

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
          </div>

          <div className="relative">
            <div className="h-96 rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3197.3831137595275!2d-3.7498650246999996!3d36.73737417123954!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd7227f6e8188561%3A0x62d3e3e8c5ffe44e!2sP.%C2%BA%20Andr%C3%A9s%20Segovia%2C%2062%2C%2018697%20La%20Herradura%2C%20Granada!5e0!3m2!1ses!2ses!4v1748376175251!5m2!1ses!2ses" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}