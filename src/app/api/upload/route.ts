import { NextResponse } from 'next/server'
import { uploadImage } from '@/lib/cloudinary'
import { getAuthUser } from '@/lib/auth-helper'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { pipeline } from 'stream'
import util from 'util'

const pump = util.promisify(pipeline)

export async function POST(request: Request) {
    try {
        const user = await getAuthUser()
        if (!user || user.role !== 'SHOP_OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: "Only images are allowed" }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Save to temporary file
        const tempFilePath = path.join(os.tmpdir(), `upload-${Date.now()}-${file.name}`)

        fs.writeFileSync(tempFilePath, buffer)

        try {
            // Upload to Cloudinary
            const imageUrl = await uploadImage(tempFilePath)

            // Cleanup temp file
            fs.unlinkSync(tempFilePath)

            return NextResponse.json({ url: imageUrl })
        } catch (error) {
            console.error("Upload failed:", error)
            // Cleanup on error
            if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath)
            return NextResponse.json({ error: "Upload failed" }, { status: 500 })
        }

    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
