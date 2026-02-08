
"use client"

import { useState, useEffect } from "react"
import { useShop, useCart, useTelegram } from "./providers"
import { Loader2, Plus, ShoppingCart, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

interface Product {
    id: string
    name: string
    description: string
    price: number
    images: string[]
    categoryId: string | null
}

interface Category {
    id: string
    name: string
}

export default function CatalogPage() {
    const { shop, loading: shopLoading } = useShop()
    const { addToCart, removeFromCart, updateQuantity, items, total } = useCart()
    const { ready } = useTelegram()
    const router = useRouter()

    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (shop?.id) {
            const fetchData = async () => {
                setLoading(true)
                try {
                    const [prodRes, catRes] = await Promise.all([
                        fetch(`/api/products/public?shopId=${shop.id}`),
                        fetch(`/api/categories/public?shopId=${shop.id}`)
                    ])

                    if (prodRes.ok) setProducts(await prodRes.json())
                    if (catRes.ok) setCategories(await catRes.json())
                } catch (e) {
                    console.error(e)
                } finally {
                    setLoading(false)
                }
            }
            fetchData()
        }
    }, [shop?.id])

    if (shopLoading || !ready) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>
    }

    if (!shop) {
        return <div className="p-8 text-center">Shop not found or invalid link.</div>
    }

    const filteredProducts = selectedCategory === "ALL"
        ? products
        : products.filter(p => p.categoryId === selectedCategory)

    const getItemQty = (id: string) => items.find(i => i.id === id)?.quantity || 0

    return (
        <div className="pb-24">
            {/* Header / Welcome */}
            <div
                className="p-6 text-white rounded-b-3xl shadow-lg mb-6 transition-colors duration-300"
                style={{ backgroundColor: shop.primaryColor }}
            >
                <h1 className="text-2xl font-bold mb-1">{shop.name || "My Shop"}</h1>
                <p className="opacity-90 text-sm">{shop.welcomeMessage || "Welcome!"}</p>
            </div>

            {/* Categories */}
            <div className="px-4 mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <Button
                    variant={selectedCategory === "ALL" ? "default" : "outline"}
                    size="sm"
                    className="rounded-full whitespace-nowrap"
                    onClick={() => setSelectedCategory("ALL")}
                    style={selectedCategory === "ALL" ? { backgroundColor: shop.primaryColor } : {}}
                >
                    All
                </Button>
                {categories.map(cat => (
                    <Button
                        key={cat.id}
                        variant={selectedCategory === cat.id ? "default" : "outline"}
                        size="sm"
                        className="rounded-full whitespace-nowrap"
                        onClick={() => setSelectedCategory(cat.id)}
                        style={selectedCategory === cat.id ? { backgroundColor: shop.primaryColor } : {}}
                    >
                        {cat.name}
                    </Button>
                ))}
            </div>

            {/* Products Grid */}
            <div className="px-4 grid grid-cols-2 gap-4">
                {loading ? (
                    <div className="col-span-2 text-center py-10"><Loader2 className="animate-spin mx-auto" /></div>
                ) : filteredProducts.length === 0 ? (
                    <div className="col-span-2 text-center py-10 text-muted-foreground">No products found.</div>
                ) : (
                    filteredProducts.map(product => (
                        <div key={product.id} className="bg-card rounded-xl overflow-hidden shadow-sm border border-border flex flex-col">
                            <div
                                className="aspect-square bg-muted relative cursor-pointer"
                                onClick={() => router.push(`/tma/product/${product.id}`)}
                            >
                                {product.images?.[0] ? (
                                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gray-100">
                                        No Image
                                    </div>
                                )}
                                {getItemQty(product.id) > 0 && (
                                    <div className="absolute top-2 right-2 bg-black/70 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                                        {getItemQty(product.id)}
                                    </div>
                                )}
                            </div>
                            <div className="p-3 flex-1 flex flex-col">
                                <h3 className="font-semibold text-sm line-clamp-2 mb-1">{product.name}</h3>
                                <div className="mt-auto flex items-center justify-between">
                                    <span className="font-bold text-sm">
                                        {shop.currency === 'USD' ? '$' : shop.currency} {Number(product.price)}
                                    </span>

                                    {getItemQty(product.id) === 0 ? (
                                        <Button
                                            size="icon"
                                            className="h-8 w-8 rounded-full"
                                            style={{ backgroundColor: shop.primaryColor }}
                                            onClick={() => addToCart(product)}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    ) : (
                                        <div className="flex items-center gap-2 bg-muted rounded-full p-0.5">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7 rounded-full hover:bg-background"
                                                onClick={() => updateQuantity(product.id, getItemQty(product.id) - 1)}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="text-xs font-medium w-3 text-center">{getItemQty(product.id)}</span>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7 rounded-full hover:bg-background"
                                                onClick={() => addToCart(product)}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Cart Floating Button */}
            {items.length > 0 && (
                <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom duration-300">
                    <Button
                        className="w-full h-12 shadow-xl flex justify-between items-center text-base"
                        style={{ backgroundColor: shop.primaryColor }}
                        onClick={() => router.push('/tma/cart')}
                    >
                        <div className="flex items-center gap-2">
                            <div className="bg-white/20 px-2 py-0.5 rounded text-sm font-bold">
                                {items.reduce((s, i) => s + i.quantity, 0)} items
                            </div>
                        </div>
                        <span className="font-bold">
                            View Cart • {shop.currency} {total.toFixed(2)}
                        </span>
                    </Button>
                </div>
            )}
        </div>
    )
}
