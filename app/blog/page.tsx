import { BlogSection } from "@/components/blog/blog-section"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"

export const metadata = {
  metadataBase: new URL("https://www.oroboats.com"),
  title: "Blog - OroBoats | Consejos y experiencias de deportes acuáticos",
  description:
    "Consejos, rutas y experiencias sobre alquiler de barcos y motos de agua en La Herradura, Carboneras e Ibiza. Descúbrelo en el blog de OroBoats.",
  alternates: { canonical: "/blog" },
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
