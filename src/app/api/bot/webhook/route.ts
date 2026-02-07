import { NextResponse } from 'next/server'
import { Telegraf } from 'telegraf'
import prisma from '../../../lib/prisma'
import { decrypt } from '../../../lib/crypto'
import { getAuthUser } from '../../../lib/auth-helper'

export async function POST(request: Request) {
    try {
        const user = await getAuthUser()
        if (!user || user.role !== 'SHOP_OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const shop = await prisma.shop.findUnique({
            where: { ownerId: user.userId },
        })

        if (!shop || !shop.botToken) {
            return NextResponse.json({ error: "No bot token configured" }, { status: 400 })
        }

        const token = decrypt(shop.botToken)
        const bot = new Telegraf(token)

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const webhookUrl = `${appUrl}/api/webhook/${shop.id}`

        // Set webhook
        let warning = null
        try {
            await bot.telegram.setWebhook(webhookUrl)
        } catch (e: any) {
            console.error("Webhook set failed:", e.message)
            if (e.message?.includes('HTTPS') || e.description?.includes('HTTPS')) {
                warning = "Webhook requires HTTPS. Bot is configured but will not receive messages on localhost."
            } else {
                throw e
            }
        }

        const botInfo = await bot.telegram.getMe()

        // Update shop status
        await prisma.shop.update({
            where: { id: shop.id },
            data: {
                isBotActive: !warning, // Only active if no warning
                botUsername: botInfo.username,
                botName: botInfo.first_name,
            },
        })

        return NextResponse.json({
            success: true,
            message: warning || "Webhook set successfully",
            warning,
            bot: botInfo
        })

    } catch (error: any) {
        console.error(error)
        return NextResponse.json({ error: "Failed to set webhook: " + error.message }, { status: 500 })
    }
}
