import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/toaster"
import { SimpleTracker } from "@/components/analytics/simple-tracker"
import { CookieConsent } from "@/components/cookie-consent"

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
  metadataBase: new URL("https://www.oroboats.com"),
  // Básicos
  title: {
    default: "OroBoats - Alquiler de Barcos y Motos de Agua | La Herradura, Carboneras e Ibiza",
    template: "%s | OroBoats",
  },
  description:
    "Alquila barcos y motos de agua, con o sin licencia, en La Herradura (Granada), Carboneras (Almería) e Ibiza. Reserva online, precios competitivos y embarcaciones modernas y seguras con OroBoats.",

  // Keywords y categorización
  keywords: [
    "alquiler de barcos",
    "alquiler de motos de agua",
    "alquiler barco sin licencia",
    "alquiler barcos La Herradura",
    "motos de agua La Herradura Granada",
    "alquiler barco Carboneras Almería",
    "Cabo de Gata en barco",
    "alquiler barco Ibiza",
    "moto de agua Ibiza Cala de Bou",
    "Costa Tropical",
    "turismo náutico",
    "excursiones marítimas",
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
    url: "https://www.oroboats.com",
    siteName: "OroBoats",
    title: "OroBoats - Alquiler de Barcos y Motos de Agua | La Herradura, Carboneras e Ibiza",
    description:
      "Alquila barcos y motos de agua, con o sin licencia, en La Herradura (Granada), Carboneras (Almería) e Ibiza.",
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
    title: "OroBoats - Alquiler de Barcos y Motos de Agua | La Herradura, Carboneras e Ibiza",
    description: "Barcos y motos de agua, con o sin licencia, en La Herradura, Carboneras e Ibiza. Reserva online.",
    images: ["/twitter-image.jpg"],
  },

  // Verificación y analytics
  verification: {
    google: "googleb24ef2ef7222975d",
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
  "@id": "https://www.oroboats.com/#business",
  name: "OroBoats",
  alternateName: "OroBoats Granada",
  description:
    "Alquiler de barcos y motos de agua, con y sin licencia, en La Herradura (Granada), Carboneras (Almería) e Ibiza.",
  url: "https://www.oroboats.com",
  email: "info@oroboats.com",
  address: {
    "@type": "PostalAddress",
    addressRegion: "Andalucía",
    addressCountry: "ES",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: "36.7213028",
    longitude: "-3.4962736",
  },
  areaServed: [
    { "@type": "Place", name: "La Herradura, Granada" },
    { "@type": "Place", name: "Carboneras, Almería" },
    { "@type": "Place", name: "Cala de Bou, Ibiza" },
  ],
  openingHours: ["Mo-Su 10:00-21:00"],
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

        {/* La URL canónica se define por página vía Metadata (alternates.canonical),
            no aquí, para que cada página apunte a su propia URL y no a la home. */}
      </head>

      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster />
          {/* ✅ TRACKER SIMPLE - SOLO ESTA LÍNEA AÑADIDA */}
          <SimpleTracker />
          {/* ✅ NUEVO: Banner de consentimiento de cookies */}
          <CookieConsent />
        </Providers>
      </body>
    </html>
  )
}
