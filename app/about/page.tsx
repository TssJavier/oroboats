"use client"

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { useApp } from "@/components/providers"
import { Ship, Users, Award, MapPin, Heart, Shield } from "lucide-react"
import { useRef, useEffect } from "react"
import Image from "next/image"

const translations = {
  es: {
    title: "Sobre Nosotros",
    subtitle: "Descubre la historia detrás de OroBoats y nuestra pasión por el mar",
    story: {
      title: "Nuestra Historia",
      content:
        "OroBoats nació de la pasión por el mar y el deseo de compartir las mejores experiencias náuticas en la Costa Tropical de Granada. Fundada por Fermín Giménez Sáenz, nuestra empresa se ha convertido en referente del alquiler de embarcaciones de lujo en La Herradura.",
    },
    mission: {
      title: "Nuestra Misión",
      content:
        "Proporcionar experiencias náuticas excepcionales, combinando seguridad, lujo y aventura. Nos comprometemos a ofrecer el mejor servicio personalizado para que cada cliente viva momentos únicos en el mar.",
    },
    values: {
      title: "Nuestros Valores",
      safety: {
        title: "Seguridad",
        content: "La seguridad de nuestros clientes es nuestra máxima prioridad en cada navegación.",
      },
      excellence: {
        title: "Excelencia",
        content: "Mantenemos los más altos estándares de calidad en nuestra flota y servicios.",
      },
      passion: {
        title: "Pasión",
        content: "Amamos el mar y transmitimos esa pasión en cada experiencia que ofrecemos.",
      },
    },
    services: {
      title: "Nuestros Servicios",
      boats: {
        title: "Barcos de Lujo",
        content: "Flota premium de barcos equipados con las últimas comodidades para tu confort.",
      },
      jetskis: {
        title: "Motos Acuáticas",
        content: "Motos de agua de alta gama para los amantes de la adrenalina y la velocidad.",
      },
      experiences: {
        title: "Experiencias VIP",
        content: "Servicios personalizados y experiencias únicas adaptadas a tus necesidades.",
      },
    },
    team: {
      title: "Nuestro Equipo",
      owner: {
        name: "Fermín Giménez Sáenz",
        title: "Fundador y Director",
        content:
          "Con años de experiencia en el sector náutico, Fermín lidera OroBoats con la visión de ofrecer las mejores experiencias en el mar Mediterráneo.",
      },
    },
    location: {
      title: "Nuestra Ubicación",
      content:
        "Ubicados en La Herradura, Granada, en el corazón de la Costa Tropical. Un enclave privilegiado con aguas cristalinas y paisajes únicos que hacen de cada navegación una experiencia inolvidable.",
    },
    commitment: {
      title: "Nuestro Compromiso",
      content:
        "Estamos comprometidos con la sostenibilidad marina y el respeto por el medio ambiente. Trabajamos cada día para preservar la belleza natural de nuestras costas para las futuras generaciones.",
    },
  },
  en: {
    title: "About Us",
    subtitle: "Discover the story behind OroBoats and our passion for the sea",
    story: {
      title: "Our Story",
      content:
        "OroBoats was born from a passion for the sea and the desire to share the best nautical experiences on the Tropical Coast of Granada. Founded by Fermín Giménez Sáenz, our company has become a reference for luxury boat rentals in La Herradura.",
    },
    mission: {
      title: "Our Mission",
      content:
        "To provide exceptional nautical experiences, combining safety, luxury and adventure. We are committed to offering the best personalized service so that each client lives unique moments at sea.",
    },
    values: {
      title: "Our Values",
      safety: {
        title: "Safety",
        content: "The safety of our clients is our top priority in every navigation.",
      },
      excellence: {
        title: "Excellence",
        content: "We maintain the highest quality standards in our fleet and services.",
      },
      passion: {
        title: "Passion",
        content: "We love the sea and transmit that passion in every experience we offer.",
      },
    },
    services: {
      title: "Our Services",
      boats: {
        title: "Luxury Boats",
        content: "Premium fleet of boats equipped with the latest amenities for your comfort.",
      },
      jetskis: {
        title: "Jet Skis",
        content: "High-end jet skis for adrenaline and speed lovers.",
      },
      experiences: {
        title: "VIP Experiences",
        content: "Personalized services and unique experiences adapted to your needs.",
      },
    },
    team: {
      title: "Our Team",
      owner: {
        name: "Fermín Giménez Sáenz",
        title: "Founder and Director",
        content:
          "With years of experience in the nautical sector, Fermín leads OroBoats with the vision of offering the best experiences in the Mediterranean Sea.",
      },
    },
    location: {
      title: "Our Location",
      content:
        "Located in La Herradura, Granada, in the heart of the Tropical Coast. A privileged enclave with crystal clear waters and unique landscapes that make every navigation an unforgettable experience.",
    },
    commitment: {
      title: "Our Commitment",
      content:
        "We are committed to marine sustainability and respect for the environment. We work every day to preserve the natural beauty of our coasts for future generations.",
    },
  },
}

export default function AboutPage() {
  const { language } = useApp()
  const t = translations[language]
  const videoRef = useRef<HTMLVideoElement>(null)

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

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{t.title}</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t.subtitle}</p>
          </div>

          {/* Story Section with Video - Taller */}
          <section className="mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">{t.story.title}</h2>
                <p className="text-lg text-gray-700 leading-relaxed">{t.story.content}</p>
              </div>
              <div className="relative">
                {/* Video más alto - cambiado de aspect-video a aspect-[4/5] */}
                <div className="aspect-[6/5] rounded-lg overflow-hidden shadow-2xl">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    muted
                    autoPlay
                    loop
                    playsInline
                    poster="/placeholder.svg?height=500&width=400&text=OroBoats+Story"
                  >
                    <source src="/assets/videooroboats2.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </div>
          </section>

          {/* Mission Section */}
          <section className="mb-16 bg-gray-50 rounded-2xl p-8 lg:p-12">
            <div className="text-center">
              <Ship className="h-12 w-12 text-gold mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-gray-900 mb-6">{t.mission.title}</h2>
              <p className="text-lg text-gray-700 leading-relaxed max-w-4xl mx-auto">{t.mission.content}</p>
            </div>
          </section>

          {/* Values Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">{t.values.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <Shield className="h-12 w-12 text-gold mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">{t.values.safety.title}</h3>
                <p className="text-gray-700">{t.values.safety.content}</p>
              </div>
              <div className="text-center">
                <Award className="h-12 w-12 text-gold mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">{t.values.excellence.title}</h3>
                <p className="text-gray-700">{t.values.excellence.content}</p>
              </div>
              <div className="text-center">
                <Heart className="h-12 w-12 text-gold mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">{t.values.passion.title}</h3>
                <p className="text-gray-700">{t.values.passion.content}</p>
              </div>
            </div>
          </section>

          {/* Services Section with Real Images */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">{t.services.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Barcos */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="aspect-video rounded-lg overflow-hidden mb-4 relative">
                  <Image src="/assets/barcos/barco1.png" alt="Barcos de Lujo OroBoats" fill className="object-cover" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{t.services.boats.title}</h3>
                <p className="text-gray-700">{t.services.boats.content}</p>
              </div>

              {/* Motos */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="aspect-video rounded-lg overflow-hidden mb-4 relative">
                  <Image src="/assets/motos/moto1.png" alt="Motos Acuáticas OroBoats" fill className="object-cover" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{t.services.jetskis.title}</h3>
                <p className="text-gray-700">{t.services.jetskis.content}</p>
              </div>

              {/* Experiencias VIP */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                <div className="aspect-video rounded-lg overflow-hidden mb-4 relative">
                  <Image src="/assets/experiencia.jpg" alt="Experiencias VIP OroBoats" fill className="object-cover" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{t.services.experiences.title}</h3>
                <p className="text-gray-700">{t.services.experiences.content}</p>
              </div>
            </div>
          </section>

          {/* Team Section with Fermín's Photo - Zoom aplicado */}
          <section className="mb-16 bg-gray-50 rounded-2xl p-8 lg:p-12">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">{t.team.title}</h2>
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                <div className="lg:col-span-1">
                  <div className="aspect-square rounded-full overflow-hidden mx-auto max-w-xs relative shadow-xl">
                    <Image
                      src="/assets/fermin.png"
                      alt="Fermín Giménez Sáenz - Fundador de OroBoats"
                      fill
                      className="object-cover scale-110"
                      style={{ objectPosition: "center" }}
                    />
                  </div>
                </div>
                <div className="lg:col-span-2 text-center lg:text-left">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{t.team.owner.name}</h3>
                  <p className="text-gold font-semibold mb-4">{t.team.owner.title}</p>
                  <p className="text-lg text-gray-700 leading-relaxed">{t.team.owner.content}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Location Section with Real Image */}
          <section className="mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="aspect-video rounded-lg overflow-hidden shadow-xl relative">
                  <Image
                    src="/assets/herradura.jpg"
                    alt="La Herradura, Granada - Costa Tropical"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <MapPin className="h-12 w-12 text-gold mb-6" />
                <h2 className="text-3xl font-bold text-gray-900 mb-6">{t.location.title}</h2>
                <p className="text-lg text-gray-700 leading-relaxed">{t.location.content}</p>
              </div>
            </div>
          </section>

          {/* Commitment Section */}
          <section className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 lg:p-12 text-white text-center">
            <Users className="h-12 w-12 text-gold mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-6">{t.commitment.title}</h2>
            <p className="text-lg leading-relaxed max-w-4xl mx-auto opacity-90">{t.commitment.content}</p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
