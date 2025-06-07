"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { OroLoading } from "@/components/ui/oro-loading"
import { useRouter } from "next/navigation"
import { useApp } from "@/components/providers"
import { ArrowRight, ChevronDown, Anchor } from "lucide-react"

const translations = {
  es: {
    title: "Lujo en el Mar",
    subtitle: "Experiencias Exclusivas",
    description: "Descubre la elegancia en cada ola con nuestra flota premium de barcos y motos de agua de lujo.",
    rentNow: "Alquila Ahora",
    buyNow: "Comprar",
    parties: "Fiestas VIP",
    scroll: "Descubre más",
    loadingRent: "Preparando experiencias de alquiler...",
    loadingBuy: "Explorando opciones de compra...",
    loadingParties: "Organizando fiestas VIP...",
  },
  en: {
    title: "Luxury at Sea",
    subtitle: "Exclusive Experiences",
    description: "Discover elegance in every wave with our premium fleet of luxury boats and jet skis.",
    rentNow: "Rent Now",
    buyNow: "Buy Now",
    parties: "VIP Parties",
    scroll: "Discover more",
    loadingRent: "Preparing rental experiences...",
    loadingBuy: "Exploring purchase options...",
    loadingParties: "Organizing VIP parties...",
  },
}

export function HeroSection() {
  const { language } = useApp()
  const t = translations[language]
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")

  const handleNavigation = (href: string, message: string) => {
    setLoadingMessage(message)
    setLoading(true)

    // Simular tiempo de carga para mostrar la animación
    setTimeout(() => {
      router.push(href)
      // El loading se ocultará cuando la nueva página se cargue
      setTimeout(() => setLoading(false), 500)
    }, 1500)
  }

  if (loading) {
    return <OroLoading />
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with white overlay */}
      <div className="absolute inset-0 bg-white"></div>

      {/* Animated background elements - removed for clean look */}

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-8 animate-fade-in">
          <Anchor className="h-16 w-16 text-gold mx-auto mb-6 animate-pulse" />
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-playfair font-bold text-black mb-4 animate-slide-up">
          {t.title}
        </h1>

        <h2 className="text-2xl md:text-4xl lg:text-5xl font-playfair text-gold mb-8 animate-slide-up delay-200">
          {t.subtitle}
        </h2>

        <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed animate-slide-up delay-400">
          {t.description}
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-slide-up delay-600 mb-25">
          <Button
            size="lg"
            onClick={() => handleNavigation("/boats", t.loadingRent)}
            className="bg-black text-white font-bold text-lg px-8 py-4 hover:bg-gold hover:text-black transition-all duration-500 transform hover:scale-105"
          >
            {t.rentNow}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          <Button
            size="lg"
            onClick={() => handleNavigation("/boats?type=sale", t.loadingBuy)}
            className="bg-white text-black font-bold text-lg px-8 py-4 hover:bg-black hover:text-white transition-all duration-500 transform hover:scale-105 border-2 border-black"
          >
            {t.buyNow}
          </Button>

          <Button
            size="lg"
            onClick={() => handleNavigation("/fiestas", t.loadingParties)}
            className="bg-white text-gray-600 font-bold text-lg px-8 py-4 hover:bg-gold hover:text-black transition-all duration-500 transform hover:scale-105 border-2 border-gray-300 hover:border-gold"
          >
            {t.parties}
          </Button>
        </div>

        {/* Scroll indicator - mejorado */}
        <div className="absolute bottom-18 left-1/2 transform -translate-x-1/2 mt-10">
          <div className="flex flex-col items-center text-gray-400 cursor-pointer group">
            <span className="text-sm mb-3 group-hover:text-gold transition-colors duration-300">{t.scroll}</span>
            <div className="w-6 h-10 border-2 border-gray-300 rounded-full flex justify-center group-hover:border-gold transition-colors duration-300">
              <div className="w-1 h-3 bg-gold rounded-full mt-2 animate-bounce"></div>
            </div>
            <ChevronDown className="h-5 w-5 mt-2 animate-bounce text-gold" />
          </div>
        </div>
      </div>
    </section>
  )
}
