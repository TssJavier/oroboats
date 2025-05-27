import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { Navigation } from "@/components/navigation"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { Footer } from "@/components/footer"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user || !user.isAdmin) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <AdminDashboard />
      <Footer />
    </div>
  )
}
