
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { id } = params

    // We might want to check shopId context if possible, but basic security is "knowing the ID".
    // For extra security, we could require shopId in query params and validate it matches.

    try {
        const product = await prisma.product.findUnique({
            where: { id },
            include: { category: true }
        })

        if (!product || !product.isActive) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }

        return NextResponse.json(product)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
