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
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const settingsSchema = z.object({
    currency: z.string().min(1, "Currency is required"),
    primaryColor: z.string().optional(),
    welcomeMessage: z.string().optional(),
    notificationChatId: z.string().optional(),
})

export default function SettingsPage() {
    const { t } = useLanguage()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [customCurrency, setCustomCurrency] = useState(false)

    const form = useForm<z.infer<typeof settingsSchema>>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            currency: "USD",
            primaryColor: "#000000",
            welcomeMessage: "",
            notificationChatId: ""
        }
    })

    const fetchData = async () => {
        const token = localStorage.getItem('token')
        try {
            const res = await fetch('/api/settings', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                form.setValue('currency', data.currency || "USD")
                form.setValue('primaryColor', data.primaryColor || "#000000")
                form.setValue('welcomeMessage', data.welcomeMessage || "")
                form.setValue('notificationChatId', data.notificationChatId || "")

                // Check if currency is standard
                const standards = ["USD", "EUR", "RUB", "KZT", "UAH"]
                if (!standards.includes(data.currency)) {
                    setCustomCurrency(true)
                }
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const onSubmit = async (values: z.infer<typeof settingsSchema>) => {
        setSaving(true)
        const token = localStorage.getItem('token')
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(values)
            })

            if (res.ok) {
                // Success feedback?
            }
        } catch (e) {
            console.error(e)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>

    const currentCurrency = form.watch("currency")

    return (
        <div className="flex flex-col gap-6 p-8">
            <h1 className="text-3xl font-bold">{t('settings.title') || "Settings"}</h1>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>{t('settings.currencyTitle') || "Store Currency"}</CardTitle>
                    <CardDescription>{t('settings.currencyDesc') || "Select the main currency for your store."}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t('settings.currency') || "Currency"}</Label>

                            {!customCurrency ? (
                                <div className="flex gap-2">
                                    <Select
                                        onValueChange={(val) => {
                                            if (val === "CUSTOM") {
                                                setCustomCurrency(true)
                                                form.setValue("currency", "")
                                            } else {
                                                form.setValue("currency", val)
                                            }
                                        }}
                                        value={["USD", "EUR", "RUB", "KZT", "UAH"].includes(currentCurrency) ? currentCurrency : "CUSTOM"}
                                    >
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Select Currency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="USD">USD ($)</SelectItem>
                                            <SelectItem value="EUR">EUR (€)</SelectItem>
                                            <SelectItem value="RUB">RUB (₽)</SelectItem>
                                            <SelectItem value="KZT">KZT (₸)</SelectItem>
                                            <SelectItem value="UAH">UAH (₴)</SelectItem>
                                            <SelectItem value="CUSTOM">Custom...</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                <div className="flex gap-2 items-center">
                                    <Input
                                        {...form.register("currency")}
                                        placeholder="e.g. GBP"
                                        className="w-[100px]"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => {
                                            setCustomCurrency(false)
                                            form.setValue("currency", "USD")
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            )}
                            <p className="text-sm text-gray-500">
                                This currency symbol will be displayed next to all product prices.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Primary Color</Label>
                            <div className="flex gap-4 items-center">
                                <Input
                                    type="color"
                                    {...form.register("primaryColor")}
                                    className="w-16 h-10 p-1 cursor-pointer"
                                />
                                <Input
                                    {...form.register("primaryColor")}
                                    placeholder="#000000"
                                    className="font-mono max-w-[120px]"
                                />
                            </div>
                            <p className="text-sm text-gray-500">
                                The main accent color for your Mini App.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Welcome Message</Label>
                            <Input
                                {...form.register("welcomeMessage")}
                                placeholder="Welcome to our shop!"
                            />
                            <p className="text-sm text-gray-500">
                                Displayed at the top of the product catalog.
                            </p>
                        </div>

                        <div className="space-y-2 border-t pt-4">
                            <Label>Admin Notification Chat ID</Label>
                            <div className="flex flex-col gap-2">
                                <Input
                                    {...form.register("notificationChatId")}
                                    placeholder="e.g. 123456789"
                                />
                                <p className="text-sm text-gray-500">
                                    To receive order notifications, start your bot and send the command <code>/id</code>. Copy the number here.
                                </p>
                            </div>
                        </div>

                        <Button type="submit" disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4" />
                            Save Settings
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
