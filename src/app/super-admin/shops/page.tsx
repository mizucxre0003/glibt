"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2, Ban, CheckCircle } from "lucide-react"
import { useLanguage } from "@/lib/i18n"

interface Shop {
    id: string
    name: string
    owner: { email: string }
    botUsername: string
    createdAt: string
    isBanned: boolean
    _count: {
        products: number
        orders: number
    }
}

export default function SuperAdminShops() {
    const [shops, setShops] = useState<Shop[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    const fetchShops = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/super-admin/shops?search=${search}`)
            const data = await res.json()
            if (res.ok) {
                setShops(data.shops)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchShops()
        }, 500)
        return () => clearTimeout(timer)
    }, [search])

    const toggleBan = async (shop: Shop) => {
        if (!confirm(`Are you sure you want to ${shop.isBanned ? 'unban' : 'ban'} this shop?`)) return

        try {
            const res = await fetch(`/api/super-admin/shops/${shop.id}/ban`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ banned: !shop.isBanned })
            })

            if (res.ok) {
                setShops(shops.map(s => s.id === shop.id ? { ...s, isBanned: !s.isBanned } : s))
            }
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Shops Management</h1>
                <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search shops..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Shops</CardTitle>
                    <CardDescription>Manage all registered shops on the platform.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Shop Name</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead>Bot</TableHead>
                                <TableHead>Stats</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : shops.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        No shops found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                shops.map((shop) => (
                                    <TableRow key={shop.id}>
                                        <TableCell className="font-medium">{shop.name || "Untitled"}</TableCell>
                                        <TableCell>{shop.owner.email}</TableCell>
                                        <TableCell>{shop.botUsername ? `@${shop.botUsername}` : "-"}</TableCell>
                                        <TableCell>
                                            <div className="text-xs text-muted-foreground">
                                                <div>Products: {shop._count.products}</div>
                                                <div>Orders: {shop._count.orders}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {shop.isBanned ? (
                                                <Badge variant="destructive">Banned</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                                                    Active
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant={shop.isBanned ? "outline" : "destructive"}
                                                size="sm"
                                                onClick={() => toggleBan(shop)}
                                            >
                                                {shop.isBanned ? (
                                                    <>
                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                        Unban
                                                    </>
                                                ) : (
                                                    <>
                                                        <Ban className="w-4 h-4 mr-2" />
                                                        Ban
                                                    </>
                                                )}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
