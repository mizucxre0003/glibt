
"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/i18n"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search, Eye } from "lucide-react"
import { format } from "date-fns"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface Order {
    id: string
    status: string
    totalAmount: number
    createdAt: string
    customer: {
        firstName: string | null
        username: string | null
        telegramId: string
    }
    items: {
        id: string
        quantity: number
        price: number
        product: {
            name: string
        }
    }[]
    address: string | null
    phone: string | null
    comment: string | null
}

const statusColors: Record<string, string> = {
    NEW: "bg-blue-100 text-blue-800",
    ACCEPTED: "bg-yellow-100 text-yellow-800",
    SHIPPING: "bg-purple-100 text-purple-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
}

export default function OrdersPage() {
    const { t } = useLanguage()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("ALL")
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [updating, setUpdating] = useState(false)

    const fetchOrders = async () => {
        setLoading(true)
        const token = localStorage.getItem('token')
        try {
            const res = await fetch('/api/orders', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                setOrders(await res.json())
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchOrders()
    }, [])

    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        if (!confirm(`Change status to ${newStatus}?`)) return
        setUpdating(true)
        const token = localStorage.getItem('token')
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            })

            if (res.ok) {
                fetchOrders()
                if (selectedOrder?.id === orderId) {
                    setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null)
                }
            }
        } catch (e) {
            console.error(e)
        } finally {
            setUpdating(false)
        }
    }

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer.username?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === "ALL" || order.status === statusFilter

        return matchesSearch && matchesStatus
    })

    return (
        <div className="flex flex-col gap-6 p-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Orders</h1>
                <Button onClick={fetchOrders} variant="outline" size="sm" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
                </Button>
            </div>

            <div className="flex gap-4 items-center">
                <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search orders..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Statuses</SelectItem>
                        <SelectItem value="NEW">New</SelectItem>
                        <SelectItem value="ACCEPTED">Accepted</SelectItem>
                        <SelectItem value="SHIPPING">Shipping</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No orders found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredOrders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-mono text-xs">{order.id.slice(-8)}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{order.customer.firstName || "Unknown"}</span>
                                                <span className="text-xs text-muted-foreground">@{order.customer.username}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(order.createdAt), "MMM d, HH:mm")}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={statusColors[order.status] || "bg-gray-100"}>
                                                {order.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>${Number(order.totalAmount).toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}>
                                                <Eye className="h-4 w-4 mr-2" />
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Order Details #{selectedOrder?.id.slice(-8)}</DialogTitle>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-semibold mb-2">Customer Info</h3>
                                    <div className="text-sm space-y-1">
                                        <p><span className="text-muted-foreground">Name:</span> {selectedOrder.customer.firstName}</p>
                                        <p><span className="text-muted-foreground">Username:</span> @{selectedOrder.customer.username}</p>
                                        <p><span className="text-muted-foreground">Phone:</span> {selectedOrder.phone || "-"}</p>
                                        <p><span className="text-muted-foreground">Address:</span> {selectedOrder.address || "-"}</p>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Order Info</h3>
                                    <div className="text-sm space-y-1">
                                        <p><span className="text-muted-foreground">Date:</span> {format(new Date(selectedOrder.createdAt), "PPpp")}</p>
                                        <p><span className="text-muted-foreground">Comment:</span> {selectedOrder.comment || "-"}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-muted rounded-lg">
                                    <h3 className="font-semibold mb-2">Update Status</h3>
                                    <Select
                                        value={selectedOrder.status}
                                        onValueChange={(val) => handleStatusUpdate(selectedOrder.id, val)}
                                        disabled={updating}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NEW">New</SelectItem>
                                            <SelectItem value="ACCEPTED">Accepted</SelectItem>
                                            <SelectItem value="SHIPPING">Shipping</SelectItem>
                                            <SelectItem value="COMPLETED">Completed</SelectItem>
                                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-4">Items</h3>
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                    {selectedOrder.items.map(item => (
                                        <div key={item.id} className="flex justify-between items-start border-b pb-4 last:border-0">
                                            <div>
                                                <p className="font-medium">{item.product.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {item.quantity} x ${Number(item.price).toFixed(2)}
                                                </p>
                                            </div>
                                            <p className="font-mono font-medium">
                                                ${(Number(item.price) * item.quantity).toFixed(2)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 pt-4 border-t flex justify-between items-center">
                                    <span className="font-bold text-lg">Total</span>
                                    <span className="font-bold text-xl">${Number(selectedOrder.totalAmount).toFixed(2)}</span>
                                </div>

                                <div className="mt-8 pt-6 border-t">
                                    <h3 className="font-semibold mb-2">Send Message to Customer</h3>
                                    <div className="space-y-2">
                                        <textarea
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder="Type your message here..."
                                            id="message-input"
                                        />
                                        <Button
                                            size="sm"
                                            onClick={async (e) => {
                                                const btn = e.currentTarget
                                                const input = document.getElementById('message-input') as HTMLTextAreaElement
                                                const message = input.value
                                                if (!message) return

                                                btn.disabled = true
                                                btn.innerText = "Sending..."

                                                const token = localStorage.getItem('token')
                                                try {
                                                    const res = await fetch(`/api/orders/${selectedOrder.id}/message`, {
                                                        method: 'POST',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                            'Authorization': `Bearer ${token}`
                                                        },
                                                        body: JSON.stringify({ message })
                                                    })

                                                    if (res.ok) {
                                                        alert("Message sent!")
                                                        input.value = ""
                                                    } else {
                                                        alert("Failed to send message.")
                                                    }
                                                } catch (err) {
                                                    console.error(err)
                                                    alert("Error sending message.")
                                                } finally {
                                                    btn.disabled = false
                                                    btn.innerText = "Send Message"
                                                }
                                            }}
                                        >
                                            Send Message
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div >
    )
}
