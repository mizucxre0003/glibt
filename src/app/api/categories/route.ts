import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-helper'

const categoryCreateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    productIds: z.array(z.string()).optional()
})

export async function GET(request: Request) {
    try {
        const user = await getAuthUser()
        if (!user || user.role !== 'SHOP_OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const categories = await prisma.category.findMany({
            where: { shopId: user.shopId },
            include: {
                _count: {
                    select: { products: true }
                },
                products: {
                    select: { id: true, name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(categories)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const user = await getAuthUser()
        if (!user || user.role !== 'SHOP_OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { name, productIds } = categoryCreateSchema.parse(body)

        const category = await prisma.category.create({
            data: {
                name,
                shopId: user.shopId!,
                products: productIds && productIds.length > 0 ? {
                    connect: productIds.map(id => ({ id }))
                } : undefined
            }
        })

        return NextResponse.json(category)

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: (error as z.ZodError).issues }, { status: 400 })
        }
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
