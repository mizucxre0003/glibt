import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Telegraf } from 'telegraf'
import prisma from '@/lib/prisma'
import { encrypt } from '@/lib/crypto'
import { getAuthUser } from '@/lib/auth-helper'

const tokenSchema = z.object({
    token: z.string().min(10, "Token is too short"),
})

export async function PUT(request: Request) {
    try {
        const user = await getAuthUser()
        if (!user || user.role !== 'SHOP_OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { token } = tokenSchema.parse(body)

        // Verify token is valid with Telegram
        let botInfo;
        try {
            const bot = new Telegraf(token)

            // Add 5s timeout to prevent 504 (Vercel/Next.js default is often 10s)
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Telegram API timeout")), 5000)
            );

            botInfo = await Promise.race([
                bot.telegram.getMe(),
                timeoutPromise
            ]) as any;

        } catch (e: any) {
            console.error("Telegram verification failed:", e);
            if (e.message === "Telegram API timeout") {
                return NextResponse.json({ error: "Connection to Telegram timed out. Please try again." }, { status: 504 })
            }
            return NextResponse.json({ error: "Invalid Telegram Bot Token or connection failed." }, { status: 400 })
        }

        // Check if bot is already used by another shop
        const existingShop = await prisma.shop.findFirst({
            where: {
                botUsername: botInfo.username,
                id: { not: user.shopId }
            }
        })

        if (existingShop) {
            return NextResponse.json({ error: "This bot is already connected to another shop." }, { status: 400 })
        }

        const encryptedToken = encrypt(token)

        // Update shop with new token
        await prisma.shop.update({
            where: { id: user.shopId },
            data: {
                botToken: encryptedToken,
                botUsername: botInfo.username,
                botName: botInfo.first_name,
                // Reset webhook status when token changes
                isBotActive: false,
            },
        })

        return NextResponse.json({ success: true, message: "Bot token saved successfully" })

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: (error as z.ZodError).issues }, { status: 400 })
        }
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const user = await getAuthUser()
        if (!user || user.role !== 'SHOP_OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await prisma.shop.update({
            where: { id: user.shopId },
            data: {
                botToken: "", // Empty string to indicate no token
                botUsername: null,
                botName: null,
                isBotActive: false
            }
        })

        return NextResponse.json({ success: true, message: "Bot unlinked successfully" })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
