"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Crown, Zap, Users, Gauge, Calendar } from "lucide-react"
import Link from "next/link"
import { useApp } from "@/components/providers"

const translations = {
  es: {
    title: "Nuestra Flota Premium",
    subtitle: "Barcos y motos de agua de lujo para experiencias inolvidables",
    boats: "Barcos",
    jetskis: "Motos de Agua",
    reserve: "Reservar",
    from: "Desde",
    hour: "/hora",
    capacity: "Capacidad",
    power: "Potencia",
    length: "Eslora",
    available: "Disponible",
  },
  en: {
    title: "Our Premium Fleet",
    subtitle: "Luxury boats and jet skis for unforgettable experiences",
    boats: "Boats",
    jetskis: "Jet Skis",
    reserve: "Reserve",
    from: "From",
    hour: "/hour",
    capacity: "Capacity",
    power: "Power",
    length: "Length",
    available: "Available",
  },
}

const boats = [
  {
    id: 1,
    name: "OroYacht Prestige",
    image: "/placeholder.svg?height=300&width=400&query=luxury yacht white gold details",
    price: 450,
    capacity: 12,
    length: "15m",
    power: "2x 350HP",
    description: "Yate de lujo con acabados dorados y tecnología de vanguardia",
  },
  {
    id: 2,
    name: "Golden Navigator",
    image: "/placeholder.svg?height=300&width=400&query=premium boat golden accents",
    price: 320,
    capacity: 8,
    length: "12m",
    power: "2x 250HP",
    description: "Barco premium perfecto para grupos medianos",
  },
  {
    id: 3,
    name: "Elite Cruiser",
    image: "/placeholder.svg?height=300&width=400&query=elegant boat black gold design",
    price: 280,
    capacity: 6,
    length: "10m",
    power: "1x 300HP",
    description: "Elegancia y potencia en perfecta armonía",
  },
]

const jetskis = [
  {
    id: 4,
    name: "OroJet Supreme",
    image: "/placeholder.svg?height=300&width=400&query=luxury jet ski gold black",
    price: 120,
    capacity: 2,
    power: "300HP",
    description: "Moto de agua de alta gama con detalles dorados",
  },
  {
    id: 5,
    name: "Golden Wave",
    image: "/placeholder.svg?height=300&width=400&query=premium jet ski golden design",
    price: 95,
    capacity: 2,
    power: "250HP",
    description: "Adrenalina pura con estilo premium",
  },
  {
    id: 6,
    name: "Elite Racer",
    image: "/placeholder.svg?height=300&width=400&query=sport jet ski black gold racing",
    price: 85,
    capacity: 1,
    power: "200HP",
    description: "Para los amantes de la velocidad extrema",
  },
]

export function BoatsSection() {
  const { language } = useApp()
  const t = translations[language]
  const [activeTab, setActiveTab] = useState("boats")

  const currentItems = activeTab === "boats" ? boats : jetskis

  return (
    <section className="py-24 bg-gradient-to-b from-black to-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-playfair font-bold text-white mb-6">{t.title}</h1>
          <p className="text-xl md:text-2xl text-white/70 max-w-4xl mx-auto">{t.subtitle}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-12 bg-black/50 border border-gold/30">
            <TabsTrigger
              value="boats"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gold data-[state=active]:to-yellow-500 data-[state=active]:text-black text-white"
            >
              <Crown className="h-4 w-4 mr-2" />
              {t.boats}
            </TabsTrigger>
            <TabsTrigger
              value="jetskis"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gold data-[state=active]:to-yellow-500 data-[state=active]:text-black text-white"
            >
              <Zap className="h-4 w-4 mr-2" />
              {t.jetskis}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="boats" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {boats.map((boat) => (
                <VehicleCard key={boat.id} vehicle={boat} type="boat" t={t} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="jetskis" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {jetskis.map((jetski) => (
                <VehicleCard key={jetski.id} vehicle={jetski} type="jetski" t={t} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}

function VehicleCard({ vehicle, type, t }: { vehicle: any; type: string; t: any }) {
  return (
    <Card className="bg-black/50 border-white/10 hover:border-gold/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-gold/10 group overflow-hidden">
      <div className="relative">
        <img
          src={vehicle.image || "/placeholder.svg"}
          alt={vehicle.name}
          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <Badge className="absolute top-4 right-4 bg-gradient-to-r from-gold to-yellow-500 text-black font-semibold">
          {t.available}
        </Badge>
      </div>

      <CardHeader>
        <CardTitle className="text-xl font-playfair text-white group-hover:text-gold transition-colors">
          {vehicle.name}
        </CardTitle>
        <CardDescription className="text-white/70">{vehicle.description}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center text-white/60">
              <Users className="h-4 w-4 mr-2 text-gold" />
              {t.capacity}
            </span>
            <span className="text-white">{vehicle.capacity} personas</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center text-white/60">
              <Gauge className="h-4 w-4 mr-2 text-gold" />
              {t.power}
            </span>
            <span className="text-white">{vehicle.power}</span>
          </div>

          {type === "boat" && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center text-white/60">
                <Crown className="h-4 w-4 mr-2 text-gold" />
                {t.length}
              </span>
              <span className="text-white">{vehicle.length}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-white/60 text-sm">{t.from}</span>
            <div className="text-2xl font-bold text-gold">
              €{vehicle.price}
              <span className="text-sm text-white/60">{t.hour}</span>
            </div>
          </div>
        </div>

        <Button
          asChild
          className="w-full bg-gradient-to-r from-gold to-yellow-500 text-black font-bold hover:from-yellow-500 hover:to-gold transition-all duration-300 transform hover:scale-105"
        >
          <Link href={`/reservar/${vehicle.id}`}>
            <Calendar className="h-4 w-4 mr-2" />
            {t.reserve}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
