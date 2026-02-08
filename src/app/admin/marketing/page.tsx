
"use client"

import { useState } from "react"
import { useLanguage } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Send, Image as ImageIcon } from "lucide-react"

export default function MarketingPage() {
    const { t } = useLanguage()
    const [message, setMessage] = useState("")
    const [imageUrl, setImageUrl] = useState("")
    const [sending, setSending] = useState(false)
    const [uploading, setUploading] = useState(false)

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const token = localStorage.getItem('token')
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            })

            if (res.ok) {
                const data = await res.json()
                setImageUrl(data.url)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setUploading(false)
        }
    }

    const handleBroadcast = async () => {
        if (!message) return
        if (!confirm("Are you sure you want to send this message to ALL customers?")) return

        setSending(true)
        const token = localStorage.getItem('token')
        try {
            const res = await fetch('/api/bot/broadcast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message, imageUrl })
            })

            const data = await res.json()
            if (res.ok) {
                alert(`Broadcast sent!\nSuccess: ${data.sent}\nFailed: ${data.failed}`)
                setMessage("")
                setImageUrl("")
            } else {
                alert(`Error: ${data.error}`)
            }
        } catch (e) {
            console.error(e)
            alert("Unexpected error during broadcast.")
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Marketing & Broadcast</h1>
                <p className="text-muted-foreground">Send messages and updates to all your bot subscribers.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>New Broadcast</CardTitle>
                    <CardDescription>
                        This message will be sent to all users who have interacted with your bot.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Message Text</Label>
                        <Textarea
                            placeholder="Hello! Check out our new summer collection..."
                            className="min-h-[150px]"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Attach Image (Optional)</Label>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Button variant="outline" type="button" disabled={uploading}>
                                    {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                                    Upload Image
                                </Button>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                />
                            </div>
                            {imageUrl && (
                                <div className="relative w-16 h-16 rounded overflow-hidden border">
                                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button onClick={handleBroadcast} disabled={sending || !message}>
                            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Send Broadcast
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
