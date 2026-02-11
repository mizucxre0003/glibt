
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// This endpoint should ideally validate Telegram InitData to ensure the request comes from a real user.
// For now, we assume the frontend sends valid data.
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            shopId,
            telegramId,
            username,
            firstName,
            items,
            totalAmount,
            comment
        } = body

        if (!shopId || !telegramId || !items || items.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 1. Find or Create Customer
        let customer = await prisma.customer.findUnique({
            where: {
                shopId_telegramId: {
                    shopId,
                    telegramId: BigInt(telegramId) // Ensure BigInt
                }
            }
        })

        if (!customer) {
            customer = await prisma.customer.create({
                data: {
                    shopId,
                    telegramId: BigInt(telegramId),
                    username,
                    firstName
                }
            })
        } else {
            // Update customer info if changed
            if (customer.username !== username || customer.firstName !== firstName) {
                await prisma.customer.update({
                    where: { id: customer.id },
                    data: { username, firstName }
                })
            }
        }

        // 2. Create Order
        const order = await prisma.order.create({
            data: {
                shopId,
                customerId: customer.id,
                totalAmount,
                status: 'NEW',
                comment,
                items: {
                    create: items.map((item: any) => ({
                        productId: item.id,
                        quantity: item.quantity,
                        price: item.price
                    }))
                }
            }
        })

        // 3. Send Telegram notification to Shop Owner
        const shop = await prisma.shop.findUnique({
            where: { id: shopId },
            select: { notificationChatId: true, botToken: true }
        })

        if (shop?.notificationChatId && shop?.botToken) {
            try {
                // We need to dynamically import Telegraf here or use a helper to avoid cold start issues if possible,
                // but for now, we'll instantiate it directly to ensure delivery.
                // In a perfect world, we'd use the global cache, but accessing global cache from a different route 
                // might be tricky if they run in different isolated contexts (depending on deployment).
                // Re-instantiating for a single notification is acceptable overhead.

                const { decrypt } = await import('@/lib/crypto')
                const { Telegraf } = await import('telegraf')

                const token = decrypt(shop.botToken)
                const bot = new Telegraf(token)

                const message = `🔔 <b>New Order!</b>\n\n` +
                    `<b>Customer:</b> ${firstName} ${username ? `(@${username})` : ''}\n` +
                    `<b>Total:</b> ${totalAmount}\n` +
                    `<b>Items:</b>\n${items.map((i: any) => `- ${i.name} x${i.quantity}`).join('\n')}\n` +
                    `\n<i>Check the Admin Panel for details.</i>`

                await bot.telegram.sendMessage(shop.notificationChatId, message, { parse_mode: 'HTML' })
            } catch (notifyError) {
                console.error("Failed to send notification:", notifyError)
            }
        }

        // Convert BigInt to string for JSON serialization
        const serializedOrder = JSON.parse(JSON.stringify(order, (key, value) =>
            typeof value === 'bigint'
                ? value.toString()
                : value // return everything else unchanged
        ));

        return NextResponse.json(serializedOrder)

    } catch (error) {
        console.error("Order creation failed:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
