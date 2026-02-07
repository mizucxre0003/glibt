import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'
// Ensure ENCRYPTION_KEY is 32 bytes
const KEY = process.env.ENCRYPTION_KEY || ''
const APPLIED_KEY = crypto.createHash('sha256').update(String(KEY)).digest('base64').substr(0, 32)
const IV_LENGTH = 16

export function encrypt(text: string): string {
    if (!KEY) throw new Error('ENCRYPTION_KEY is not defined')
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(APPLIED_KEY), iv)
    let encrypted = cipher.update(text)
    encrypted = Buffer.concat([encrypted, cipher.final()])
    return iv.toString('hex') + ':' + encrypted.toString('hex')
}

export function decrypt(text: string): string {
    if (!KEY) throw new Error('ENCRYPTION_KEY is not defined')
    const textParts = text.split(':')
    const iv = Buffer.from(textParts.shift()!, 'hex')
    const encryptedText = Buffer.from(textParts.join(':'), 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(APPLIED_KEY), iv)
    let decrypted = decipher.update(encryptedText)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    return decrypted.toString()
}
