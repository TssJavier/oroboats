"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PartyPopper, Users, Music, Calendar, ArrowRight, Globe, Download, Star, Heart } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useApp } from "@/components/providers"

const translations = {
  es: {
    title: "Fiestas Épicas en el Mar",
    subtitle: "Organiza la previa perfecta con PreviApp y disfrútala en nuestros barcos",
    heroDescription:
      "Alquila un barco para 6-8 personas por todo el día a precios increíbles y organiza la previa perfecta con PreviApp.",
    whyBoatParties: {
      title: "¿Por qué elegir nuestras fiestas en barco?",
      items: [
        "Experiencia única e inolvidable",
        "Privacidad total para tu grupo",
        "Vistas espectaculares del mar",
        "Perfecto para celebraciones",
        "Fotos increíbles garantizadas",
        "Libertad total para disfrutar",
      ],
    },
    boatInfo: {
      title: "Nuestros Barcos",
      capacity: "6-8 personas",
      duration: "Todo el día",
      price: "Súper económico",
      features: "Sistema de sonido premium y todo lo necesario para tu fiesta perfecta",
    },
    previapp: {
      title: "Organiza con PreviApp",
      subtitle: "La app perfecta para planificar fiestas",
      description:
        "PreviApp es la aplicación líder para organizar previas y fiestas. Coordina con tus amigos y asegúrate de que todo salga perfecto.",
      features: [
        "Organiza eventos fácilmente",
        "Coordina horarios y actividades",
        "Chat grupal integrado",
        "Listas de reproducción colaborativas",
        "Gestión de gastos compartidos",
      ],
      website: "Visita previapp.es",
      download: "Descarga PreviApp",
    },
    cta: {
      title: "La combinación perfecta",
      description: "Usa PreviApp para organizar tu previa y disfrútala en nuestros barcos.",
      contact: "Contactar",
      boats: "Ver Barcos",
    },
  },
  en: {
    title: "Epic Parties at Sea",
    subtitle: "Organize the perfect pre-party with PreviApp and enjoy it on our boats",
    heroDescription:
      "Rent a boat for 6-8 people for the whole day at incredible prices and organize the perfect pre-party with PreviApp.",
    whyBoatParties: {
      title: "Why choose our boat parties?",
      items: [
        "Unique and unforgettable experience",
        "Total privacy for your group",
        "Spectacular sea views",
        "Perfect for celebrations",
        "Amazing photos guaranteed",
        "Total freedom to enjoy",
      ],
    },
    boatInfo: {
      title: "Our Boats",
      capacity: "6-8 people",
      duration: "Full day",
      price: "Super affordable",
      features: "Premium sound system and everything needed for your perfect party",
    },
    previapp: {
      title: "Organize with PreviApp",
      subtitle: "The perfect app for planning parties",
      description:
        "PreviApp is the leading application for organizing pre-parties and events. Coordinate with your friends and make sure everything goes perfectly.",
      features: [
        "Organize events easily",
        "Coordinate schedules and activities",
        "Integrated group chat",
        "Collaborative playlists",
        "Shared expense management",
      ],
      website: "Visit previapp.es",
      download: "Download PreviApp",
    },
    cta: {
      title: "The perfect combination",
      description: "Use PreviApp to organize your pre-party and enjoy it on our boats.",
      contact: "Contact",
      boats: "See Boats",
    },
  },
}

export function FiestasSection() {
  const { language } = useApp()
  const t = translations[language]

  return (
    <section className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          {/*<Badge className="mb-8 bg-gold text-black font-semibold text-lg px-6 py-3 rounded-full shadow-lg">
            <PartyPopper className="h-5 w-5 mr-2" />
            Fiestas Épicas
          </Badge>*/}

          <h1 className="text-5xl md:text-7xl font-bold text-black mb-8 leading-tight">{t.title}</h1>

          <p className="text-xl md:text-2xl text-gray-800 max-w-4xl mx-auto mb-12 leading-relaxed">{t.subtitle}</p>

          <div className="bg-gray-50 rounded-3xl p-8 shadow-lg border border-gray-100 mb-16">
            <p className="text-lg text-gray-700 leading-relaxed">{t.heroDescription}</p>
          </div>
        </div>
      </div>

      {/* Video Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl">
            <video className="w-full h-[600px] object-cover" autoPlay muted loop playsInline>
              <source src="/assets/videooroboats2.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="text-center text-white">
                <h3 className="text-3xl md:text-4xl font-bold mb-4">Descubre Nuestros Barcos</h3>
                <p className="text-xl opacity-90">La aventura perfecta te está esperando</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Boat Parties Section */}
      <div className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">{t.whyBoatParties.title}</h2>
            <div className="w-24 h-1 bg-gold mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {t.whyBoatParties.items.map((feature, index) => (
              <Card
                key={index}
                className="bg-white border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="p-8 text-center">
                  <div className="w-4 h-4 bg-gold rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-800 font-medium leading-relaxed">{feature}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Experience Image Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl">
            <Image
              src="/assets/experiencia.jpg"
              alt="Experiencia en barco"
              width={1200}
              height={600}
              className="w-full h-[500px] object-cover"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="text-center text-white">
                <h3 className="text-3xl md:text-4xl font-bold mb-4">Vive la Experiencia</h3>
                <p className="text-xl opacity-90">Momentos únicos que recordarás para siempre</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Boat Info Section */}
      <div className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">{t.boatInfo.title}</h2>
            <div className="w-24 h-1 bg-gold mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center mb-16">
            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto bg-gold rounded-full flex items-center justify-center">
                <Users className="h-10 w-10 text-white" />
              </div>
              <div>
                <p className="font-bold text-xl text-black mb-2">Capacidad</p>
                <p className="text-gray-600 text-lg">{t.boatInfo.capacity}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto bg-gold rounded-full flex items-center justify-center">
                <Calendar className="h-10 w-10 text-white" />
              </div>
              <div>
                <p className="font-bold text-xl text-black mb-2">Duración</p>
                <p className="text-gray-600 text-lg">{t.boatInfo.duration}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto bg-gold rounded-full flex items-center justify-center">
                <Star className="h-10 w-10 text-white" />
              </div>
              <div>
                <p className="font-bold text-xl text-black mb-2">Precio</p>
                <p className="text-gray-600 text-lg">{t.boatInfo.price}</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Card className="bg-gray-50 border-0 inline-block">
              <CardContent className="p-8">
                <Music className="h-12 w-12 mx-auto mb-4 text-gold" />
                <p className="text-gray-700 text-lg leading-relaxed max-w-2xl">{t.boatInfo.features}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* PreviApp Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-8">
              <Image
                src="/assets/icono7.png"
                alt="PreviApp Logo"
                width={120}
                height={120}
                className="rounded-3xl shadow-xl"
              />
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">{t.previapp.title}</h2>
            <p className="text-xl text-gold font-semibold mb-6">{t.previapp.subtitle}</p>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">{t.previapp.description}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Features */}
            <div className="space-y-6">
              {t.previapp.features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">{index + 1}</span>
                  </div>
                  <span className="text-gray-800 font-medium">{feature}</span>
                </div>
              ))}
            </div>

            {/* Download Section */}
            <div className="text-center">
              <Card className="bg-white border border-gray-200 shadow-xl">
                <CardContent className="p-8">
                  <Download className="h-16 w-16 mx-auto mb-6 text-gold" />
                  <h3 className="text-2xl font-bold mb-8 text-black">{t.previapp.download}</h3>

                  <div className="space-y-4">
                    <Button
                      asChild
                      size="lg"
                      className="w-full bg-gold text-white hover:bg-yellow-600 transition-all duration-300 text-lg py-6 rounded-xl font-semibold shadow-lg"
                    >
                      <Link
                        href="https://apps.apple.com/es/app/previapp/id6744716491"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Image src="/assets/apple.png" alt="Apple" width={24} height={24} className="mr-3" />
                        Descargar para iOS
                      </Link>
                    </Button>

                    <Button
                      asChild
                      size="lg"
                      className="w-full bg-gold text-white hover:bg-yellow-600 transition-all duration-300 text-lg py-6 rounded-xl font-semibold shadow-lg"
                    >
                      <Link
                        href="https://play.google.com/store/apps/details?id=com.previapp.app&hl=es_EC"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Image src="/assets/android.png" alt="Android" width={24} height={24} className="mr-3" />
                        Descargar para Android
                      </Link>
                    </Button>

                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="w-full border-2 border-gold text-gold hover:bg-gold hover:text-white transition-all duration-300 text-lg py-6 rounded-xl font-semibold"
                    >
                      <Link href="https://previapp.es" target="_blank" rel="noopener noreferrer">
                        <Globe className="mr-3 h-6 w-6" />
                        {t.previapp.website}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="mb-12">
            <Heart className="h-16 w-16 mx-auto mb-6 text-gold" />
            <h3 className="text-4xl md:text-5xl font-bold text-black mb-6">{t.cta.title}</h3>
            <p className="text-xl text-gray-700 leading-relaxed">{t.cta.description}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-gold text-white hover:bg-yellow-600 transition-all duration-300 font-semibold text-lg px-8 py-6 rounded-xl shadow-lg"
            >
              <Link href="/boats">
                <Music className="mr-3 h-6 w-6" />
                {t.cta.boats}
                <ArrowRight className="ml-3 h-6 w-6" />
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-2 border-gold text-gold hover:bg-gold hover:text-white transition-all duration-300 font-semibold text-lg px-8 py-6 rounded-xl"
            >
              <Link href="/contact">
                <Users className="mr-3 h-6 w-6" />
                {t.cta.contact}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
