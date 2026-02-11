import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-helper'
import { Prisma } from '@prisma/client'

export async function GET(request: Request) {
    try {
        const user = await getAuthUser()
        if (!user || user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const search = searchParams.get('search') || ''
        const skip = (page - 1) * limit

        const where: Prisma.ShopWhereInput = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { owner: { email: { contains: search, mode: 'insensitive' } } },
                { botUsername: { contains: search, mode: 'insensitive' } }
            ]
        } : {}

        const [shops, total] = await prisma.$transaction([
            prisma.shop.findMany({
                where,
                skip,
                take: limit,
                include: {
                    owner: {
                        select: { email: true }
                    },
                    _count: {
                        select: { orders: true, products: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.shop.count({ where })
        ])

        return NextResponse.json({
            shops,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page,
                limit
            }
        })

    } catch (error) {
        console.error('[SuperAdmin] Error fetching shops:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
