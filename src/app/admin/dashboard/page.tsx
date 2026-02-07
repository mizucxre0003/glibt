"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { setToken } from "@/lib/auth-client" // Assuming we might need utilities later

import { useLanguage } from "@/lib/i18n"

export default function DashboardPage() {
    const router = useRouter()
    const { t } = useLanguage()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token')
            if (!token) {
                router.push('/admin/login')
                return
            }

            try {
                const res = await fetch('/api/auth/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })

                if (!res.ok) {
                    throw new Error('Unauthorized')
                }

                const data = await res.json()
                setUser(data)
            } catch (error) {
                localStorage.removeItem('token')
                router.push('/admin/login')
            } finally {
                setLoading(false)
            }
        }

        fetchUser()
    }, [router])

    if (loading) return <div className="p-8">Loading...</div>
    if (!user) return null

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">{t('common.managerDashboard')}</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-white rounded-lg shadow dark:bg-zinc-800">
                    <h2 className="text-xl font-bold mb-2">{t('common.myShop')}</h2>
                    <p>{t('common.name')}: {user.shop?.name}</p>
                    <p>{t('common.status')}: {user.shop?.isActive ? t('common.active') : t('common.inactive')}</p>
                </div>

                <div className="p-6 bg-white rounded-lg shadow dark:bg-zinc-800">
                    <h2 className="text-xl font-bold mb-2">{t('common.quickStats')}</h2>
                    <p>{t('common.orders')}: 0</p>
                    <p>{t('common.revenue')}: $0.00</p>
                </div>
            </div>
        </div>
    )
}
