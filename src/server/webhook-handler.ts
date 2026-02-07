import { FastifyRequest, FastifyReply } from 'fastify'
import { Telegraf, Context } from 'telegraf'
import prisma from '../lib/prisma'
import { decrypt } from '../lib/crypto'

// Interfaces for the request
interface WebhookParams {
    shopId: string
}

// Map to store bot instances in memory to avoid recreating them on every request
// In a serverless environment (like Vercel functions), this might not work as expected,
// but for a persistent container (Koyeb, Docker), this acts as a simple cache.
const botCache = new Map<string, Telegraf>()

export async function webhookHandler(
    request: FastifyRequest<{ Params: WebhookParams }>,
    reply: FastifyReply
) {
    const { shopId } = request.params
    const update = request.body

    console.log(`[Webhook] Received update for shop: ${shopId}`)

    try {
        // 1. Validate Shop ID exists
        if (!shopId) {
            return reply.status(400).send({ error: 'Missing shopId' })
        }

        // 2. Fetch Shop and Bot Token from Database
        const shop = await prisma.shop.findUnique({
            where: { id: shopId },
            select: {
                botToken: true,
                isActive: true,
                isBanned: true
            }
        })

        if (!shop) {
            console.warn(`[Webhook] Shop not found: ${shopId}`)
            return reply.status(404).send({ error: 'Shop not found' })
        }

        if (shop.isBanned) {
            console.warn(`[Webhook] Shop is banned: ${shopId}`)
            return reply.status(403).send({ error: 'Shop is banned' })
        }

        if (!shop.isActive) {
            return reply.status(200).send({ message: 'Shop is inactive' })
        }

        // 3. Decrypt the Bot Token
        let botToken: string
        try {
            botToken = decrypt(shop.botToken)
        } catch (error) {
            console.error(`[Webhook] Failed to decrypt token for shop ${shopId}`, error)
            return reply.status(500).send({ error: 'Configuration error' })
        }

        // 4. Initialize or retrieve Telegraf instance
        let bot = botCache.get(shopId)
        // If we have a cached bot but the token doesn't match (e.g. key rotation), invalidate it.
        // However, Telegraf instance doesn't expose the token easily, so we might just assume
        // the cache is valid for the lifetime of the process or use a hash.
        // For simplicity, we check if it exists. 
        if (!bot) {
            bot = new Telegraf(botToken)

            // Setup Bot Logic (Commands, Scenes, middleware)
            setupBotLogic(bot, shopId)

            botCache.set(shopId, bot)
        }

        // 5. Process the Update
        // Telegraf's handleUpdate expects the raw update object
        await bot.handleUpdate(update as any)

        // 6. Return 200 OK immediately to Telegram
        return reply.status(200).send({ ok: true })

    } catch (error) {
        console.error(`[Webhook] Error processing update for shop ${shopId}:`, error)
        // Always return 200 to Telegram to prevent retry loops for bad updates
        return reply.status(200).send({ error: 'Internal Server Error' })
    }
}

/**
 * Configure the bot's behavior.
 * This is where we define how the bot responds to commands and messages.
 */
function setupBotLogic(bot: Telegraf, shopId: string) {

    // Middleware to add shopId to context if needed
    bot.use(async (ctx, next) => {
        (ctx as any).shopId = shopId
        await next()
    })

    // /start command - The Main Entry Point
    bot.start(async (ctx) => {
        const shopUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://koyeb-app-url.com'
        const miniAppUrl = `${shopUrl}/tma`

        // We can pass the shopId via the start_param if needed, but the initData
        // verification usually relies on the bot token matching the signature.
        // Since we are hosting the TMA on the same domain, we can navigate inside the TMA.

        // NOTE: Telegram Mini Apps are usually opened via a standard URL which Telegram
        // wraps.

        await ctx.reply('Welcome to our shop! 🛍️\nClick the button below to browse our catalog.', {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Open Shop 🏪',
                            web_app: { url: miniAppUrl }
                        }
                    ]
                ]
            }
        })
    })

    bot.help((ctx) => ctx.reply('Contact support if you need help!'))

    bot.on('message', (ctx) => {
        // Handle other messages, maybe forward to admin support?
        // For now, just a placeholder.
    })
}
