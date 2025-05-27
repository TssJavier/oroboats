import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/home/hero-section"
import { ServicesSection } from "@/components/home/services-section"
import { LocationSection } from "@/components/home/location-section"
import { ContactSection } from "@/components/home/contact-section"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <HeroSection />
      <ServicesSection />
      <LocationSection />
      <ContactSection />
      <Footer />
    </div>
  )
}
