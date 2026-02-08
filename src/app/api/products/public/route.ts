
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const shopId = searchParams.get('shopId')
    const categoryId = searchParams.get('categoryId')

    if (!shopId) {
        return NextResponse.json({ error: 'Shop ID required' }, { status: 400 })
    }

    try {
        const whereClause: any = {
            shopId,
            isActive: true
        }

        if (categoryId && categoryId !== 'ALL') {
            whereClause.categoryId = categoryId
        }

        const products = await prisma.product.findMany({
            where: whereClause,
            include: { category: true },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(products)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
