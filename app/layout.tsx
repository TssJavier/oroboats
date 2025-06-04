import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" })

// ✅ VIEWPORT OPTIMIZADO
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
}

// ✅ METADATA COMPLETA PARA SEO
export const metadata: Metadata = {
  // Básicos
  title: {
    default: "OroBoats - Alquiler de Barcos y Motos de Agua en Granada",
    template: "%s | OroBoats Granada",
  },
  description:
    "Alquila barcos y motos de agua en Granada. Experiencias únicas en la costa mediterránea con OroBoats. Reserva online, precios competitivos, embarcaciones modernas y seguras.",

  // Keywords y categorización
  keywords: [
    "alquiler barcos Granada",
    "motos de agua Granada",
    "charter náutico Granada",
    "embarcaciones Granada",
    "turismo náutico Andalucía",
    "alquiler sin licencia Granada",
    "excursiones marítimas",
    "costa tropical Granada",
  ],

  // Autor y publisher
  authors: [{ name: "OroBoats Granada" }],
  creator: "OroBoats",
  publisher: "OroBoats Granada",

  // Configuración de robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Open Graph para redes sociales
  openGraph: {
    type: "website",
    locale: "es_ES",
    alternateLocale: ["en_US"],
    url: "https://oroboats.com",
    siteName: "OroBoats Granada",
    title: "OroBoats - Alquiler de Barcos y Motos de Agua en Granada",
    description:
      "Alquila barcos y motos de agua en Granada. Experiencias únicas en la costa mediterránea con OroBoats.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "OroBoats - Alquiler de embarcaciones en Granada",
        type: "image/jpeg",
      },
      {
        url: "/og-image-square.jpg",
        width: 1200,
        height: 1200,
        alt: "OroBoats Granada - Barcos y motos de agua",
        type: "image/jpeg",
      },
    ],
  },

  // Twitter Cards
  twitter: {
    card: "summary_large_image",
    site: "@oroboats",
    creator: "@oroboats",
    title: "OroBoats - Alquiler de Barcos y Motos de Agua en Granada",
    description: "Alquila barcos y motos de agua en Granada. Experiencias únicas en la costa mediterránea.",
    images: ["/twitter-image.jpg"],
  },

  // Verificación y analytics
  verification: {
    google: "tu-codigo-google-search-console",
    // yandex: 'tu-codigo-yandex',
    // bing: 'tu-codigo-bing',
  },

  // Configuración adicional
  category: "travel",
  classification: "Turismo Náutico",

  // Manifest y iconos
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [{ rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#000000" }],
  },

  // Configuración de formato
  formatDetection: {
    telephone: true,
    date: true,
    address: true,
    email: true,
  },
}

// ✅ STRUCTURED DATA JSON-LD
const structuredData = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://oroboats.com/#business",
  name: "OroBoats Granada",
  alternateName: "OroBoats",
  description: "Empresa de alquiler de barcos y motos de agua en Granada, Costa Tropical",
  url: "https://oroboats.com",
  telephone: "+34-XXX-XXX-XXX",
  email: "info@oroboats.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Puerto Deportivo de Granada",
    addressLocality: "Granada",
    addressRegion: "Andalucía",
    postalCode: "18000",
    addressCountry: "ES",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: "36.7213028",
    longitude: "-3.4962736",
  },
  openingHours: ["Mo-Su 09:00-21:00"],
  priceRange: "€€",
  currenciesAccepted: "EUR",
  paymentAccepted: "Cash, Credit Card, Bank Transfer",
  areaServed: {
    "@type": "GeoCircle",
    geoMidpoint: {
      "@type": "GeoCoordinates",
      latitude: "36.7213028",
      longitude: "-3.4962736",
    },
    geoRadius: "50000",
  },
  serviceType: "Boat Rental",
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Servicios de Alquiler Náutico",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Alquiler de Barcos",
          description: "Alquiler de embarcaciones con y sin licencia",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Alquiler de Motos de Agua",
          description: "Motos de agua modernas y seguras",
        },
      },
    ],
  },
  sameAs: [
    "https://www.facebook.com/oroboats",
    "https://www.instagram.com/oroboats",
    "https://www.twitter.com/oroboats",
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="scroll-smooth">
      <head>
        {/* ✅ STRUCTURED DATA */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

        {/* ✅ PRECONNECT PARA PERFORMANCE */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* ✅ DNS PREFETCH */}
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />

        {/* ✅ CANONICAL URL (se puede sobrescribir en páginas específicas) */}
        <link rel="canonical" href="https://oroboats.com" />

        {/* ✅ ALTERNATE LANGUAGES */}
        <link rel="alternate" hrefLang="es" href="https://oroboats.com" />
        <link rel="alternate" hrefLang="en" href="https://oroboats.com/en" />
        <link rel="alternate" hrefLang="x-default" href="https://oroboats.com" />
      </head>

      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
