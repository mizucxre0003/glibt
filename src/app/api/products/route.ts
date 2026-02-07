import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '../../../../lib/prisma'
import { getAuthUser } from '../../../../lib/auth-helper'

const productCreateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    price: z.coerce.number().min(0),
    stock: z.coerce.number().int().min(0).default(0),
    imageUrl: z.string().optional(),
    categoryId: z.string().optional(),
    isActive: z.boolean().default(true)
})

export async function GET(request: Request) {
    try {
        const user = await getAuthUser()
        if (!user || user.role !== 'SHOP_OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const products = await prisma.product.findMany({
            where: { shopId: user.shopId },
            include: {
                category: true
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(products)
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
        const data = productCreateSchema.parse(body)

        // Verify category ownership if provided
        if (data.categoryId) {
            const category = await prisma.category.findFirst({
                where: { id: data.categoryId, shopId: user.shopId }
            })
            if (!category) {
                return NextResponse.json({ error: "Invalid Category" }, { status: 400 })
            }
        }

        const product = await prisma.product.create({
            data: {
                name: data.name,
                description: data.description,
                price: data.price,
                stock: data.stock,
                images: data.imageUrl ? [data.imageUrl] : [],
                isActive: data.isActive,
                category: data.categoryId ? { connect: { id: data.categoryId } } : undefined,
                shop: { connect: { id: user.shopId } }
            }
        })

        return NextResponse.json(product)

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 })
        }
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
