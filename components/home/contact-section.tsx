"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, Mail, MessageCircle, Send } from "lucide-react"
import { useApp } from "@/components/providers"
import { useState } from "react"
import { sendContactEmails } from "@/lib/email" // ✅ Corregido: sendContactEmails en lugar de sendContactEmail

const translations = {
  es: {
    title: "Contacta con Nosotros",
    subtitle: "¿Tienes alguna pregunta? Estamos aquí para ayudarte",
    name: "Nombre completo",
    email: "Correo electrónico",
    message: "Mensaje",
    send: "Enviar Mensaje",
    sending: "Enviando...",
    success: "Mensaje enviado correctamente",
    error: "Error al enviar el mensaje",
    phone: "Teléfono",
    emailLabel: "Email",
    whatsapp: "WhatsApp",
    info: "Información de Contacto",
    form: "Envíanos un Mensaje",
  },
  en: {
    title: "Contact Us",
    subtitle: "Have any questions? We're here to help",
    name: "Full name",
    email: "Email address",
    message: "Message",
    send: "Send Message",
    sending: "Sending...",
    success: "Message sent successfully",
    error: "Error sending message",
    phone: "Phone",
    emailLabel: "Email",
    whatsapp: "WhatsApp",
    info: "Contact Information",
    form: "Send us a Message",
  },
}

export function ContactSection() {
  const { language } = useApp()
  const t = translations[language]

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus("idle")

    try {
      // ✅ Corregido: Usar sendContactEmails en lugar de sendContactEmail
      await sendContactEmails(formData)
      setSubmitStatus("success")
      setFormData({ name: "", email: "", message: "" })

      // Limpiar mensaje de éxito después de 5 segundos
      setTimeout(() => {
        setSubmitStatus("idle")
      }, 5000)
    } catch (error) {
      console.error("Error sending contact email:", error)
      setSubmitStatus("error")

      // Limpiar mensaje de error después de 5 segundos
      setTimeout(() => {
        setSubmitStatus("idle")
      }, 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-6">{t.title}</h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">{t.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Card className="bg-white border border-gray-200 hover:border-gold hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-black flex items-center">
                <Phone className="h-6 w-6 text-gold mr-3" />
                {t.info}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center">
                  <Phone className="h-6 w-6 text-black" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">{t.phone}</p>
                  <p className="text-black text-lg font-medium">+34 655 52 79 88</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <Mail className="h-6 w-6 text-black" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">{t.emailLabel}</p>
                  <p className="text-black text-lg font-medium">info@oroboats.com</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-black" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">{t.whatsapp}</p>
                  <p className="text-black text-lg font-medium">+34 643 44 23 64</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 hover:border-gold hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-black flex items-center">
                <Send className="h-6 w-6 text-gold mr-3" />
                {t.form}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t.name}
                  required
                  className="bg-gray-50 border-gray-200 text-black placeholder:text-gray-500 focus:border-gold"
                />
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t.email}
                  required
                  className="bg-gray-50 border-gray-200 text-black placeholder:text-gray-500 focus:border-gold"
                />
                <Textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={t.message}
                  required
                  rows={4}
                  className="bg-gray-50 border-gray-200 text-black placeholder:text-gray-500 focus:border-gold resize-none"
                />

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-black text-white hover:bg-gold hover:text-black transition-all duration-300 font-medium py-3"
                >
                  {isSubmitting ? t.sending : t.send}
                  <Send className="ml-2 h-5 w-5" />
                </Button>

                {/* Mensajes de estado */}
                {submitStatus === "success" && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-700 text-sm font-medium">{t.success}</p>
                  </div>
                )}

                {submitStatus === "error" && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700 text-sm font-medium">{t.error}</p>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
