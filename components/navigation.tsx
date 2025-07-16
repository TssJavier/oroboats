"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, Globe } from "lucide-react"
import { useApp } from "@/components/providers"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { OroLoading, useNavigationLoading } from "@/components/ui/oro-loading"
import { useRouter } from "next/navigation"
import Image from "next/image"

const translations = {
  es: {
    home: "Inicio",
    boats: "Flota",
    blog: "Blog", // ✅ NUEVO: Traducción para Blog
  },
  en: {
    home: "Home",
    boats: "Fleet",
    blog: "Blog", // ✅ NUEVO: Traducción para Blog
  },
}

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { language, setLanguage } = useApp()
  const { isLoading, startLoading, stopLoading } = useNavigationLoading()
  const router = useRouter()
  const t = translations[language]

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleNavigation = (href: string) => {
    startLoading()
    setTimeout(() => {
      router.push(href)
      setTimeout(() => {
        stopLoading()
        setIsOpen(false)
      }, 500)
    }, 1500)
  }

  const handleLogoClick = () => {
    startLoading()
    setTimeout(() => {
      router.push("/")
      setTimeout(() => {
        stopLoading()
      }, 500)
    }, 1500)
  }

  if (isLoading) {
    return <OroLoading />
  }

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm" : "bg-white"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Tamaño reducido y contenido en el header */}
          <button onClick={handleLogoClick} className="flex items-center group cursor-pointer">
            <div className="relative h-8 w-auto flex items-center">
              <Image
                src="/assets/negro.png"
                alt="OroBoats Logo"
                width={80}
                height={32}
                className="object-contain group-hover:scale-105 transition-transform duration-300"
                priority
              />
            </div>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => handleNavigation("/")}
              className="text-black hover:text-gold transition-colors duration-300 font-medium"
            >
              {t.home}
            </button>
            <button
              onClick={() => handleNavigation("/boats")}
              className="text-black hover:text-gold transition-colors duration-300 font-medium"
            >
              {t.boats}
            </button>
            {/* ✅ NUEVO: Enlace al Blog */}
            <button
              onClick={() => handleNavigation("/blog")}
              className="text-black hover:text-gold transition-colors duration-300 font-medium"
            >
              {t.blog}
            </button>

            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-black hover:text-gold hover:bg-gray-50">
                  <Globe className="h-4 w-4 mr-2" />
                  {language.toUpperCase()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white border-gray-200">
                <DropdownMenuItem onClick={() => setLanguage("es")} className="text-black hover:bg-gray-50">
                  Español
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("en")} className="text-black hover:bg-gray-50">
                  English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)} className="text-black hover:text-gold">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <button
                onClick={() => handleNavigation("/")}
                className="block w-full text-left px-3 py-2 text-black hover:text-gold transition-colors"
              >
                {t.home}
              </button>
              <button
                onClick={() => handleNavigation("/boats")}
                className="block w-full text-left px-3 py-2 text-black hover:text-gold transition-colors"
              >
                {t.boats}
              </button>
              {/* ✅ NUEVO: Enlace al Blog en móvil */}
              <button
                onClick={() => handleNavigation("/blog")}
                className="block w-full text-left px-3 py-2 text-black hover:text-gold transition-colors"
              >
                {t.blog}
              </button>

              {/* Language selector for mobile */}
              <div className="px-3 py-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-black hover:text-gold hover:bg-gray-50 w-full justify-start"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      {language.toUpperCase()}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white border-gray-200">
                    <DropdownMenuItem onClick={() => setLanguage("es")} className="text-black hover:bg-gray-50">
                      Español
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLanguage("en")} className="text-black hover:bg-gray-50">
                      English
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
