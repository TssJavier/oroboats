"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, Mail, MessageCircle, Send } from "lucide-react"
import { useApp } from "@/components/providers"

const translations = {
  es: {
    title: "Contacto VIP",
    subtitle: "Atención personalizada para experiencias excepcionales",
    name: "Nombre completo",
    email: "Correo electrónico",
    message: "Mensaje",
    send: "Enviar Mensaje",
    phone: "Teléfono VIP",
    emailLabel: "Email Premium",
    whatsapp: "WhatsApp 24/7",
    info: "Información de Contacto",
    form: "Solicitar Información",
  },
  en: {
    title: "VIP Contact",
    subtitle: "Personalized attention for exceptional experiences",
    name: "Full name",
    email: "Email address",
    message: "Message",
    send: "Send Message",
    phone: "VIP Phone",
    emailLabel: "Premium Email",
    whatsapp: "WhatsApp 24/7",
    info: "Contact Information",
    form: "Request Information",
  },
}

export function ContactSection() {
  const { language } = useApp()
  const t = translations[language]

  return (
    <section className="py-24 bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-playfair font-bold text-white mb-6">{t.title}</h2>
          <p className="text-xl md:text-2xl text-white/70 max-w-4xl mx-auto">{t.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Card className="bg-black/50 border-gold/30 hover:border-gold/50 transition-all duration-500">
            <CardHeader>
              <CardTitle className="text-2xl font-playfair text-white flex items-center">
                <Phone className="h-6 w-6 text-gold mr-3" />
                {t.info}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4 group">
                <div className="w-12 h-12 bg-gradient-to-r from-gold to-yellow-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Phone className="h-6 w-6 text-black" />
                </div>
                <div>
                  <p className="text-white/60 text-sm">{t.phone}</p>
                  <p className="text-white text-lg font-semibold">+34 123 456 789</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 group">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-white/60 text-sm">{t.emailLabel}</p>
                  <p className="text-white text-lg font-semibold">vip@oroboats.com</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 group">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-white/60 text-sm">{t.whatsapp}</p>
                  <p className="text-white text-lg font-semibold">+34 123 456 789</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/50 border-gold/30 hover:border-gold/50 transition-all duration-500">
            <CardHeader>
              <CardTitle className="text-2xl font-playfair text-white flex items-center">
                <Send className="h-6 w-6 text-gold mr-3" />
                {t.form}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <Input
                  placeholder={t.name}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-gold"
                />
                <Input
                  type="email"
                  placeholder={t.email}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-gold"
                />
                <Textarea
                  placeholder={t.message}
                  rows={4}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-gold resize-none"
                />
                <Button className="w-full bg-gradient-to-r from-gold to-yellow-500 text-black font-bold text-lg py-3 hover:from-yellow-500 hover:to-gold transition-all duration-500 transform hover:scale-105">
                  {t.send}
                  <Send className="ml-2 h-5 w-5" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
