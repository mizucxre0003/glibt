
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    try {
        let shop;

        if (id) {
            shop = await prisma.shop.findUnique({
                where: { id },
                select: {
                    id: true,
                    name: true,
                    currency: true,
                    primaryColor: true,
                    welcomeMessage: true,
                    botUsername: true,
                    isBanned: true
                }
            })
        } else {
            return NextResponse.json({ error: 'Shop ID required' }, { status: 400 })
        }

        if (!shop) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
        }

        if (shop.isBanned) {
            return NextResponse.json({ error: 'Shop is banned' }, { status: 403 })
        }

        return NextResponse.json(shop)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
