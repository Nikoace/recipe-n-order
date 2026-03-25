import React from "react"

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-orange-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3">
          <span className="text-orange-500 font-semibold text-lg">Recipe &amp; Order</span>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
