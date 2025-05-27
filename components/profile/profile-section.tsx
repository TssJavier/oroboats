"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Calendar, Clock, MapPin, Phone, Mail, Edit } from "lucide-react"
import Image from "next/image"
import { useApp } from "@/components/providers"

interface Booking {
  id: number
  vehicleName: string
  date: string
  time: string
  status: "confirmed" | "pending" | "completed" | "cancelled"
  price: number
  location: string
}

interface Translations {
  title: string
  subtitle: string
  personalInfo: string
  bookings: string
  upcoming: string
  past: string
  edit: string
  noBookings: string
  bookNow: string
  status: {
    confirmed: string
    pending: string
    completed: string
    cancelled: string
  }
}

const translations = {
  es: {
    title: "Mi Perfil",
    subtitle: "Gestiona tu cuenta y revisa tus reservas",
    personalInfo: "Información Personal",
    bookings: "Mis Reservas",
    upcoming: "Próximas",
    past: "Pasadas",
    edit: "Editar",
    noBookings: "No tienes reservas aún",
    bookNow: "Hacer una Reserva",
    status: {
      confirmed: "Confirmada",
      pending: "Pendiente",
      completed: "Completada",
      cancelled: "Cancelada",
    },
  },
  en: {
    title: "My Profile",
    subtitle: "Manage your account and review your bookings",
    personalInfo: "Personal Information",
    bookings: "My Bookings",
    upcoming: "Upcoming",
    past: "Past",
    edit: "Edit",
    noBookings: "You don't have any bookings yet",
    bookNow: "Make a Booking",
    status: {
      confirmed: "Confirmed",
      pending: "Pending",
      completed: "Completed",
      cancelled: "Cancelled",
    },
  },
}

// Mock data - en producción vendría de la base de datos
const mockUser = {
  name: "Fermín Giménez",
  email: "fermin@example.com",
  phone: "+34 123 456 789",
  avatar: "/placeholder.svg?height=100&width=100&query=professional avatar",
}

const mockBookings: Booking[] = [
  {
    id: 1,
    vehicleName: "OroYacht Prestige",
    date: "2024-02-15",
    time: "14:00 - 18:00",
    status: "confirmed",
    price: 1800,
    location: "Puerto Marina Valencia",
  },
  {
    id: 2,
    vehicleName: "Golden Wave",
    date: "2024-01-20",
    time: "10:00 - 12:00",
    status: "completed",
    price: 190,
    location: "Puerto Marina Valencia",
  },
]

export function ProfileSection() {
  const { language } = useApp()
  const t = translations[language]

  const upcomingBookings = mockBookings.filter((booking) => new Date(booking.date) > new Date())
  const pastBookings = mockBookings.filter((booking) => new Date(booking.date) <= new Date())

  const getStatusColor = (status: Booking["status"]) => {
    switch (status) {
      case "confirmed":
        return "bg-green-600"
      case "pending":
        return "bg-yellow-600"
      case "completed":
        return "bg-blue-600"
      case "cancelled":
        return "bg-red-600"
      default:
        return "bg-gray-600"
    }
  }

  return (
    <section className="py-24 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-6">{t.title}</h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto">{t.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Personal Information */}
          <div className="lg:col-span-1">
            <Card className="bg-white border border-gray-200 hover:border-gold hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-black flex items-center">
                  <User className="h-6 w-6 text-gold mr-3" />
                  {t.personalInfo}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <Image
                    src={mockUser.avatar || "/placeholder.svg"}
                    alt={mockUser.name}
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-gold"
                  />
                  <h3 className="text-xl font-semibold text-black">{mockUser.name}</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gold" />
                    <span className="text-gray-600">{mockUser.email}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gold" />
                    <span className="text-gray-600">{mockUser.phone}</span>
                  </div>
                </div>

                <Button className="w-full bg-black text-white hover:bg-gold hover:text-black transition-all duration-300 font-medium">
                  <Edit className="h-4 w-4 mr-2" />
                  {t.edit}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Bookings */}
          <div className="lg:col-span-2">
            <Card className="bg-white border border-gray-200 hover:border-gold hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-black flex items-center">
                  <Calendar className="h-6 w-6 text-gold mr-3" />
                  {t.bookings}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Upcoming Bookings */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-black mb-4">{t.upcoming}</h3>
                  {upcomingBookings.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingBookings.map((booking) => (
                        <BookingCard key={booking.id} booking={booking} t={t} getStatusColor={getStatusColor} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">{t.noBookings}</p>
                      <Button
                        asChild
                        className="bg-black text-white hover:bg-gold hover:text-black transition-all duration-300 font-medium"
                      >
                        <a href="/boats">{t.bookNow}</a>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Past Bookings */}
                {pastBookings.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-black mb-4">{t.past}</h3>
                    <div className="space-y-4">
                      {pastBookings.map((booking) => (
                        <BookingCard key={booking.id} booking={booking} t={t} getStatusColor={getStatusColor} />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}

function BookingCard({
  booking,
  t,
  getStatusColor,
}: {
  booking: Booking
  t: Translations
  getStatusColor: (status: Booking["status"]) => string
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gold transition-all duration-300">
      <div className="flex justify-between items-start mb-3">
        <h4 className="text-lg font-semibold text-black">{booking.vehicleName}</h4>
        <Badge className={`${getStatusColor(booking.status)} text-white`}>{t.status[booking.status]}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <div className="flex items-center text-gray-600">
          <Calendar className="h-4 w-4 mr-2 text-gold" />
          {booking.date}
        </div>
        <div className="flex items-center text-gray-600">
          <Clock className="h-4 w-4 mr-2 text-gold" />
          {booking.time}
        </div>
        <div className="flex items-center text-gray-600">
          <MapPin className="h-4 w-4 mr-2 text-gold" />
          {booking.location}
        </div>
      </div>

      <div className="mt-3 text-right">
        <span className="text-xl font-bold text-gold">€{booking.price}</span>
      </div>
    </div>
  )
}
