"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap, Ship, Star } from "lucide-react"
import Link from "next/link"
import { useApp } from "@/components/providers"

const translations = {
  es: {
    title: "Nuestros Servicios",
    subtitle: "Todo lo que necesitas para una experiencia perfecta en el mar",
    boats: {
      title: "Flota de Lujo",
      description: "Barcos premium con acabados de primera clase",
      action: "Ver Flota",
    },
    jetskis: {
      title: "Motos Exclusivas",
      description: "Motos de agua de alta gama para experiencias llenas de adrenalina",
      action: "Explorar",
    },
    booking: {
      title: "Reserva Fácil",
      description: "Sistema de reservas simple y rápido con atención personalizada",
      action: "Reservar",
    },
  },
  en: {
    title: "Our Services",
    subtitle: "Everything you need for a perfect experience at sea",
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
      title: "Easy Booking",
      description: "Simple and fast booking system with personalized attention",
      action: "Book Now",
    },
  },
}

export function ServicesSection() {
  const { language } = useApp()
  const t = translations[language]

  const services = [
    {
      icon: Ship,
      title: t.boats.title,
      description: t.boats.description,
      action: t.boats.action,
      href: "/boats?type=boats",
    },
    {
      icon: Zap,
      title: t.jetskis.title,
      description: t.jetskis.description,
      action: t.jetskis.action,
      href: "/boats?type=jetskis",
    },
    {
      icon: Star,
      title: t.booking.title,
      description: t.booking.description,
      action: t.booking.action,
      href: "/boats",
    },
  ]

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-6">{t.title}</h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">{t.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {services.map((service, index) => (
            <Card
              key={index}
              className="bg-white border border-gray-200 hover:border-gold hover:shadow-lg transition-all duration-300 group"
            >
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gold transition-colors duration-300">
                  <service.icon className="h-6 w-6 text-black group-hover:text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-black group-hover:text-gold transition-colors">
                  {service.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-gray-600 mb-6 leading-relaxed">{service.description}</CardDescription>
                <Button
                  asChild
                  className="w-full bg-black text-white hover:bg-gold hover:text-black transition-all duration-300 font-medium"
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
