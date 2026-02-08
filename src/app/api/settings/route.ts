import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-helper'

const settingsSchema = z.object({
    currency: z.string().min(1).max(10),
    primaryColor: z.string().optional().default("#000000"),
    welcomeMessage: z.string().optional(),
    notificationChatId: z.string().optional(),
})

export async function GET(request: Request) {
    try {
        const user = await getAuthUser()
        if (!user || user.role !== 'SHOP_OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const shop = await prisma.shop.findUnique({
            where: { id: user.shopId },
            select: {
                currency: true,
                primaryColor: true,
                welcomeMessage: true,
                notificationChatId: true
            }
        })

        if (!shop) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
        }

        return NextResponse.json(shop)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const user = await getAuthUser()
        if (!user || user.role !== 'SHOP_OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const data = settingsSchema.parse(body)

        const shop = await prisma.shop.update({
            where: { id: user.shopId },
            data: {
                currency: data.currency,
                primaryColor: data.primaryColor,
                welcomeMessage: data.welcomeMessage,
                notificationChatId: data.notificationChatId
            }
        })

        return NextResponse.json(shop)

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: (error as z.ZodError).issues }, { status: 400 })
        }
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
