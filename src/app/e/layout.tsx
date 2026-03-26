import React from "react"
import { Toaster } from "@/components/ui/sonner"
import { UtensilsCrossed } from "lucide-react"

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-orange-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3">
          <span className="text-orange-500 font-semibold text-lg flex items-center gap-1.5">
            <UtensilsCrossed className="h-5 w-5" />
            Recipe &amp; Order
          </span>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">{children}</main>
      <Toaster />
    </div>
  )
}
