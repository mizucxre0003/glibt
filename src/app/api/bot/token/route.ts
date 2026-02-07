import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Telegraf } from 'telegraf'
import prisma from '../../../lib/prisma'
import { encrypt } from '../../../lib/crypto'
import { getAuthUser } from '../../../lib/auth-helper'

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
        try {
            const bot = new Telegraf(token)
            await bot.telegram.getMe()
        } catch (e: any) {
            return NextResponse.json({ error: "Invalid Telegram Bot Token. Please check and try again." }, { status: 400 })
        }

        const encryptedToken = encrypt(token)

        // Update shop with new token
        await prisma.shop.update({
            where: { ownerId: user.userId },
            data: {
                botToken: encryptedToken,
                // Reset webhook status when token changes
                isBotActive: false,
                botName: null,
                botUsername: null,
            },
        })

        return NextResponse.json({ success: true, message: "Bot token saved successfully" })

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 })
        }
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
