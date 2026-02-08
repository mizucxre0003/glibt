import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-helper'

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getAuthUser()
        if (!user || user.role !== 'SHOP_OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { message } = await request.json()
        const orderId = params.id

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 })
        }

        // 1. Fetch Order and Shop
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                customer: true,
                shop: {
                    select: {
                        ownerId: true,
                        botToken: true
                    }
                }
            }
        })

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        // 2. Verify Ownership
        if (order.shop.ownerId !== user.userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const customerTelegramId = order.customer.telegramId

        // 3. Send Message via Bot
        try {
            const { decrypt } = await import('@/lib/crypto')
            const { Telegraf } = await import('telegraf')

            const token = decrypt(order.shop.botToken)
            const bot = new Telegraf(token)

            await bot.telegram.sendMessage(Number(customerTelegramId), `📩 <b>Message from Store:</b>\n\n${message}`, { parse_mode: 'HTML' })

            return NextResponse.json({ success: true })
        } catch (botError) {
            console.error("Failed to send message via bot:", botError)
            return NextResponse.json({ error: 'Failed to send message. Bot might be blocked by user.' }, { status: 500 })
        }

    } catch (error) {
        console.error("Message API Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
