
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-helper'

export async function GET(request: Request) {
    try {
        const user = await getAuthUser()
        if (!user || user.role !== 'SHOP_OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const orders = await prisma.order.findMany({
            where: { shopId: user.shopId },
            include: {
                customer: true,
                items: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Serialize BigInt to string for JSON
        const serializedOrders = JSON.parse(JSON.stringify(orders, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ))

        return NextResponse.json(serializedOrders)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
