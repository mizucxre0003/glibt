
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-helper'
import { decrypt } from '@/lib/crypto'
import { Telegraf } from 'telegraf'

export async function POST(request: Request) {
    try {
        const user = await getAuthUser()
        if (!user || user.role !== 'SHOP_OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { message, imageUrl } = await request.json()
        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 })
        }

        const shop = await prisma.shop.findUnique({
            where: { id: user.shopId },
            include: { customers: true }
        })

        if (!shop || !shop.botToken) {
            return NextResponse.json({ error: 'Shop or Bot Token not found' }, { status: 404 })
        }

        const botToken = decrypt(shop.botToken)
        const bot = new Telegraf(botToken)

        let sentCount = 0
        let failedCount = 0

        // In a real production app, this should be a background job (Queue)
        // to avoid timeout for large customer bases.
        const customers = shop.customers
        for (const customer of customers) {
            try {
                if (imageUrl) {
                    await bot.telegram.sendPhoto(Number(customer.telegramId), imageUrl, { caption: message })
                } else {
                    await bot.telegram.sendMessage(Number(customer.telegramId), message)
                }
                sentCount++
            } catch (e) {
                console.error(`Failed to send to ${customer.telegramId}`, e)
                failedCount++
            }
        }

        return NextResponse.json({ success: true, sent: sentCount, failed: failedCount })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
