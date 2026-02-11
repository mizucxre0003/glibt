import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-helper'
import { z } from 'zod'

const configSchema = z.object({
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
    welcomeMessage: z.string().optional(),
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
                primaryColor: true,
                welcomeMessage: true
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
        const validated = configSchema.parse(body)

        const shop = await prisma.shop.update({
            where: { id: user.shopId },
            data: validated
        })

        return NextResponse.json({
            primaryColor: shop.primaryColor,
            welcomeMessage: shop.welcomeMessage
        })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 })
        }
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
