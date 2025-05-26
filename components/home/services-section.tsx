"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap, Shield, Crown, Star } from "lucide-react"
import Link from "next/link"
import { useApp } from "@/components/providers"

const translations = {
  es: {
    title: "Servicios Premium",
    subtitle: "Excelencia en cada detalle para una experiencia inolvidable",
    boats: {
      title: "Flota de Lujo",
      description: "Barcos premium con acabados de primera clase y tecnología de vanguardia",
      action: "Ver Flota",
    },
    jetskis: {
      title: "Motos Exclusivas",
      description: "Motos de agua de alta gama para experiencias llenas de adrenalina",
      action: "Explorar",
    },
    booking: {
      title: "Reserva VIP",
      description: "Sistema de reservas premium con atención personalizada 24/7",
      action: "Reservar",
    },
    safety: {
      title: "Seguridad Total",
      description: "Equipos certificados y seguros premium incluidos en todos los servicios",
      action: "Más Info",
    },
  },
  en: {
    title: "Premium Services",
    subtitle: "Excellence in every detail for an unforgettable experience",
    boats: {
      title: "Luxury Fleet",
      description: "Premium boats with first-class finishes and cutting-edge technology",
      action: "View Fleet",
    },
    jetskis: {
      title: "Exclusive Jet Skis",
      description: "High-end jet skis for adrenaline-filled experiences",
      action: "Explore",
    },
    booking: {
      title: "VIP Booking",
      description: "Premium booking system with personalized 24/7 attention",
      action: "Book Now",
    },
    safety: {
      title: "Total Safety",
      description: "Certified equipment and premium insurance included in all services",
      action: "More Info",
    },
  },
}

export function ServicesSection() {
  const { language } = useApp()
  const t = translations[language]

  const services = [
    {
      icon: Crown,
      title: t.boats.title,
      description: t.boats.description,
      action: t.boats.action,
      href: "/boats?type=boats",
      gradient: "from-gold to-yellow-500",
    },
    {
      icon: Zap,
      title: t.jetskis.title,
      description: t.jetskis.description,
      action: t.jetskis.action,
      href: "/boats?type=jetskis",
      gradient: "from-orange-500 to-red-500",
    },
    {
      icon: Star,
      title: t.booking.title,
      description: t.booking.description,
      action: t.booking.action,
      href: "/boats",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Shield,
      title: t.safety.title,
      description: t.safety.description,
      action: t.safety.action,
      href: "/safety",
      gradient: "from-green-500 to-emerald-500",
    },
  ]

  return (
    <section className="py-24 bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-playfair font-bold text-white mb-6">{t.title}</h2>
          <p className="text-xl md:text-2xl text-white/70 max-w-4xl mx-auto leading-relaxed">{t.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <Card
              key={index}
              className="bg-black/50 border-white/10 hover:border-gold/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-gold/10 group"
            >
              <CardHeader className="text-center pb-4">
                <div
                  className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${service.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                >
                  <service.icon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-playfair text-white group-hover:text-gold transition-colors">
                  {service.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-white/70 mb-6 leading-relaxed">{service.description}</CardDescription>
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-gold/50 text-gold hover:bg-gold hover:text-black transition-all duration-300 font-semibold"
                >
                  <Link href={service.href}>{service.action}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
