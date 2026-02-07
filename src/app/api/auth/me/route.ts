import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { getAuthUser } from '../../../../lib/auth-helper'

export async function GET(request: Request) {
    try {
        const userPayload = await getAuthUser()

        if (!userPayload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: userPayload.userId },
            select: {
                id: true,
                email: true,
                role: true,
                shop: {
                    select: { id: true, name: true, isActive: true, isBanned: true }
                }
            }
        })

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        return NextResponse.json(user)

    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
