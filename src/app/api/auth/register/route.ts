import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getJwtSecret } from '@/lib/auth-helper'

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    shopName: z.string().min(1),
})

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email, password, shopName } = registerSchema.parse(body)

        const existingUser = await prisma.user.findUnique({ where: { email } })
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: 'SHOP_OWNER',
                shop: {
                    create: {
                        name: shopName,
                        botToken: '', // Will be set later
                    }
                }
            },
            include: { shop: true }
        })

        const JWT_SECRET = getJwtSecret()
        const token = jwt.sign(
            { userId: user.id, role: user.role, shopId: user.shop?.id },
            JWT_SECRET,
            { expiresIn: '7d' }
        )

        return NextResponse.json({
            token,
            user: { id: user.id, email: user.email, role: user.role, shopId: user.shop?.id }
        })

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: (error as z.ZodError).issues }, { status: 400 })
        }
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
