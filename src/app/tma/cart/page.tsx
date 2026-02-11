
"use client"

import { useState } from "react"
import { useShop, useCart, useTelegram } from "../providers"
import { useRouter } from "next/navigation"
import { Loader2, ArrowLeft, Trash2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

export default function CartPage() {
    const { shop } = useShop()
    const { items, removeFromCart, updateQuantity, total, clearCart } = useCart()
    const { user, webApp } = useTelegram()
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    // Form State
    const [comment, setComment] = useState("")

    const handleCheckout = async () => {
        if (!shop || !user) return

        setLoading(true)
        try {
            const orderData = {
                shopId: shop.id,
                telegramId: user.id,
                username: user.username,
                firstName: user.first_name,
                items: items,
                totalAmount: total,
                comment
            }

            const res = await fetch('/api/orders/public', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            })

            if (res.ok) {
                setSuccess(true)
                clearCart()
                webApp?.HapticFeedback.notificationOccurred('success')
            } else {
                webApp?.showAlert("Failed to create order. Please try again.")
            }
        } catch (e) {
            console.error(e)
            webApp?.showAlert("Network error.")
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-4 animate-in zoom-in duration-300">
                <CheckCircle className="w-16 h-16 text-green-500" />
                <h1 className="text-2xl font-bold">Order Placed!</h1>
                <p className="text-muted-foreground">
                    Thank you for your purchase. We will contact you soon.
                </p>
                <Button
                    onClick={() => router.push('/tma')}
                    className="mt-4"
                    style={{ backgroundColor: shop?.primaryColor }}
                >
                    Back to Shop
                </Button>
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-4">
                <h1 className="text-xl font-bold">Your cart is empty</h1>
                <Button variant="outline" onClick={() => router.push('/tma')}>
                    Go Shopping
                </Button>
            </div>
        )
    }

    return (
        <div className="pb-8">
            <div className="sticky top-0 bg-background z-10 border-b p-4 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-bold">Checkout</h1>
            </div>

            <div className="p-4 space-y-6">
                {/* Items List */}
                <div className="space-y-4">
                    {items.map(item => (
                        <Card key={item.id} className="overflow-hidden">
                            <div className="flex">
                                <div className="w-24 h-24 bg-muted">
                                    {item.image && (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    )}
                                </div>
                                <div className="flex-1 p-3 flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-semibold line-clamp-1">{item.name}</h3>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                            onClick={() => removeFromCart(item.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div className="text-sm font-medium">
                                            {shop?.currency} {(item.price * item.quantity).toFixed(2)}
                                        </div>
                                        <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                                            <button
                                                className="w-6 h-6 flex items-center justify-center font-bold"
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            >
                                                -
                                            </button>
                                            <span className="text-sm w-4 text-center">{item.quantity}</span>
                                            <button
                                                className="w-6 h-6 flex items-center justify-center font-bold"
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Message Form */}
                <div className="space-y-4">
                    <h2 className="font-semibold text-lg">Order Message</h2>
                    <div className="space-y-2">
                        <Label>Message (Optional)</Label>
                        <Textarea
                            placeholder="Add any special requests or comments..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                {/* Total & Action */}
                <div className="pt-4 border-t space-y-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total:</span>
                        <span>{shop?.currency} {total.toFixed(2)}</span>
                    </div>

                    <Button
                        className="w-full h-12 text-lg font-bold"
                        style={{ backgroundColor: shop?.primaryColor }}
                        onClick={handleCheckout}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="mr-2 animate-spin" /> : "Place Order"}
                    </Button>
                </div>
            </div>
        </div>
    )
}
