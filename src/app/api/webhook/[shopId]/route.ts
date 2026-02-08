import { NextResponse } from 'next/server'
import { Telegraf } from 'telegraf'
import prisma from '@/lib/prisma'
import { decrypt } from '@/lib/crypto'

// Map to store bot instances in memory
const botCache = new Map<string, Telegraf>()

export async function POST(
    request: Request,
    { params }: { params: { shopId: string } }
) {
    const { shopId } = params

    try {
        const update = await request.json()
        console.log(`[Webhook] Received update for shop: ${shopId}`)

        // 1. Validate Shop ID exists
        if (!shopId) {
            return NextResponse.json({ error: 'Missing shopId' }, { status: 400 })
        }

        // 2. Fetch Shop and Bot Token from Database
        // Optimization: We could cache this, but for security and consistency, DB fetch is safer for now.
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
            return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
        }

        if (shop.isBanned) {
            console.warn(`[Webhook] Shop is banned: ${shopId}`)
            return NextResponse.json({ error: 'Shop is banned' }, { status: 403 })
        }

        if (!shop.isActive) {
            return NextResponse.json({ message: 'Shop is inactive' })
        }

        // 3. Decrypt the Bot Token
        let botToken: string
        try {
            botToken = decrypt(shop.botToken)
        } catch (error) {
            console.error(`[Webhook] Failed to decrypt token for shop ${shopId}`, error)
            return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
        }

        // 4. Initialize or retrieve Telegraf instance
        let bot = botCache.get(shopId)
        if (!bot) {
            bot = new Telegraf(botToken)
            setupBotLogic(bot, shopId)
            botCache.set(shopId, bot)
        }

        // 5. Process the Update
        await bot.handleUpdate(update)

        // 6. Return 200 OK
        return NextResponse.json({ ok: true })

    } catch (error) {
        console.error(`[Webhook] Error processing update for shop ${shopId}:`, error)
        // Always return 200 to Telegram
        return NextResponse.json({ ok: true })
    }
}

function setupBotLogic(bot: Telegraf, shopId: string) {
    // Middleware
    bot.use(async (ctx, next) => {
        (ctx as any).shopId = shopId
        await next()
    })

    // /start command
    bot.start(async (ctx) => {
        console.log(`[Bot] /start command received for shop ${shopId}`);
        const shopUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://koyeb-app-url.com' // Fallback for button link if env invalid
        const miniAppUrl = `${shopUrl}/tma?shopId=${shopId}`

        try {
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
            console.log(`[Bot] /start reply sent to ${ctx.from.id}`);
        } catch (e) {
            console.error(`[Bot] Failed to send /start reply:`, e);
        }
    })

    bot.help((ctx) => ctx.reply('Contact support if you need help!'))

    bot.on('message', (ctx) => {
        // Handle other messages
    })
}
