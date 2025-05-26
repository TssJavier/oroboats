import { Navigation } from "@/components/navigation"
import { ProfileSection } from "@/components/profile/profile-section"
import { Footer } from "@/components/footer"

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <ProfileSection />
      <Footer />
    </div>
  )
}
