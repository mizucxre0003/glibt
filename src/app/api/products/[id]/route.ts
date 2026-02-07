import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '../../../../lib/prisma'
import { getAuthUser } from '../../../../lib/auth-helper'

const productUpdateSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    price: z.coerce.number().min(0).optional(),
    stock: z.coerce.number().int().min(0).optional(),
    imageUrl: z.string().optional(),
    categoryId: z.string().optional().nullable(),
    isActive: z.boolean().optional()
})

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getAuthUser()
        if (!user || user.role !== 'SHOP_OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const data = productUpdateSchema.parse(body)
        const { id } = params

        // Verify ownership
        const existing = await prisma.product.findFirst({
            where: { id, shopId: user.shopId }
        })

        if (!existing) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 })
        }

        // Verify category ownership if provided
        if (data.categoryId) {
            const category = await prisma.category.findFirst({
                where: { id: data.categoryId, shopId: user.shopId }
            })
            if (!category) {
                return NextResponse.json({ error: "Invalid Category" }, { status: 400 })
            }
        }

        const product = await prisma.product.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                price: data.price,
                stock: data.stock,
                images: data.imageUrl ? [data.imageUrl] : undefined,
                isActive: data.isActive,
                category: data.categoryId ? { connect: { id: data.categoryId } } : data.categoryId === null ? { disconnect: true } : undefined
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

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getAuthUser()
        if (!user || user.role !== 'SHOP_OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = params

        const existing = await prisma.product.findFirst({
            where: { id, shopId: user.shopId }
        })

        if (!existing) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 })
        }

        await prisma.product.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
