import { BlogSection } from "@/components/blog/blog-section"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"

export const metadata = {
  metadataBase: new URL("https://your-domain.com"), // ✅ Reemplaza con tu dominio real
  title: "Blog - Oro Boats | Consejos y Experiencias de Deportes Acuáticos",
  description:
    "Descubre consejos, noticias y experiencias sobre deportes acuáticos, alquiler de barcos y motos de agua en nuestro blog.",
}

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <BlogSection />
      <Footer />
    </div>
  )
}
