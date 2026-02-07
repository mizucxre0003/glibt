import { headers } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'

export interface AuthUser {
    userId: string
    role: string
    shopId?: string
}

export function getJwtSecret() {
    return JWT_SECRET
}

export async function getAuthUser(): Promise<AuthUser | null> {
    try {
        const headersList = headers()
        const authHeader = headersList.get('authorization')

        if (!authHeader) return null

        const token = authHeader.split(' ')[1]
        if (!token) return null

        const decoded = jwt.verify(token, JWT_SECRET) as AuthUser
        return decoded
    } catch (error) {
        return null
    }
}
