import { FastifyInstance } from 'fastify'
import { uploadImage } from '../../lib/cloudinary'
import fs from 'fs'
import util from 'util'
import { pipeline } from 'stream'
import os from 'os'
import path from 'path'

const pump = util.promisify(pipeline)

export async function uploadRoutes(fastify: FastifyInstance) {
    fastify.addHook('preHandler', fastify.authenticate)

    fastify.post('/', async (req, reply) => {
        const data = await req.file()

        if (!data) {
            return reply.status(400).send({ error: "No file uploaded" })
        }

        // Check file type
        if (!data.mimetype.startsWith('image/')) {
            return reply.status(400).send({ error: "Only images are allowed" })
        }

        // Save to temporary file
        const tempFilePath = path.join(os.tmpdir(), `upload-${Date.now()}-${data.filename}`)

        try {
            await pump(data.file, fs.createWriteStream(tempFilePath))

            // Upload to Cloudinary
            const imageUrl = await uploadImage(tempFilePath)

            // Cleanup temp file
            fs.unlinkSync(tempFilePath)

            return { url: imageUrl }
        } catch (error) {
            console.error("Upload failed:", error)
            // Cleanup on error
            if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath)

            return reply.status(500).send({ error: "Upload failed" })
        }
    })
}
