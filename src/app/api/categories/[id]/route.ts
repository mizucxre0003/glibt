import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '../../../../lib/prisma'
import { getAuthUser } from '../../../../lib/auth-helper'

const categoryUpdateSchema = z.object({
    name: z.string().min(1, "Name is required"),
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

        const { id } = params
        const body = await request.json()
        const { name } = categoryUpdateSchema.parse(body)

        // Verify ownership
        const existing = await prisma.category.findFirst({
            where: { id, shopId: user.shopId }
        })

        if (!existing) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 })
        }

        const category = await prisma.category.update({
            where: { id },
            data: { name }
        })

        return NextResponse.json(category)

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

        // Verify ownership
        const existing = await prisma.category.findFirst({
            where: { id, shopId: user.shopId }
        })

        if (!existing) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 })
        }

        await prisma.category.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
