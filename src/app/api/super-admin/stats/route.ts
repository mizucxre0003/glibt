import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-helper'

export async function GET(request: Request) {
    try {
        const user = await getAuthUser()
        if (!user || user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const [
            totalShops,
            activeShops,
            bannedShops,
            totalUsers,
            totalOrders
        ] = await prisma.$transaction([
            prisma.shop.count(),
            prisma.shop.count({ where: { isActive: true, isBanned: false } }),
            prisma.shop.count({ where: { isBanned: true } }),
            prisma.user.count(),
            prisma.order.count()
        ])

        // Calculate total revenue (this might be heavy on large DBs, optimization needed later)
        // For now, we'll verify if we can do an aggregation
        const revenueResult = await prisma.order.aggregate({
            _sum: {
                totalAmount: true
            },
            where: {
                status: 'COMPLETED' // Only count completed orders
            }
        })

        return NextResponse.json({
            shops: {
                total: totalShops,
                active: activeShops,
                banned: bannedShops
            },
            users: {
                total: totalUsers
            },
            orders: {
                total: totalOrders,
                revenue: revenueResult._sum.totalAmount || 0
            }
        })

    } catch (error) {
        console.error('[SuperAdmin] Error fetching stats:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
