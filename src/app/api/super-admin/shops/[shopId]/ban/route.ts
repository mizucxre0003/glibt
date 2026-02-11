import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-helper'
import { z } from 'zod'

const banSchema = z.object({
    banned: z.boolean()
})

export async function PUT(
    request: Request,
    { params }: { params: { shopId: string } }
) {
    try {
        const user = await getAuthUser()
        if (!user || user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { banned } = banSchema.parse(body)

        const shop = await prisma.shop.update({
            where: { id: params.shopId },
            data: { isBanned: banned }
        })

        return NextResponse.json(shop)

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 })
        }
        console.error('[SuperAdmin] Error updating shop ban status:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
