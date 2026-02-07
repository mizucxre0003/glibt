import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import prisma from '../../lib/prisma'

export async function categoryRoutes(fastify: FastifyInstance) {
    fastify.addHook('preHandler', fastify.authenticate)

    // List Categories
    fastify.get('/', async (req, reply) => {
        const user = (req as any).user

        const categories = await prisma.category.findMany({
            where: { shopId: user.shopId },
            include: {
                _count: {
                    select: { products: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return categories
    })

    // Create Category
    fastify.post('/', async (req, reply) => {
        const schema = z.object({
            name: z.string().min(1, "Name is required"),
        })

        try {
            const { name } = schema.parse(req.body)
            const user = (req as any).user

            const category = await prisma.category.create({
                data: {
                    name,
                    shopId: user.shopId!
                }
            })

            return category
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: (error as any).errors })
            }
            return reply.status(500).send({ error: "Internal Server Error" })
        }
    })

    // Update Category
    fastify.put('/:id', async (req, reply) => {
        const schema = z.object({
            name: z.string().min(1, "Name is required"),
        })
        const paramsSchema = z.object({
            id: z.string()
        })

        try {
            const { name } = schema.parse(req.body)
            const { id } = paramsSchema.parse(req.params)
            const user = (req as any).user

            // Verify ownership
            const existing = await prisma.category.findFirst({
                where: { id, shopId: user.shopId }
            })

            if (!existing) {
                return reply.status(404).send({ error: "Category not found" })
            }

            const category = await prisma.category.update({
                where: { id },
                data: { name }
            })

            return category
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: (error as any).errors })
            }
            return reply.status(500).send({ error: "Internal Server Error" })
        }
    })

    // Delete Category
    fastify.delete('/:id', async (req, reply) => {
        const paramsSchema = z.object({
            id: z.string()
        })

        try {
            const { id } = paramsSchema.parse(req.params)
            const user = (req as any).user

            // Verify ownership
            const existing = await prisma.category.findFirst({
                where: { id, shopId: user.shopId }
            })

            if (!existing) {
                return reply.status(404).send({ error: "Category not found" })
            }

            // Check if has products (optional: could allow cascade or block)
            // For now, let's just delete. Prisma schema might be set to restrict or cascade.
            // If we didn't set cascade in schema, this might fail if products exist.
            // Assuming no cascade for now, simple delete.

            await prisma.category.delete({
                where: { id }
            })

            return { success: true }
        } catch (error) {
            return reply.status(500).send({ error: "Internal Server Error" })
        }
    })
}
