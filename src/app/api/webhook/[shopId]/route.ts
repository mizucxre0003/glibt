import { NextResponse } from 'next/server'
import { Telegraf } from 'telegraf'
import prisma from '@/lib/prisma'
import { decrypt } from '@/lib/crypto'

// 3. Initialize Bot Instance
// We do NOT cache the bot instance globally anymore.
// Caching caused 'ECONNRESET' errors due to stale connections in the HTTP agent.
// Creating a new instance per request is lightweight and safer for serverless webhooks.
let bot: Telegraf
try {
    const botToken = decrypt(shop.botToken)
    bot = new Telegraf(botToken)
    setupBotLogic(bot, shopId)
} catch (error) {
    console.error(`[Webhook] Failed to initialize bot for shop ${shopId}`, error)
    return NextResponse.json({ ok: true })
}

// 4. Process the Update
try {
    await bot.handleUpdate(update)
} catch (botError) {
    console.error(`[Webhook] Telegraf error for shop ${shopId}:`, botError)
    // Swallow error to keep Telegram happy (retrying won't fix code bugs)
}

// 5. Return 200 OK
return NextResponse.json({ ok: true })

    } catch (error) {
    console.error(`[Webhook] Critical error processing update for shop ${shopId}:`, error)
    // Always return 200 to Telegram to prevent infinite retry loops on their side
    return NextResponse.json({ ok: true })
}
}

function setupBotLogic(bot: Telegraf, shopId: string) {
    // Middleware to attach shop context if needed
    bot.use(async (ctx, next) => {
        (ctx as any).shopId = shopId
        await next()
    })

    // /start command
    bot.start(async (ctx) => {
        // console.log(`[Bot] /start command received for shop ${shopId}`);
        const shopUrl = process.env.NEXT_PUBLIC_APP_URL

        if (!shopUrl) {
            console.error('[Bot] NEXT_PUBLIC_APP_URL is not set in environment variables!')
            return ctx.reply('Error: Store URL is not configured. Please contact support.')
        }

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
        } catch (e) {
            console.error(`[Bot] Failed to send /start reply for shop ${shopId}:`, e);
        }
    })

    bot.help((ctx) => ctx.reply('Contact support if you need help!'))

    // Command to get Chat ID for notifications
    bot.command('id', (ctx) => {
        const chatId = ctx.from.id
        ctx.reply(`Your Chat ID: <code>${chatId}</code>\n\nCopy this ID and paste it into the "Admin Notification Chat ID" field in your shop settings to receive order notifications.`, { parse_mode: 'HTML' })
    })

    // Catch-all for logging or specific handling
    bot.on('message', (ctx) => {
        // console.log('[Bot] Received message:', ctx.message)
    })
}
