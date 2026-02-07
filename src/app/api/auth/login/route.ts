import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import prisma from '../../../../lib/prisma'
import { getJwtSecret } from '../../../../lib/auth-helper'

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
})

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email, password } = loginSchema.parse(body)

        const user = await prisma.user.findUnique({
            where: { email },
            include: { shop: true }
        })

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

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
            return NextResponse.json({ error: error.errors }, { status: 400 })
        }
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
