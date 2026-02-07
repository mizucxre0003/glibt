"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/i18n"
import { LanguageSwitcher } from "@/components/language-switcher"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const [mounted, setMounted] = useState(false)
    const { t } = useLanguage()

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleLogout = () => {
        localStorage.removeItem('token')
        router.push('/admin/login')
    }

    // Hide navigation on auth pages
    const isAuthPage = pathname?.includes('/login') || pathname?.includes('/register')

    if (!mounted) return null

    if (isAuthPage) {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col">
                <div className="absolute top-4 right-4 z-50">
                    <LanguageSwitcher />
                </div>
                <div className="flex-1 flex items-center justify-center">
                    {children}
                </div>
            </div>
        )
    }

    const navigation = [
        { name: t('nav.dashboard'), href: '/admin/dashboard' },
        { name: t('nav.products'), href: '/admin/products' },
        { name: t('nav.categories'), href: '/admin/categories' },
        { name: t('nav.orders'), href: '/admin/orders' },
        { name: t('nav.botConfig'), href: '/admin/bot-config' },
        { name: t('nav.marketing'), href: '/admin/marketing' },
    ]

    return (
        <div className="min-h-screen text-foreground flex flex-col">
            {/* Top Navbar */}
            <header className="border-b border-border bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/20 sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href="/admin/dashboard" className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                            Glim
                        </Link>

                        <nav className="hidden md:flex items-center gap-6">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`text-sm font-medium transition-colors hover:text-primary ${isActive ? "text-primary" : "text-muted-foreground"
                                            }`}
                                    >
                                        {item.name}
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        <LanguageSwitcher />
                        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
                            <LogOut className="h-4 w-4 mr-2" />
                            {t('nav.logout')}
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    )
}
