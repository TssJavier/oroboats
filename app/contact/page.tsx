"use client"

import type React from "react"

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { useApp } from "@/components/providers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Phone, MapPin, Clock, MessageCircle, User } from "lucide-react"
import { useState } from "react"

const translations = {
  es: {
    title: "Contacto",
    subtitle: "Estamos aquí para ayudarte con tu próxima aventura náutica",
    getInTouch: "Ponte en Contacto",
    phone: "Teléfono",
    email: "Email",
    whatsapp: "WhatsApp",
    address: "Dirección",
    hours: "Horarios",
    owner: "Propietario",
    form: {
      title: "Envíanos un Mensaje",
      name: "Nombre",
      email: "Email",
      phone: "Teléfono",
      message: "Mensaje",
      send: "Enviar Mensaje",
      sending: "Enviando...",
      success: "Mensaje enviado correctamente",
      error: "Error al enviar el mensaje",
    },
    info: {
      phone: "+34 655 52 79 88",
      email: "info@oroboats.com",
      whatsapp: "+34 643 44 23 64",
      address: "Paseo Andrés Segovia, 62",
      city: "La Herradura, Granada",
      hours: "Abierto todos los días: 9:00 - 21:00",
      owner: "Fermín Giménez Sáenz",
    },
  },
  en: {
    title: "Contact",
    subtitle: "We're here to help you with your next nautical adventure",
    getInTouch: "Get in Touch",
    phone: "Phone",
    email: "Email",
    whatsapp: "WhatsApp",
    address: "Address",
    hours: "Hours",
    owner: "Owner",
    form: {
      title: "Send us a Message",
      name: "Name",
      email: "Email",
      phone: "Phone",
      message: "Message",
      send: "Send Message",
      sending: "Sending...",
      success: "Message sent successfully",
      error: "Error sending message",
    },
    info: {
      phone: "+34 655 52 79 88",
      email: "info@oroboats.com",
      whatsapp: "+34 643 44 23 64",
      address: "Paseo Andrés Segovia, 62",
      city: "La Herradura, Granada",
      hours: "Open every day: 9:00 - 21:00",
      owner: "Fermín Giménez Sáenz",
    },
  },
}

export default function ContactPage() {
  const { language } = useApp()
  const t = translations[language]
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simular envío del formulario
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitStatus("success")
      setFormData({ name: "", email: "", phone: "", message: "" })

      setTimeout(() => {
        setSubmitStatus("idle")
      }, 3000)
    }, 1000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Information */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-8">{t.getInTouch}</h2>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <Phone className="h-6 w-6 text-gold mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{t.phone}</h3>
                    <p className="text-gray-600">{t.info.phone}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Mail className="h-6 w-6 text-gold mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{t.email}</h3>
                    <p className="text-gray-600">{t.info.email}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <MessageCircle className="h-6 w-6 text-gold mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{t.whatsapp}</h3>
                    <p className="text-gray-600">{t.info.whatsapp}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <MapPin className="h-6 w-6 text-gold mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{t.address}</h3>
                    <p className="text-gray-600">{t.info.address}</p>
                    <p className="text-gray-600">{t.info.city}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Clock className="h-6 w-6 text-gold mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{t.hours}</h3>
                    <p className="text-gray-600">{t.info.hours}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <User className="h-6 w-6 text-gold mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{t.owner}</h3>
                    <p className="text-gray-600">{t.info.owner}</p>
                  </div>
                </div>
              </div>

              {/* Map */}
              <div className="mt-8">
                <div className="aspect-video rounded-lg overflow-hidden">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3179.8!2d-3.7275!3d36.7275!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzbCsDQzJzM5LjAiTiAzwrA0Myc0My4wIlc!5e0!3m2!1sen!2ses!4v1234567890"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-8">{t.form.title}</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    {t.form.name}
                  </label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    {t.form.email}
                  </label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    {t.form.phone}
                  </label>
                  <Input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    {t.form.message}
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gold hover:bg-yellow-300 text-black font-semibold"
                >
                  {isSubmitting ? t.form.sending : t.form.send}
                </Button>

                {submitStatus === "success" && (
                  <div className="text-green-600 text-center font-medium">{t.form.success}</div>
                )}

                {submitStatus === "error" && <div className="text-red-600 text-center font-medium">{t.form.error}</div>}
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
