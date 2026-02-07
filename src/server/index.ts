import fastify, { FastifyInstance } from 'fastify'
import next from 'next'
import { webhookHandler } from './webhook-handler'
import { parse } from 'url'
import authRoutes from './routes/auth'
import { botRoutes } from './routes/bot'
import { categoryRoutes } from './routes/categories'
import { productRoutes } from './routes/products'
import { uploadRoutes } from './routes/upload'
import multipart from '@fastify/multipart'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

console.log('Starting server...')
// Prepare Next.js
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

const server: FastifyInstance = fastify({
    logger: dev
})

console.log('Preparing Next.js...')
// ... (existing code)

app.prepare().then(async () => {
    console.log('Next.js prepared')

    // Register Plugins
    await server.register(multipart)

    // Register API Routes here
    // We can also use fastify-autoload if the project grows, but for now manual registration is fine.

    // Authentication Routes
    await server.register(authRoutes)
    await server.register(botRoutes, { prefix: '/api/bot' })
    await server.register(categoryRoutes, { prefix: '/api/categories' })
    await server.register(productRoutes, { prefix: '/api/products' })
    await server.register(uploadRoutes, { prefix: '/api/upload' })

    // Webhook Route
    // Note: we use 'raw' body parsing or handle it in the handler if needed by Telegraf.
    server.post('/api/webhook/:shopId', webhookHandler)

    // External API routes (e.g. for Admin Dashboard fetch)
    server.get('/api/health', async (req, reply) => {
        return { status: 'ok', timestamp: new Date() }
    })

    // Koyeb Health Check
    server.get('/health', async (req, reply) => {
        return { status: 'ok' }
    })

    // Fallback to Next.js for all other routes
    server.all('*', async (req, reply) => {
        const parsedUrl = parse(req.raw.url || '', true)
        await handle(req.raw, reply.raw, parsedUrl)
        // We must return reply to avoid Fastify hanging, but Next.js handles the response writing.
        reply.sent = true
    })

    server.listen({ port, host: '0.0.0.0' }, (err, address) => {
        if (err) {
            server.log.error(err)
            process.exit(1)
        }
        console.log(`> Server ready on http://localhost:${port}`)
    })
})
