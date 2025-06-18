"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { OroLoading } from "@/components/ui/oro-loading"
import { useRouter } from "next/navigation"
import { useApp } from "@/components/providers"
import { ChevronDown } from "lucide-react"

const translations = {
  es: {
    title: "", // ❌ ELIMINADO "Atrévete a"
    titleHighlights: ["Sé diferente", "Be genuine", "Sii diverso", "كن مختلفا", "Soyez différent", "달라지다"], // ✅ NUEVOS TEXTOS
    //description: "Descubre la elegancia en cada ola con nuestra flota de barcos y motos de agua.",
    rentNow: "RESERVA AHORA",
    scroll: "Descubre más",
    loadingRent: "Preparando experiencias de alquiler...",
  },
  en: {
    title: "", // ❌ ELIMINADO "Dare to"
    titleHighlights: ["Sé diferente", "Be genuine", "Sii diverso", "كن مختلفا", "Soyez différent", "달라지다"], // ✅ NUEVOS TEXTOS
    //description: "Discover elegance in every wave with our fleet of luxury boats and jet skis.",
    rentNow: "RENT NOW",
    scroll: "Discover more",
    loadingRent: "Preparing rental experiences...",
  },
}

export function HeroSection() {
  const { language } = useApp()
  const t = translations[language]
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentHighlightIndex, setCurrentHighlightIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // 🎯 CONTROLA EL ZOOM DEL VIDEO AQUÍ
  const VIDEO_ZOOM_SCALE = 1

  const handleNavigation = () => {
    setLoading(true)
    setTimeout(() => {
      router.push("/boats")
      setTimeout(() => setLoading(false), 500)
    }, 1500)
  }

  // Auto-start video when component mounts
  useEffect(() => {
    if (videoRef.current) {
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch((error) => {
            console.log("Video autoplay failed:", error)
          })
        }
      }, 500)
    }
  }, [])

  // ✨ EFECTO TYPEWRITER LETRA POR LETRA - MÁS RÁPIDO
  useEffect(() => {
    const currentPhrase = t.titleHighlights[currentHighlightIndex]
    let currentIndex = 0
    setIsTyping(true)
    setDisplayedText("")

    // Escribir letra por letra MÁS RÁPIDO
    const typeInterval = setInterval(() => {
      if (currentIndex < currentPhrase.length) {
        setDisplayedText(currentPhrase.slice(0, currentIndex + 1))
        currentIndex++
      } else {
        clearInterval(typeInterval)
        setIsTyping(false)

        // Esperar MENOS tiempo antes de cambiar a la siguiente frase
        setTimeout(() => {
          setCurrentHighlightIndex((prev) => (prev + 1) % t.titleHighlights.length)
        }, 800) // ⚡ Reducido de 2000ms a 800ms
      }
    }, 60) // ⚡ Reducido de 100ms a 60ms por letra

    return () => clearInterval(typeInterval)
  }, [currentHighlightIndex, t.titleHighlights])

  if (loading) {
    return <OroLoading />
  }

  return (
    <section className="relative min-h-screen bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        {/* Mobile layout: stacked video → text → buttons → logos */}
        <div className="flex flex-col lg:hidden items-center text-center">
          {/* Video Circle */}
          <div className="relative w-full max-w-sm mb-10 mt-10">
            <div className="relative aspect-square rounded-full overflow-hidden bg-blue-100 shadow-2xl">
              <video
                ref={videoRef}
                className="absolute top-1/2 left-1/2 object-cover rounded-full"
                style={{
                  width: `${VIDEO_ZOOM_SCALE * 100}%`,
                  height: `${VIDEO_ZOOM_SCALE * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
                muted
                autoPlay
                loop
                playsInline
                poster="/placeholder.svg?height=500&width=500"
              >
                <source src="/assets/videooroboats2.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <div className="absolute inset-0 bg-black/10 rounded-full"></div>
            </div>
          </div>

          {/* Text Content */}
          <div className="mb-8 mt-2">
            {/* ❌ ELIMINADO: <h1 className="text-4xl font-bold text-gray-900 mb-2 leading-tight">{t.title}</h1> */}
            <div className="relative h-16 flex items-center justify-center">
              <h2 className="text-4xl font-black italic font-roboto text-black mb-6">{displayedText}</h2>
            </div>
            {/*<p className="text-lg text-gray-600 mb-8">{t.description}</p>*/}
          </div>

          {/* Buttons */}
          <div className="flex justify-center mb-16 w-full max-w-md">
            <Button
              size="lg"
              onClick={handleNavigation}
              className="bg-gold hover:bg-yellow-300 text-black font-bold font-roboto text-lg px-8 py-3 rounded-lg transition-all duration-300 w-full max-w-xs"
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
          {/* Left Column - Video */}
          <div className="relative">
            <div className="relative aspect-square max-w-lg mx-auto">
              <div className="relative w-full h-full rounded-full overflow-hidden bg-blue-100 shadow-2xl">
                <video
                  ref={videoRef}
                  className="absolute top-1/2 left-1/2 object-cover rounded-full"
                  style={{
                    width: `${VIDEO_ZOOM_SCALE * 100}%`,
                    height: `${VIDEO_ZOOM_SCALE * 100}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  muted
                  autoPlay
                  loop
                  playsInline
                  poster="/placeholder.svg?height=600&width=600"
                >
                  <source src="/assets/videooroboats2.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <div className="absolute inset-0 bg-black/10 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="text-left">
            {/* ❌ ELIMINADO: <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-2 leading-tight">{t.title}</h1> */}
            <div className="relative h-20 flex items-center mt-2">
              <h2 className="text-5xl lg:text-6xl font-black italic font-roboto text-black mb-6">{displayedText}</h2>
            </div>

            {/*<p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-lg">{t.description}</p>*/}

            {/* Buttons */}
            <div className="flex justify-start">
              <Button
                size="lg"
                onClick={handleNavigation}
                className="bg-gold hover:bg-yellow-300 text-black font-bold font-roboto text-lg px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
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

      {/* Scroll indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="flex flex-col items-center text-gray-400 cursor-pointer group">
          <ChevronDown className="h-6 w-6 animate-bounce text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
        </div>
      </div>
    </section>
  )
}
