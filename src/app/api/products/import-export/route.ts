
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-helper'
import * as XLSX from 'xlsx'
import { z } from 'zod'

export async function GET(request: Request) {
    try {
        const user = await getAuthUser()
        if (!user || user.role !== 'SHOP_OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const products = await prisma.product.findMany({
            where: { shopId: user.shopId },
            include: { category: true },
            orderBy: { createdAt: 'desc' }
        })

        const data = products.map(p => ({
            ID: p.id,
            Name: p.name,
            Description: p.description,
            Price: Number(p.price),
            Category: p.category?.name || "",
            ImageURL: p.images?.[0] || ""
        }))

        const worksheet = XLSX.utils.json_to_sheet(data)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Products")

        const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

        return new NextResponse(buf, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="products.xlsx"`,
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            }
        })

    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

const productImportSchema = z.object({
    Name: z.string().min(1),
    Description: z.string().optional(),
    Price: z.coerce.number().min(0),
    Category: z.string().optional(),
    ImageURL: z.string().optional()
})

export async function POST(request: Request) {
    try {
        const user = await getAuthUser()
        if (!user || user.role !== 'SHOP_OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
        }

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        let createdCount = 0
        let errors = []

        for (const row of jsonData as any[]) {
            try {
                const parsed = productImportSchema.safeParse(row)
                if (!parsed.success) {
                    // Skip invalid rows? Or log error?
                    console.log("Invalid row:", row, parsed.error)
                    continue;
                }

                const { Name, Description, Price, Category, ImageURL } = parsed.data

                let categoryId = undefined
                if (Category) {
                    // Find or create category
                    let cat = await prisma.category.findFirst({
                        where: { shopId: user.shopId, name: Category }
                    })
                    if (!cat) {
                        cat = await prisma.category.create({
                            data: { name: Category, shopId: user.shopId! }
                        })
                    }
                    categoryId = cat.id
                }

                await prisma.product.create({
                    data: {
                        name: Name,
                        description: Description || "",
                        price: Price,
                        images: ImageURL ? [ImageURL] : [],
                        categoryId,
                        shopId: user.shopId!
                    }
                })
                createdCount++
            } catch (e) {
                console.error("Row error:", e)
                errors.push(e)
            }
        }

        return NextResponse.json({ success: true, count: createdCount })

    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
