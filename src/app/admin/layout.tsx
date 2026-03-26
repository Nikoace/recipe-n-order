import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChefHat, BookOpen, CalendarDays, Tags, LogOut } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <nav className="border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin/recipes" className="flex items-center gap-2 font-bold text-orange-500">
            <ChefHat className="h-5 w-5" />
            Recipe &amp; Order
          </Link>
          <Link href="/admin/recipes" className="flex items-center gap-1.5 text-sm hover:text-orange-500 transition-colors">
            <BookOpen className="h-4 w-4" />
            菜谱管理
          </Link>
          <Link href="/admin/events" className="flex items-center gap-1.5 text-sm hover:text-orange-500 transition-colors">
            <CalendarDays className="h-4 w-4" />
            聚餐活动
          </Link>
          <Link href="/admin/tags" className="flex items-center gap-1.5 text-sm hover:text-orange-500 transition-colors">
            <Tags className="h-4 w-4" />
            标签
          </Link>
        </div>
        <form action="/api/auth/logout" method="POST">
          <Button variant="ghost" size="sm" type="submit" className="flex items-center gap-1.5">
            <LogOut className="h-4 w-4" />
            退出
          </Button>
        </form>
      </nav>
      <main className="container mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
