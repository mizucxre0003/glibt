import { getAuthUser } from "@/lib/auth-helper"
import { redirect } from "next/navigation"
import Link from 'next/link'
import { LayoutDashboard, Store, LogOut } from 'lucide-react'

export default async function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getAuthUser()

    if (!user || user.role !== 'SUPER_ADMIN') {
        redirect('/admin')
    }

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-zinc-950">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800">
                <div className="p-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        Super Admin
                    </h1>
                </div>

                <nav className="px-4 space-y-2">
                    <Link href="/super-admin" className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                        <LayoutDashboard className="w-5 h-5" />
                        <span>Dashboard</span>
                    </Link>

                    <Link href="/super-admin/shops" className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                        <Store className="w-5 h-5" />
                        <span>Shops</span>
                    </Link>
                </nav>

                <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200 dark:border-zinc-800">
                    <Link href="/admin" className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                        <LogOut className="w-5 h-5" />
                        <span>Exit to Admin</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    )
}
