import { Navigation } from "@/components/navigation"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { Footer } from "@/components/footer"

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <AdminDashboard />
      <Footer />
    </div>
  )
}
