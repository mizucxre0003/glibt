
"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

// --- Telegram Context ---
interface TelegramContextType {
    webApp: any
    user: any
    startParam: string | null
    ready: boolean
}

const TelegramContext = createContext<TelegramContextType>({
    webApp: null,
    user: null,
    startParam: null,
    ready: false
})

export const useTelegram = () => useContext(TelegramContext)

// --- Shop Context ---
interface ShopSettings {
    id: string
    name: string
    currency: string
    primaryColor: string
    welcomeMessage?: string
    botUsername?: string
}

interface ShopContextType {
    shop: ShopSettings | null
    loading: boolean
}

const ShopContext = createContext<ShopContextType>({
    shop: null,
    loading: true
})

export const useShop = () => useContext(ShopContext)

// --- Cart Context ---
export interface CartItem {
    id: string // Product ID
    name: string
    price: number
    quantity: number
    image?: string
}

interface CartContextType {
    items: CartItem[]
    addToCart: (product: any) => void
    removeFromCart: (productId: string) => void
    updateQuantity: (productId: string, quantity: number) => void
    clearCart: () => void
    total: number
}

const CartContext = createContext<CartContextType>({
    items: [],
    addToCart: () => { },
    removeFromCart: () => { },
    updateQuantity: () => { },
    clearCart: () => { },
    total: 0
})

export const useCart = () => useContext(CartContext)

// --- Main Provider Component ---
export function TMAProvider({ children }: { children: ReactNode }) {
    const [webApp, setWebApp] = useState<any>(null)
    const [ready, setReady] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [startParam, setStartParam] = useState<string | null>(null)

    // Shop State
    const [shop, setShop] = useState<ShopSettings | null>(null)
    const [shopLoading, setShopLoading] = useState(true)

    // Cart State
    const [cartItems, setCartItems] = useState<CartItem[]>([])

    // 1. Initialize Telegram
    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
            const tg = (window as any).Telegram.WebApp
            tg.ready()

            setWebApp(tg)
            setUser(tg.initDataUnsafe?.user || null)
            setStartParam(tg.initDataUnsafe?.start_param || null)
            setReady(true)

            // Dynamic Theme Color
            if (shop?.primaryColor) {
                tg.setHeaderColor(shop.primaryColor)
                tg.setBackgroundColor(tg.themeParams.bg_color)
            }
        }
    }, [shop?.primaryColor])

    // 2. Fetch Shop Data
    useEffect(() => {
        const fetchShop = async () => {
            // Priority: startParam -> Default (if single shop env) -> Error
            // For now, we fetch a "public" shop endpoint. 
            // We need to create an API that doesn't require Auth header for TMA, 
            // but validates via initData (later). For now open.

            // If no startParam, we might fail or try to fetch the first shop (for demo)
            let url = `/api/shop/public` // We need to create this!

            // Check URL query params for shopId (from Menu Button)
            const urlParams = new URLSearchParams(window.location.search)
            const queryShopId = urlParams.get('shopId')

            if (!startParam && !queryShopId) {
                console.error("No shopId found in URL or startParam")
                // Don't set shop to null (it's already null), just stop loading
                setShopLoading(false)
                return
            }

            if (startParam) {
                url += `?id=${startParam}`
            } else if (queryShopId) {
                url += `?id=${queryShopId}`
            }

            try {
                const res = await fetch(url)
                if (res.ok) {
                    const data = await res.json()
                    setShop(data)
                } else {
                    console.error("Shop fetch failed:", res.status, await res.text())
                }
            } catch (e) {
                console.error("Failed to fetch shop", e)
            } finally {
                setShopLoading(false)
            }
        }

        fetchShop()
    }, [startParam])

    // 3. Cart Logic
    const addToCart = (product: any) => {
        setCartItems(prev => {
            const existing = prev.find(item => item.id === product.id)
            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            }
            return [...prev, {
                id: product.id,
                name: product.name,
                price: Number(product.price),
                quantity: 1,
                image: product.images?.[0]
            }]
        })

        // Haptic Feedback
        if (webApp) webApp.HapticFeedback.notificationOccurred('success')
    }

    const removeFromCart = (productId: string) => {
        setCartItems(prev => prev.filter(item => item.id !== productId))
    }

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId)
            return
        }
        setCartItems(prev => prev.map(item =>
            item.id === productId ? { ...item, quantity } : item
        ))
    }

    const clearCart = () => setCartItems([])

    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    return (
        <TelegramContext.Provider value={{ webApp, user, startParam, ready }}>
            <ShopContext.Provider value={{ shop, loading: shopLoading }}>
                <CartContext.Provider value={{ items: cartItems, addToCart, removeFromCart, updateQuantity, clearCart, total }}>
                    <div style={{
                        '--primary': shop?.primaryColor || '#000000',
                    } as React.CSSProperties}>
                        {children}
                    </div>
                </CartContext.Provider>
            </ShopContext.Provider>
        </TelegramContext.Provider>
    )
}
