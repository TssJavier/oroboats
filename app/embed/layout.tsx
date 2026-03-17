import type React from "react"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/toaster"

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      <div className="min-h-screen bg-white">
        {children}
      </div>
      <Toaster />
    </Providers>
  )
}
