"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { OroLoading } from "@/components/ui/oro-loading"
import { useRouter } from "next/navigation"
import { useApp } from "@/components/providers"
import { ChevronDown, Play } from "lucide-react"

const translations = {
  es: {
    title: "Todo es para",
    titleHighlight: "navegar más",
    description: "Descubre la elegancia en cada ola con nuestra flota premium de barcos y motos de agua de lujo.",
    rentNow: "Alquilar Ahora",
    scroll: "Descubre más",
    loadingRent: "Preparando experiencias de alquiler...",
  },
  en: {
    title: "Everything is to",
    titleHighlight: "sail more",
    description: "Discover elegance in every wave with our premium fleet of luxury boats and jet skis.",
    rentNow: "Rent Now",
    scroll: "Discover more",
    loadingRent: "Preparing rental experiences...",
  },
}

export function HeroSection() {
  const { language } = useApp()
  const t = translations[language]
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleNavigation = () => {
    setLoading(true)
    setTimeout(() => {
      router.push("/boats")
      setTimeout(() => setLoading(false), 500)
    }, 1500)
  }

  if (loading) {
    return <OroLoading />
  }

  return (
    <section className="relative min-h-screen bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        {/* Mobile layout: stacked video → text → buttons → logos */}
        <div className="flex flex-col lg:hidden items-center text-center">
          {/* Video Circle */}
          <div className="relative w-full max-w-xs mb-10 mt-6">
            <div className="relative aspect-square rounded-full overflow-hidden bg-blue-100">
              {/* Decorative elements */}
              <div className="absolute inset-0">
                <div className="absolute top-1/4 left-1/4 w-1/3 h-1/2 bg-gradient-to-br from-gold to-yellow-400 rounded-full transform -rotate-12 opacity-90"></div>
                <div className="absolute top-1/3 right-1/4 w-1/4 h-1/3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full transform rotate-45 opacity-80"></div>
                <div className="absolute bottom-1/4 left-1/3 w-1/3 h-1/4 bg-gradient-to-br from-gold/70 to-yellow-300 rounded-full transform rotate-12 opacity-85"></div>
              </div>

              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/80 backdrop-blur-sm rounded-full p-4 hover:bg-black/90 transition-all duration-300 cursor-pointer group">
                  <Play
                    className="h-8 w-8 text-white ml-1 group-hover:scale-110 transition-transform duration-300"
                    fill="currentColor"
                  />
                </div>
              </div>

              {/* Video element - uncomment when ready */}
              {/* 
              <video 
                className="w-full h-full object-cover rounded-full"
                controls
                poster="/placeholder.svg?height=400&width=400"
              >
                <source src="/path-to-your-video.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              */}
            </div>
          </div>

          {/* Text Content */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2 leading-tight">{t.title}</h1>
            <h2 className="text-4xl font-bold text-gold mb-6">{t.titleHighlight}</h2>
            <p className="text-lg text-gray-600 mb-8">{t.description}</p>
          </div>

          {/* Buttons */}
          <div className="flex justify-center mb-16 w-full max-w-md">
            <Button
              size="lg"
              onClick={handleNavigation}
              className="bg-gold hover:bg-yellow-300 text-black font-semibold text-lg px-8 py-3 rounded-lg transition-all duration-300 w-full max-w-xs"
            >
              {t.rentNow}
            </Button>
          </div>

          {/* Partner Logos */}
          <div className="flex justify-center items-center space-x-6 opacity-40">
            <div className="text-gray-400 font-semibold text-sm">Yamaha</div>
            <div className="text-gray-400 font-semibold text-sm">Sea-Doo</div>
            <div className="text-gray-400 font-semibold text-sm">Boston</div>
          </div>
        </div>

        {/* Desktop layout: two columns */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-20 items-center min-h-[70vh]">
          {/* Left Column - Video/Graphic */}
          <div className="relative">
            <div className="relative aspect-square max-w-md">
              {/* Circular video container */}
              <div className="relative w-full h-full rounded-full overflow-hidden bg-blue-100">
                {/* Decorative elements */}
                <div className="absolute inset-0">
                  <div className="absolute top-1/4 left-1/4 w-1/3 h-1/2 bg-gradient-to-br from-gold to-yellow-400 rounded-full transform -rotate-12 opacity-90"></div>
                  <div className="absolute top-1/3 right-1/4 w-1/4 h-1/3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full transform rotate-45 opacity-80"></div>
                  <div className="absolute bottom-1/4 left-1/3 w-1/3 h-1/4 bg-gradient-to-br from-gold/70 to-yellow-300 rounded-full transform rotate-12 opacity-85"></div>
                </div>

                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/80 backdrop-blur-sm rounded-full p-4 hover:bg-black/90 transition-all duration-300 cursor-pointer group">
                    <Play
                      className="h-8 w-8 text-white ml-1 group-hover:scale-110 transition-transform duration-300"
                      fill="currentColor"
                    />
                  </div>
                </div>

                {/* Video element - uncomment when ready */}
                {/* 
                <video 
                  className="w-full h-full object-cover rounded-full"
                  controls
                  poster="/placeholder.svg?height=400&width=400"
                >
                  <source src="/path-to-your-video.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                */}
              </div>
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="text-left">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-2 leading-tight">{t.title}</h1>
            <h2 className="text-5xl lg:text-6xl font-bold text-gold mb-6">{t.titleHighlight}</h2>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-lg">{t.description}</p>

            {/* Buttons */}
            <div className="flex justify-start">
              <Button
                size="lg"
                onClick={handleNavigation}
                className="bg-gold hover:bg-yellow-300 text-black font-semibold text-lg px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                {t.rentNow}
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop Partner Logos */}
        <div className="hidden lg:flex justify-center items-center space-x-8 opacity-40 mt-20">
          <div className="text-gray-400 font-semibold">Yamaha</div>
          <div className="text-gray-400 font-semibold">Sea-Doo</div>
          <div className="text-gray-400 font-semibold">Boston Whaler</div>
          <div className="text-gray-400 font-semibold">Beneteau</div>
        </div>
      </div>

      {/* Scroll indicator - simplified */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="flex flex-col items-center text-gray-400 cursor-pointer group">
          <ChevronDown className="h-6 w-6 animate-bounce text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
        </div>
      </div>
    </section>
  )
}
