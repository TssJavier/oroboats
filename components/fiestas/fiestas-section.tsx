"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PartyPopper, Users, Music, Calendar, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useApp } from "@/components/providers"

const translations = {
  es: {
    title: "Fiestas VIP en el Mar",
    subtitle: "Organiza la fiesta perfecta en nuestros barcos de lujo",
    discount: "10% DESCUENTO",
    exclusive: "Oferta Especial",
    description:
      "¿Cansado de las fiestas en tierra? Lleva tu celebración al siguiente nivel con nuestros barcos premium. Perfecto para grupos que buscan experiencias únicas.",
    features: {
      title: "¿Por qué elegir nuestras fiestas en barco?",
      items: [
        "Barcos de lujo con sistema de sonido premium",
        "Capacidad para grupos grandes (hasta 8 personas)",
        "Servicio de catering y bebidas incluido",
        "Ubicaciones exclusivas en alta mar",
        "Fotografía profesional incluida",
        "Seguridad y seguros completos",
      ],
    },
    packages: {
      title: "Paquetes Especiales",
      sunset: {
        name: "Sunset Party",
        description: "Fiesta al atardecer con vistas espectaculares",
        duration: "4 horas",
        includes: "DJ, bebidas, catering",
      },
      night: {
        name: "Night Cruise",
        description: "Fiesta nocturna bajo las estrellas",
        duration: "6 horas",
        includes: "DJ, barra libre, cena",
      },
      vip: {
        name: "VIP Experience",
        description: "La experiencia más exclusiva disponible",
        duration: "8 horas",
        includes: "Todo incluido + extras VIP",
      },
    },
    cta: "Reservar con Descuento",
    contact: "Contactar",
  },
  en: {
    title: "VIP Parties at Sea",
    subtitle: "Organize the perfect party on our luxury boats",
    discount: "10% DISCOUNT",
    exclusive: "Special Offer",
    description:
      "Tired of land parties? Take your celebration to the next level with our premium boats. Perfect for groups looking for unique experiences.",
    features: {
      title: "Why choose our boat parties?",
      items: [
        "Luxury boats with premium sound system",
        "Capacity for large groups (up to 20 people)",
        "Catering and drinks service included",
        "Exclusive locations on the high seas",
        "Professional photography included",
        "Complete safety and insurance",
      ],
    },
    packages: {
      title: "Special Packages",
      sunset: {
        name: "Sunset Party",
        description: "Sunset party with spectacular views",
        duration: "4 hours",
        includes: "DJ, drinks, catering",
      },
      night: {
        name: "Night Cruise",
        description: "Night party under the stars",
        duration: "6 hours",
        includes: "DJ, open bar, dinner",
      },
      vip: {
        name: "VIP Experience",
        description: "The most exclusive experience available",
        duration: "8 horas",
        includes: "All inclusive + VIP extras",
      },
    },
    cta: "Book with Discount",
    contact: "Contact",
  },
}

export function FiestasSection() {
  const { language } = useApp()
  const t = translations[language]

  const packages = [
    {
      name: t.packages.sunset.name,
      description: t.packages.sunset.description,
      price: 1800,
      originalPrice: 2000,
      duration: t.packages.sunset.duration,
      includes: t.packages.sunset.includes,
    },
    {
      name: t.packages.night.name,
      description: t.packages.night.description,
      price: 2700,
      originalPrice: 3000,
      duration: t.packages.night.duration,
      includes: t.packages.night.includes,
    },
    {
      name: t.packages.vip.name,
      description: t.packages.vip.description,
      price: 4500,
      originalPrice: 5000,
      duration: t.packages.vip.duration,
      includes: t.packages.vip.includes,
    },
  ]

  return (
    <section className="py-24 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="mb-6 bg-gold text-black font-bold text-lg px-6 py-2">
            <PartyPopper className="h-5 w-5 mr-2" />
            {t.exclusive}
          </Badge>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-6">{t.title}</h1>

          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-8">{t.subtitle}</p>

          <Badge className="bg-red-600 text-white font-bold text-xl px-8 py-3">{t.discount}</Badge>
        </div>

        {/* Description */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <p className="text-lg text-gray-600 leading-relaxed">{t.description}</p>
        </div>

        {/* Features */}
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-black text-center mb-12">{t.features.title}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.features.items.map((feature, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Packages */}
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-black text-center mb-12">{t.packages.title}</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {packages.map((pkg, index) => (
              <Card
                key={index}
                className="bg-white border border-gray-200 hover:border-gold hover:shadow-lg transition-all duration-300 group"
              >
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gold transition-colors duration-300">
                      <Music className="h-8 w-8 text-black" />
                    </div>
                  </div>

                  <CardTitle className="text-2xl font-bold text-black">{pkg.name}</CardTitle>
                  <CardDescription className="text-gray-600">{pkg.description}</CardDescription>
                </CardHeader>

                <CardContent className="text-center">
                  <div className="mb-6">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <span className="text-3xl font-bold text-gold">€{pkg.price}</span>
                      <span className="text-lg text-gray-400 line-through">€{pkg.originalPrice}</span>
                    </div>
                    <p className="text-gray-500 text-sm">{pkg.duration}</p>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center justify-center text-gray-600">
                      <Users className="h-4 w-4 mr-2 text-gold" />
                      <span className="text-sm">{pkg.includes}</span>
                    </div>
                  </div>

                  <Button
                    asChild
                    className="w-full bg-black text-white hover:bg-gold hover:text-black transition-all duration-300 font-medium"
                  >
                    <Link href={`/reservar/fiesta?package=${index}`}>
                      <Calendar className="h-4 w-4 mr-2" />
                      {t.cta}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gray-50 rounded-2xl p-12 border border-gray-200">
          <h3 className="text-3xl font-bold text-black mb-6">¿Listo para la fiesta perfecta?</h3>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-black text-white hover:bg-gold hover:text-black transition-all duration-300 font-medium text-lg px-8 py-4"
            >
              <Link href="/boats">
                {t.cta}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-2 border-black text-black hover:bg-black hover:text-white transition-all duration-300 font-medium text-lg px-8 py-4"
            >
              <Link href="/contact">{t.contact}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
