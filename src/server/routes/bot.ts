import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Telegraf } from 'telegraf'
import prisma from '../../lib/prisma'
import { encrypt, decrypt } from '../../lib/crypto'

export async function botRoutes(fastify: FastifyInstance) {
    // Protect all routes with JWT auth
    fastify.addHook('preHandler', fastify.authenticate)

    // Set/Update Bot Token
    fastify.put('/token', async (req, reply) => {
        const schema = z.object({
            token: z.string().min(10, "Token is too short"),
        })

        try {
            const { token } = schema.parse(req.body)
            const user = (req as any).user

            // Verify token is valid with Telegram
            try {
                const bot = new Telegraf(token)
                await bot.telegram.getMe()
            } catch (e: any) {
                return reply.status(400).send({ error: "Invalid Telegram Bot Token. Please check and try again." })
            }

            const encryptedToken = encrypt(token)

            // Update shop with new token
            await prisma.shop.update({
                where: { ownerId: user.userId },
                data: {
                    botToken: encryptedToken,
                    // Reset webhook status when token changes
                    isBotActive: false,
                    botName: null,
                    botUsername: null,
                },
            })

            return reply.send({ success: true, message: "Bot token saved successfully" })
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: (error as any).errors })
            }
            console.error(error)
            return reply.status(500).send({ error: "Internal Server Error" })
        }
    })

    // Set Webhook
    fastify.post('/webhook', async (req, reply) => {
        const user = (req as any).user

        try {
            const shop = await prisma.shop.findUnique({
                where: { ownerId: user.userId },
            })

            if (!shop || !shop.botToken) {
                return reply.status(400).send({ error: "No bot token configured" })
            }

            const token = decrypt(shop.botToken)
            const bot = new Telegraf(token)

            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
            const webhookUrl = `${appUrl}/api/webhook/${shop.id}`

            // Set webhook
            let warning = null
            try {
                await bot.telegram.setWebhook(webhookUrl)
            } catch (e: any) {
                console.error("Webhook set failed:", e.message)
                if (e.message?.includes('HTTPS') || e.description?.includes('HTTPS')) {
                    warning = "Webhook requires HTTPS. Bot is configured but will not receive messages on localhost."
                } else {
                    throw e
                }
            }

            const botInfo = await bot.telegram.getMe()

            // Update shop status
            await prisma.shop.update({
                where: { id: shop.id },
                data: {
                    isBotActive: !warning, // Only active if no warning
                    botUsername: botInfo.username,
                    botName: botInfo.first_name,
                },
            })

            return reply.send({
                success: true,
                message: warning || "Webhook set successfully",
                warning,
                bot: botInfo
            })
        } catch (error: any) {
            console.error(error)
            return reply.status(500).send({ error: "Failed to set webhook: " + error.message })
        }
    })

    // Get Status
    fastify.get('/status', async (req, reply) => {
        const user = (req as any).user

        try {
            const shop = await prisma.shop.findUnique({
                where: { ownerId: user.userId },
                select: {
                    isBotActive: true,
                    botUsername: true,
                    botName: true,
                    botToken: true, // we check if it exists, but don't return it
                }
            })

            if (!shop) {
                return reply.status(404).send({ error: "Shop not found" })
            }

            return reply.send({
                configured: !!shop.botToken,
                active: shop.isBotActive,
                username: shop.botUsername,
                name: shop.botName
            })
        } catch (error) {
            console.error(error)
            return reply.status(500).send({ error: "Internal Server Error" })
        }
    })
}
