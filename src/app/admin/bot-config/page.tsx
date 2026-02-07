"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useLanguage } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const formSchema = z.object({
    token: z.string().min(10).regex(/^\d+:[A-Za-z0-9_-]+$/, "Invalid Telegram Bot Token format"),
})

export default function BotConfigPage() {
    const { t } = useLanguage()
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    })

    const fetchStatus = async () => {
        const token = localStorage.getItem('token')
        if (!token) return

        try {
            const res = await fetch('/api/bot/status', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setStatus(data)
            }
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => {
        fetchStatus()
    }, [])

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setLoading(true)
        setError(null)
        setSuccess(null)
        const token = localStorage.getItem('token')

        try {
            // 1. Save Token
            const tokenRes = await fetch('/api/bot/token', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ token: values.token })
            })

            const tokenData = await tokenRes.json()

            if (!tokenRes.ok) {
                throw new Error(tokenData.error || 'Failed to save token')
            }

            // 2. Set Webhook
            const webhookRes = await fetch('/api/bot/webhook', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            })

            const webhookData = await webhookRes.json()

            if (!webhookRes.ok) {
                throw new Error(webhookData.error || 'Failed to set webhook')
            }

            if (webhookData.warning) {
                setSuccess(`${t('bot.setWebhookSuccess')} (${webhookData.warning})`) // Modified success message
            } else {
                setSuccess(t('bot.setWebhookSuccess'))
            }

            form.reset()
            fetchStatus()

        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 p-8">
            <h1 className="text-3xl font-bold">{t('bot.title')}</h1>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('bot.title')}</CardTitle>
                        <CardDescription>{t('bot.tokenPlaceholder')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <div className="grid w-full items-center gap-4">
                                <div className="flex flex-col space-y-1.5">
                                    <Label htmlFor="token">{t('bot.tokenLabel')}</Label>
                                    <Input
                                        id="token"
                                        {...form.register("token")}
                                    />
                                    {form.formState.errors.token && (
                                        <p className="text-sm text-red-500">{t('bot.invalidToken')}</p>
                                    )}
                                </div>
                            </div>

                            {error && (
                                <Alert variant="destructive" className="mt-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {success && (
                                <Alert className="mt-4 border-green-500 text-green-500">
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertTitle>Success</AlertTitle>
                                    <AlertDescription>{success}</AlertDescription>
                                </Alert>
                            )}

                            <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white" type="submit" disabled={loading}>
                                {loading ? t('auth.creating') : t('bot.saveButton')}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('bot.webhookStatus')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                                <span className="font-medium">{t('bot.tokenLabel')}:</span>
                                <span className={status?.configured ? "text-green-500" : "text-yellow-500"}>
                                    {status?.configured ? "Configured" : "Missing"}
                                </span>
                            </div>

                            <div className="flex justify-between items-center p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                                <span className="font-medium">{t('bot.connectedAs')}:</span>
                                <span>{status?.username ? `@${status.username}` : t('bot.notConnected')}</span>
                            </div>

                            <div className="flex justify-between items-center p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                                <span className="font-medium">{t('common.status')}:</span>
                                <span className={status?.active ? "text-green-500" : "text-gray-500"}>
                                    {status?.active ? t('bot.statusActive') : t('bot.statusInactive')}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
