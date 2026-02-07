import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-helper'

export async function GET(request: Request) {
    try {
        const user = await getAuthUser()
        if (!user || user.role !== 'SHOP_OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const shop = await prisma.shop.findUnique({
            where: { ownerId: user.userId },
            select: {
                isBotActive: true,
                botUsername: true,
                botName: true,
                botToken: true,
            }
        })

        if (!shop) {
            return NextResponse.json({ error: "Shop not found" }, { status: 404 })
        }

        return NextResponse.json({
            configured: !!shop.botToken,
            active: shop.isBotActive,
            username: shop.botUsername,
            name: shop.botName
        })

    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
