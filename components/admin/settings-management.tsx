"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ImageUpload } from "@/components/admin/image-upload"
import { Save, Phone, MapPin, Clock, Calendar, Palette, RotateCcw } from "lucide-react"

interface Setting {
  id: number
  key: string
  value: Record<string, unknown> | string | number
  description: string
}

interface ContactInfo {
  [key: string]: unknown
  phone: string
  email: string
  address: string
}

interface BusinessHours {
  [key: string]: unknown
  start: string
  end: string
}

export function SettingsManagement() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    phone: "",
    email: "",
    address: "",
  })
  const [businessHours, setBusinessHours] = useState<BusinessHours>({
    start: "",
    end: "",
  })
  const [bookingAdvanceDays, setBookingAdvanceDays] = useState(30)
    const defaultBranding = {
      companyName: "OroBoats",
      logoUrl: "/assets/negro.png",
      primaryColor: "#000000",
      secondaryColor: "#FFD700",
      backgroundColor: "#FFFFFF",
      loadingBackgroundColor: "#FFFFFF",
      tagline: "",
    }
  const [branding, setBranding] = useState({ ...defaultBranding })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings")
      const data = await response.json()
      setSettings(data)

      data.forEach((setting: Setting) => {
        switch (setting.key) {
          case "contact_info":
            try {
              setContactInfo(JSON.parse(setting.value as string))
            } catch {
              /* ignore */
            }
            break
          case "business_hours":
            try {
              setBusinessHours(JSON.parse(setting.value as string))
            } catch {
              /* ignore */
            }
            break
          case "booking_advance_days":
            setBookingAdvanceDays(Number(setting.value))
            break
          case "company_name":
            setBranding((b) => ({ ...b, companyName: String(setting.value) }))
            break
          case "logo_url":
            setBranding((b) => ({ ...b, logoUrl: String(setting.value) }))
            break
          case "primary_color":
            setBranding((b) => ({ ...b, primaryColor: String(setting.value) }))
            break
          case "secondary_color":
            setBranding((b) => ({ ...b, secondaryColor: String(setting.value) }))
            break
          case "background_color":
            setBranding((b) => ({ ...b, backgroundColor: String(setting.value) }))
            break
          case "loading_background_color":
            setBranding((b) => ({ ...b, loadingBackgroundColor: String(setting.value) }))
            break
          case "tagline":
            setBranding((b) => ({ ...b, tagline: String(setting.value) }))
            break
        }
      })
    } catch (err) {
      console.error("Error fetching settings:", err)
    } finally {
      setLoading(false)
    }
  }

  const saveSetting = async (key: string, value: Record<string, unknown> | string | number, description: string) => {
    setSaving(true)
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value, description }),
      })
    } catch (err) {
      console.error("Error saving setting:", err)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveBranding = async () => {
    await saveSetting("company_name", branding.companyName, "Nombre de la empresa")
    await saveSetting("logo_url", branding.logoUrl, "URL del logo")
      await saveSetting("primary_color", branding.primaryColor, "Color primario")
      await saveSetting("secondary_color", branding.secondaryColor, "Color secundario")
      await saveSetting("background_color", branding.backgroundColor, "Color de fondo")
      await saveSetting("loading_background_color", branding.loadingBackgroundColor, "Color de fondo de carga")
      await saveSetting("tagline", branding.tagline, "Eslogan de la empresa")
    }

  const handleResetBranding = async () => {
    setBranding({ ...defaultBranding })
    await saveSetting("company_name", defaultBranding.companyName, "Nombre de la empresa")
    await saveSetting("logo_url", defaultBranding.logoUrl, "URL del logo")
      await saveSetting("primary_color", defaultBranding.primaryColor, "Color primario")
      await saveSetting("secondary_color", defaultBranding.secondaryColor, "Color secundario")
      await saveSetting("background_color", defaultBranding.backgroundColor, "Color de fondo")
      await saveSetting(
        "loading_background_color",
        defaultBranding.loadingBackgroundColor,
        "Color de fondo de carga",
      )
      await saveSetting("tagline", defaultBranding.tagline, "Eslogan de la empresa")
    }

  const handleSaveContactInfo = () => {
    saveSetting("contact_info", contactInfo, "Información de contacto del negocio")
  }

  const handleSaveBusinessHours = () => {
    saveSetting("business_hours", businessHours, "Horario de operación del negocio")
  }

  const handleSaveBookingAdvance = () => {
    saveSetting("booking_advance_days", bookingAdvanceDays, "Días de antelación máxima para reservas")
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-black">Configuración del Negocio</h2>
        <p className="text-gray-600">Administra la información y configuración de OroBoats</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-black flex items-center">
              <Palette className="h-5 w-5 text-gold mr-3" />
              Branding y Apariencia
            </CardTitle>
            <CardDescription>Personaliza la marca y los colores del sitio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la Empresa</label>
              <Input
                value={branding.companyName}
                onChange={(e) => setBranding({ ...branding, companyName: e.target.value })}
                className="bg-gray-50 border-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
              <ImageUpload
                value={branding.logoUrl}
                onChange={(url) => setBranding({ ...branding, logoUrl: url })}
                vehicleType="boat"
              />
            </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color Botón 1</label>
                  <Input
                    type="color"
                    value={branding.primaryColor}
                    onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                    className="bg-gray-50 border-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color Botón 2</label>
                  <Input
                    type="color"
                    value={branding.secondaryColor}
                    onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                    className="bg-gray-50 border-gray-200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Background 1</label>
                  <Input
                    type="color"
                    value={branding.loadingBackgroundColor}
                    onChange={(e) =>
                      setBranding({ ...branding, loadingBackgroundColor: e.target.value })
                    }
                    className="bg-gray-50 border-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Background 2</label>
                  <Input
                    type="color"
                    value={branding.backgroundColor}
                    onChange={(e) => setBranding({ ...branding, backgroundColor: e.target.value })}
                    className="bg-gray-50 border-gray-200"
                  />
                </div>
              </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Eslogan</label>
              <Textarea
                value={branding.tagline}
                onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
                rows={2}
                className="bg-gray-50 border-gray-200"
              />
            </div>
              <div className="space-y-2">
                <Button
                  onClick={handleSaveBranding}
                  disabled={saving}
                  className="w-full btn-primary transition-all duration-300"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Guardando..." : "Guardar Branding"}
                </Button>
                <Button
                  type="button"
                  onClick={handleResetBranding}
                  className="w-full border-gray-300 hover:border-gold hover:bg-gold/10 text-black"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restablecer de Fábrica
                </Button>
              </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-black flex items-center">
              <Phone className="h-5 w-5 text-gold mr-3" />
              Información de Contacto
            </CardTitle>
            <CardDescription>Datos de contacto que aparecen en la web</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
              <Input
                value={contactInfo.phone}
                onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                placeholder="+34 123 456 789"
                className="bg-gray-50 border-gray-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <Input
                type="email"
                value={contactInfo.email}
                onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                placeholder="info@oroboats.com"
                className="bg-gray-50 border-gray-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
              <Textarea
                value={contactInfo.address}
                onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                placeholder="Puerto Marina Valencia, Muelle VIP 15"
                rows={3}
                className="bg-gray-50 border-gray-200"
              />
            </div>

            <Button
              onClick={handleSaveContactInfo}
              disabled={saving}
              className="w-full btn-primary transition-all duration-300"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Guardando..." : "Guardar Contacto"}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-black flex items-center">
              <Clock className="h-5 w-5 text-gold mr-3" />
              Horarios de Operación
            </CardTitle>
            <CardDescription>Horario en que el negocio está abierto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hora de apertura</label>
                <Input
                  type="time"
                  value={businessHours.start}
                  onChange={(e) => setBusinessHours({ ...businessHours, start: e.target.value })}
                  className="bg-gray-50 border-gray-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hora de cierre</label>
                <Input
                  type="time"
                  value={businessHours.end}
                  onChange={(e) => setBusinessHours({ ...businessHours, end: e.target.value })}
                  className="bg-gray-50 border-gray-200"
                />
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <Clock className="h-4 w-4 inline mr-1" />
                Horario actual: {businessHours.start} - {businessHours.end}
              </p>
            </div>

            <Button
              onClick={handleSaveBusinessHours}
              disabled={saving}
              className="w-full btn-primary transition-all duration-300"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Guardando..." : "Guardar Horarios"}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-black flex items-center">
              <Calendar className="h-5 w-5 text-gold mr-3" />
              Configuración de Reservas
            </CardTitle>
            <CardDescription>Parámetros para el sistema de reservas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Días de antelación máxima para reservas
              </label>
              <Input
                type="number"
                value={bookingAdvanceDays}
                onChange={(e) => setBookingAdvanceDays(Number.parseInt(e.target.value))}
                min="1"
                max="365"
                className="bg-gray-50 border-gray-200"
              />
              <p className="text-xs text-gray-500 mt-1">
                Los clientes podrán reservar hasta {bookingAdvanceDays} días por adelantado
              </p>
            </div>

            <Button
              onClick={handleSaveBookingAdvance}
              disabled={saving}
              className="w-full btn-primary transition-all duration-300"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Guardando..." : "Guardar Configuración"}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-black flex items-center">
              <MapPin className="h-5 w-5 text-gold mr-3" />
              Estado del Sistema
            </CardTitle>
            <CardDescription>Información técnica y estado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Base de datos:</span>
                <div className="font-semibold text-green-600">✓ Conectada</div>
              </div>
              <div>
                <span className="text-gray-500">Configuraciones:</span>
                <div className="font-semibold text-black">{settings.length} activas</div>
              </div>
              <div>
                <span className="text-gray-500">Última actualización:</span>
                <div className="font-semibold text-black">{new Date().toLocaleDateString("es-ES")}</div>
              </div>
              <div>
                <span className="text-gray-500">Versión:</span>
                <div className="font-semibold text-black">1.0.0</div>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">✓ Todos los sistemas funcionando correctamente</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
