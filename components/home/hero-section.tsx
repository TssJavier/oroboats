"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, ChevronDown } from "lucide-react"
import Link from "next/link"
import { useApp } from "@/components/providers"

const translations = {
  es: {
    title: "Lujo en el Mar",
    subtitle: "Experiencias Exclusivas",
    description: "Descubre la elegancia en cada ola con nuestra flota premium de barcos y motos de agua de lujo.",
    rentNow: "Alquila Ahora",
    buyNow: "Comprar",
    parties: "Fiestas VIP",
    scroll: "Descubre más",
  },
  en: {
    title: "Luxury at Sea",
    subtitle: "Exclusive Experiences",
    description: "Discover elegance in every wave with our premium fleet of luxury boats and jet skis.",
    rentNow: "Rent Now",
    buyNow: "Buy Now",
    parties: "VIP Parties",
    scroll: "Discover more",
  },
}

export function HeroSection() {
  const { language } = useApp()
  const t = translations[language]

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>

      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-2 h-2 bg-gold rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-gold/60 rounded-full animate-ping"></div>
        <div className="absolute bottom-40 left-20 w-1.5 h-1.5 bg-gold/80 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 right-10 w-2 h-2 bg-gold/40 rounded-full animate-ping delay-500"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-8 animate-fade-in">
          <div className="h-16 w-16 text-gold mx-auto mb-6 animate-pulse">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-playfair font-bold text-white mb-4 animate-slide-up">
          {t.title}
        </h1>

        <h2 className="text-2xl md:text-4xl lg:text-5xl font-playfair text-gold mb-8 animate-slide-up delay-200">
          {t.subtitle}
        </h2>

        <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-4xl mx-auto leading-relaxed animate-slide-up delay-400">
          {t.description}
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-slide-up delay-600 mb-25">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-gold to-yellow-500 text-black font-bold text-lg px-8 py-4 hover:from-yellow-500 hover:to-gold transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-gold/25"
          >
            <Link href="/boats">
              {t.rentNow}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>

          <Button
            asChild
            size="lg"
            className="bg-white text-black font-bold text-lg px-8 py-4 hover:bg-gray-100 transition-all duration-500 transform hover:scale-105 border-2 border-white hover:border-gold"
          >
            <Link href="/boats?type=sale">{t.buyNow}</Link>
          </Button>

          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg px-8 py-4 hover:from-purple-700 hover:to-pink-700 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25"
          >
            <Link href="/fiestas">{t.parties}</Link>
          </Button>
        </div>

        {/* Scroll indicator - mejorado */}
        <div className="absolute bottom-18 left-1/2 transform -translate-x-1/2 mt-10">
          <div className="flex flex-col items-center text-white/60 cursor-pointer group">
            <span className="text-sm mb-3 group-hover:text-gold transition-colors duration-300">{t.scroll}</span>
            <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center group-hover:border-gold/50 transition-colors duration-300">
              <div className="w-1 h-3 bg-gold rounded-full mt-2 animate-bounce"></div>
            </div>
            <ChevronDown className="h-5 w-5 mt-2 animate-bounce text-gold/70" />
          </div>
        </div>
      </div>
    </section>
  )
}
