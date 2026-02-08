
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-helper'
import { OrderStatus } from '@prisma/client'

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
        const { status } = body

        if (!status || !Object.values(OrderStatus).includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }

        // Verify order belongs to shop
        const order = await prisma.order.findUnique({
            where: { id: params.id },
            select: { shopId: true }
        })

        if (!order || order.shopId !== user.shopId) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        const updatedOrder = await prisma.order.update({
            where: { id: params.id },
            data: { status },
            include: { customer: true }
        })

        // TODO: Notify customer via bot about status change (future enhancement)

        return NextResponse.json(updatedOrder)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
