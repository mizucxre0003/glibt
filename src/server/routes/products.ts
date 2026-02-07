import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import prisma from '../../lib/prisma'

export async function productRoutes(fastify: FastifyInstance) {
    fastify.addHook('preHandler', fastify.authenticate)

    // List Products
    fastify.get('/', async (req, reply) => {
        const user = (req as any).user

        const products = await prisma.product.findMany({
            where: { shopId: user.shopId },
            include: {
                category: true
            },
            orderBy: { createdAt: 'desc' }
        })

        return products
    })

    // Create Product
    fastify.post('/', async (req, reply) => {
        const schema = z.object({
            name: z.string().min(1, "Name is required"),
            description: z.string().optional(),
            price: z.number().min(0),
            stock: z.number().int().min(0).default(0),
            imageUrl: z.string().optional(),
            categoryId: z.string().optional(),
            isActive: z.boolean().default(true)
        })

        try {
            const data = schema.parse(req.body)
            const user = (req as any).user

            // Verify category ownership if provided
            if (data.categoryId) {
                const category = await prisma.category.findFirst({
                    where: { id: data.categoryId, shopId: user.shopId }
                })
                if (!category) {
                    return reply.status(400).send({ error: "Invalid Category" })
                }
            }

            const product = await prisma.product.create({
                data: {
                    name: data.name,
                    description: data.description,
                    price: data.price,
                    stock: data.stock,
                    imageUrl: data.imageUrl,
                    isActive: data.isActive,
                    category: data.categoryId ? { connect: { id: data.categoryId } } : undefined,
                    shop: { connect: { id: user.shopId } }
                }
            })

            return product
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: (error as any).errors })
            }
            console.error(error)
            return reply.status(500).send({ error: "Internal Server Error" })
        }
    })

    // Update Product
    fastify.put('/:id', async (req, reply) => {
        const schema = z.object({
            name: z.string().min(1).optional(),
            description: z.string().optional(),
            price: z.number().min(0).optional(),
            stock: z.number().int().min(0).optional(),
            imageUrl: z.string().optional(),
            categoryId: z.string().optional().nullable(),
            isActive: z.boolean().optional()
        })
        const paramsSchema = z.object({
            id: z.string()
        })

        try {
            const data = schema.parse(req.body)
            const { id } = paramsSchema.parse(req.params)
            const user = (req as any).user

            // Verify ownership
            const existing = await prisma.product.findFirst({
                where: { id, shopId: user.shopId }
            })

            if (!existing) {
                return reply.status(404).send({ error: "Product not found" })
            }

            // Verify category ownership if provided
            if (data.categoryId) {
                const category = await prisma.category.findFirst({
                    where: { id: data.categoryId, shopId: user.shopId }
                })
                if (!category) {
                    return reply.status(400).send({ error: "Invalid Category" })
                }
            }

            const product = await prisma.product.update({
                where: { id },
                data: {
                    name: data.name,
                    description: data.description,
                    price: data.price,
                    stock: data.stock,
                    imageUrl: data.imageUrl,
                    isActive: data.isActive,
                    category: data.categoryId ? { connect: { id: data.categoryId } } : data.categoryId === null ? { disconnect: true } : undefined
                }
            })

            return product
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: (error as any).errors })
            }
            console.error(error)
            return reply.status(500).send({ error: "Internal Server Error" })
        }
    })

    // Delete Product
    fastify.delete('/:id', async (req, reply) => {
        const paramsSchema = z.object({
            id: z.string()
        })

        try {
            const { id } = paramsSchema.parse(req.params)
            const user = (req as any).user

            const existing = await prisma.product.findFirst({
                where: { id, shopId: user.shopId }
            })

            if (!existing) {
                return reply.status(404).send({ error: "Product not found" })
            }

            await prisma.product.delete({
                where: { id }
            })

            return { success: true }
        } catch (error) {
            return reply.status(500).send({ error: "Internal Server Error" })
        }
    })
}
