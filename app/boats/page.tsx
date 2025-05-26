import { Navigation } from "@/components/navigation"
import { BoatsSection } from "@/components/boats/boats-section"
import { Footer } from "@/components/footer"

export default function BoatsPage() {
  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <BoatsSection />
      <Footer />
    </div>
  )
}
