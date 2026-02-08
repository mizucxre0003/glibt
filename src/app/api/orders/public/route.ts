
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// This endpoint should ideally validate Telegram InitData to ensure the request comes from a real user.
// For now, we assume the frontend sends valid data.
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            shopId,
            telegramId,
            username,
            firstName,
            items,
            totalAmount,
            address,
            phone,
            comment
        } = body

        if (!shopId || !telegramId || !items || items.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 1. Find or Create Customer
        let customer = await prisma.customer.findUnique({
            where: {
                shopId_telegramId: {
                    shopId,
                    telegramId: BigInt(telegramId) // Ensure BigInt
                }
            }
        })

        if (!customer) {
            customer = await prisma.customer.create({
                data: {
                    shopId,
                    telegramId: BigInt(telegramId),
                    username,
                    firstName
                }
            })
        } else {
            // Update customer info if changed
            if (customer.username !== username || customer.firstName !== firstName) {
                await prisma.customer.update({
                    where: { id: customer.id },
                    data: { username, firstName }
                })
            }
        }

        // 2. Create Order
        const order = await prisma.order.create({
            data: {
                shopId,
                customerId: customer.id,
                totalAmount,
                status: 'NEW',
                address,
                phone,
                comment,
                items: {
                    create: items.map((item: any) => ({
                        productId: item.id,
                        quantity: item.quantity,
                        price: item.price
                    }))
                }
            }
        })

        // TODO: Send Telegram notification to User and Shop Owner

        // Convert BigInt to string for JSON serialization
        const serializedOrder = JSON.parse(JSON.stringify(order, (key, value) =>
            typeof value === 'bigint'
                ? value.toString()
                : value // return everything else unchanged
        ));

        return NextResponse.json(serializedOrder)

    } catch (error) {
        console.error("Order creation failed:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
