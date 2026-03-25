import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <nav className="border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin/recipes" className="font-semibold text-orange-500">
            菜谱管理
          </Link>
          <Link href="/admin/events">聚餐活动</Link>
          <Link href="/admin/tags">标签</Link>
        </div>
        <form action="/api/auth/logout" method="POST">
          <Button variant="ghost" size="sm" type="submit">退出</Button>
        </form>
      </nav>
      <main className="container mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
