const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    const email = process.argv[2]

    if (!email) {
        console.error('Please provide an email address as an argument')
        process.exit(1)
    }

    console.log(`Promoting user ${email} to SUPER_ADMIN...`)

    try {
        const user = await prisma.user.update({
            where: { email },
            data: { role: 'SUPER_ADMIN' }
        })

        console.log(`Successfully promoted ${user.email} to ${user.role}`)
    } catch (error) {
        console.error('Error promoting user:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
