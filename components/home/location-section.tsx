"use client"

import { MapPin, Clock, Phone } from "lucide-react"
import { useApp } from "@/components/providers"

const translations = {
  es: {
    title: "Ubicación Exclusiva",
    subtitle: "Encuéntranos en el puerto más prestigioso de la costa",
    address: "Puerto Deportivo Marina Premium",
    location: "Muelle VIP 15, Valencia",
    hours: "Abierto todos los días: 9:00 - 21:00",
    phone: "+34 123 456 789",
  },
  en: {
    title: "Exclusive Location",
    subtitle: "Find us at the most prestigious marina on the coast",
    address: "Marina Premium Sports Port",
    location: "VIP Dock 15, Valencia",
    hours: "Open every day: 9:00 AM - 9:00 PM",
    phone: "+34 123 456 789",
  },
}

export function LocationSection() {
  const { language } = useApp()
  const t = translations[language]

  return (
    <section className="py-24 bg-gradient-to-b from-gray-900 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-playfair font-bold text-white mb-6">{t.title}</h2>
          <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto">{t.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="flex items-start space-x-4 group">
              <div className="w-12 h-12 bg-gradient-to-r from-gold to-yellow-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <MapPin className="h-6 w-6 text-black" />
              </div>
              <div>
                <h3 className="text-2xl font-playfair font-semibold text-white mb-2">{t.address}</h3>
                <p className="text-white/70 text-lg">{t.location}</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 group">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-playfair font-semibold text-white mb-2">Horarios</h3>
                <p className="text-white/70 text-lg">{t.hours}</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 group">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-playfair font-semibold text-white mb-2">Contacto VIP</h3>
                <p className="text-white/70 text-lg">{t.phone}</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="bg-gradient-to-br from-gold/20 to-yellow-500/20 rounded-2xl p-8 h-96 flex items-center justify-center border border-gold/30">
              <div className="text-center text-white/60">
                <MapPin className="h-16 w-16 mx-auto mb-4 text-gold" />
                <p className="text-xl font-playfair">Mapa Interactivo</p>
                <p className="text-sm mt-2">(Integración con Google Maps)</p>
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-gold rounded-full animate-pulse"></div>
            <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-gold/60 rounded-full animate-ping"></div>
          </div>
        </div>
      </div>
    </section>
  )
}
