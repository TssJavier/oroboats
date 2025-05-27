"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, User, Globe, Ship } from "lucide-react"
import { useApp } from "@/components/providers"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const translations = {
  es: {
    home: "Inicio",
    boats: "Flota",
    profile: "Perfil",
    login: "Acceder",
    register: "Registro",
    logout: "Cerrar Sesión",
  },
  en: {
    home: "Home",
    boats: "Fleet",
    profile: "Profile",
    login: "Sign In",
    register: "Sign Up",
    logout: "Sign Out",
  },
}

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { language, setLanguage, user, setUser } = useApp()
  const t = translations[language]

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? "bg-black/95 backdrop-blur-md border-b border-gold/20" : "bg-transparent"
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center space-x-2 group">
            <Ship className="h-8 w-8 text-gold transition-transform group-hover:scale-110" />
            <span className="text-2xl font-playfair font-bold text-white">
              Oro<span className="text-gold">Boats</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-white/80 hover:text-gold transition-all duration-300 font-medium relative group"
            >
              {t.home}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link
              href="/boats"
              className="text-white/80 hover:text-gold transition-all duration-300 font-medium relative group"
            >
              {t.boats}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold transition-all duration-300 group-hover:w-full"></span>
            </Link>
            {user && (
              <Link
                href="/profile"
                className="text-white/80 hover:text-gold transition-all duration-300 font-medium relative group"
              >
                {t.profile}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold transition-all duration-300 group-hover:w-full"></span>
              </Link>
            )}

            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white/80 hover:text-gold hover:bg-white/10">
                  <Globe className="h-4 w-4 mr-2" />
                  {language.toUpperCase()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-black/95 border-gold/20">
                <DropdownMenuItem onClick={() => setLanguage("es")} className="text-white hover:bg-gold/20">
                  Español
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("en")} className="text-white hover:bg-gold/20">
                  English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white/80 hover:text-gold hover:bg-white/10">
                    <User className="h-4 w-4 mr-2" />
                    {user.name}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-black/95 border-gold/20">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="text-white hover:bg-gold/20">
                      {t.profile}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setUser(null)} className="text-white hover:bg-gold/20">
                    {t.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/80 hover:text-gold hover:bg-white/10 transition-all duration-300"
                >
                  {t.login}
                </Button>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-gold to-yellow-500 text-black font-semibold hover:from-yellow-500 hover:to-gold transition-all duration-300 transform hover:scale-105"
                >
                  {t.register}
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)} className="text-white hover:text-gold">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-md border-t border-gold/20">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                href="/"
                className="block px-3 py-2 text-white/80 hover:text-gold transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {t.home}
              </Link>
              <Link
                href="/boats"
                className="block px-3 py-2 text-white/80 hover:text-gold transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {t.boats}
              </Link>
              {user && (
                <Link
                  href="/profile"
                  className="block px-3 py-2 text-white/80 hover:text-gold transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {t.profile}
                </Link>
              )}
              {!user && (
                <div className="flex flex-col space-y-2 px-3 pt-2">
                  <Button variant="ghost" size="sm" className="text-white/80 hover:text-gold justify-start">
                    {t.login}
                  </Button>
                  <Button size="sm" className="bg-gradient-to-r from-gold to-yellow-500 text-black font-semibold">
                    {t.register}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
