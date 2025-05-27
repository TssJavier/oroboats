import { Navigation } from "@/components/navigation"
import { FiestasSection } from "@/components/fiestas/fiestas-section"
import { Footer } from "@/components/footer"

export default function FiestasPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <FiestasSection />
      <Footer />
    </div>
  )
}
