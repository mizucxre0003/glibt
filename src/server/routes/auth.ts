import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import fp from 'fastify-plugin'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import prisma from '../../lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    shopName: z.string().min(1),
})

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
})

export default fp(async function (fastify: FastifyInstance) {

    // Middleware/Decorator for verifying JWT
    fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
        try {
            const authHeader = request.headers.authorization
            if (!authHeader) {
                throw new Error('No token provided')
            }
            const token = authHeader.split(' ')[1]
            const decoded = jwt.verify(token, JWT_SECRET) as any
            request.user = decoded
        } catch (err) {
            reply.status(401).send({ error: 'Unauthorized' })
        }
    })

    // Register Route
    fastify.post('/api/auth/register', async (request, reply) => {
        try {
            const { email, password, shopName } = registerSchema.parse(request.body)

            const existingUser = await prisma.user.findUnique({ where: { email } })
            if (existingUser) {
                return reply.status(400).send({ error: 'User already exists' })
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

            const token = jwt.sign({ userId: user.id, role: user.role, shopId: user.shop?.id }, JWT_SECRET, { expiresIn: '7d' })

            return { token, user: { id: user.id, email: user.email, role: user.role, shopId: user.shop?.id } }

        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: (error as any).errors })
            }
            fastify.log.error(error)
            return reply.status(500).send({ error: 'Internal Server Error' })
        }
    })

    // Login Route
    fastify.post('/api/auth/login', async (request, reply) => {
        try {
            const { email, password } = loginSchema.parse(request.body)

            const user = await prisma.user.findUnique({
                where: { email },
                include: { shop: true }
            })

            if (!user || !(await bcrypt.compare(password, user.password))) {
                return reply.status(401).send({ error: 'Invalid credentials' })
            }

            const token = jwt.sign({ userId: user.id, role: user.role, shopId: user.shop?.id }, JWT_SECRET, { expiresIn: '7d' })

            return { token, user: { id: user.id, email: user.email, role: user.role, shopId: user.shop?.id } }

        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: (error as any).errors })
            }
            fastify.log.error(error)
            return reply.status(500).send({ error: 'Internal Server Error' })
        }
    })

    // Me Route
    fastify.get('/api/auth/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const { userId } = request.user as any

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, role: true, shop: { select: { id: true, name: true, isActive: true, isBanned: true } } }
        })

        if (!user) return reply.status(404).send({ error: 'User not found' })

        return user
    })
})

declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    }
    interface FastifyRequest {
        user?: {
            userId: string
            role: string
            shopId?: string
        }
    }
}
