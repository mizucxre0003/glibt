"use client"

import { useEffect, useState } from "react"
import { useCart, useShop, useTelegram } from "../../providers"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Minus, Plus, ShoppingCart, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface Product {
    id: string
    name: string
    description: string | null
    price: number
    images: string[]
    imageUrl: string | null // fallback
    category: { name: string } | null
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
    const { id } = params
    const router = useRouter()
    const { webApp } = useTelegram()
    const { shop } = useShop()
    const { addToCart, items } = useCart()
    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    useEffect(() => {
        if (webApp) {
            webApp.BackButton.show()
            webApp.BackButton.onClick(() => router.back())
            return () => {
                webApp.BackButton.hide()
                webApp.BackButton.offClick(() => router.back())
            }
        }
    }, [webApp, router])

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await fetch(`/api/products/public/${id}`)
                if (res.ok) {
                    setProduct(await res.json())
                }
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchProduct()
    }, [id])

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    if (!product) {
        return <div className="min-h-screen flex items-center justify-center">Product not found</div>
    }

    const images = product.images && product.images.length > 0
        ? product.images
        : product.imageUrl ? [product.imageUrl] : []

    // Fallback placeholder
    if (images.length === 0) images.push("https://placehold.co/600x400?text=No+Image")

    const handleNextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length)
    }

    const handlePrevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Image Carousel */}
            <div className="relative w-full aspect-square bg-zinc-100 dark:bg-zinc-800">
                <img
                    src={images[currentImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                />

                {images.length > 1 && (
                    <>
                        <button onClick={handlePrevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full backdrop-blur-sm">
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                        <button onClick={handleNextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transform rotate-180">
                            <ChevronLeft className="h-6 w-6" />
                        </button>

                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                            {images.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/50'}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold">{product.name}</h1>
                        <p className="text-muted-foreground text-sm">{product.category?.name}</p>
                    </div>
                    <div className="text-xl font-bold text-primary">
                        {Number(product.price).toFixed(2)} {shop?.currency}
                    </div>
                </div>

                {product.description && (
                    <div className="prose dark:prose-invert text-sm text-gray-600 dark:text-gray-300">
                        {product.description}
                    </div>
                )}
            </div>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border z-10 safe-area-bottom">
                <Button
                    className="w-full text-lg h-12 rounded-xl shadow-lg transform transition active:scale-95"
                    style={{ backgroundColor: 'var(--primary)', color: '#fff' }}
                    onClick={() => {
                        addToCart(product)
                        // Optional: Show animation or simple alert
                    }}
                >
                    <Plus className="mr-2 h-5 w-5" />
                    Add to Cart
                </Button>
            </div>
        </div>
    )
}
