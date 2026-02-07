"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { setToken } from "@/lib/auth-client"
import { useLanguage } from "@/lib/i18n"

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    shopName: z.string().min(3),
})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
    const router = useRouter()
    const { t } = useLanguage()
    const [error, setError] = useState<string | null>(null)
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
    })

    const onSubmit = async (data: RegisterFormValues) => {
        setError(null)
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            const json = await res.json()

            if (!res.ok) {
                throw new Error(json.error || "Failed to register")
            }

            setToken(json.token)
            router.push("/admin/dashboard")
        } catch (err: any) {
            if (Array.isArray(err.message)) {
                setError(err.message.map((e: any) => e.message).join(", "))
            } else {
                setError(err.message)
            }
        }
    }

    return (
        <div className="flex h-screen items-center justify-center">
            <Card>
                <CardHeader>
                    <CardTitle>{t('auth.registerTitle')}</CardTitle>
                    <CardDescription>{t('auth.registerDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="grid w-full items-center gap-4">
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="shopName">{t('auth.shopNameLabel')}</Label>
                            <Input id="shopName" placeholder="My Awesome Shop" {...register("shopName")} />
                            {errors.shopName && <p className="text-sm text-red-500">Name is too short</p>}
                        </div>
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="email">{t('auth.emailLabel')}</Label>
                            <Input id="email" placeholder="name@example.com" {...register("email")} />
                            {errors.email && <p className="text-sm text-red-500">Email is invalid</p>}
                        </div>
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="password">{t('auth.passwordLabel')}</Label>
                            <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
                            {errors.password && <p className="text-sm text-red-500">Password is too short</p>}
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <Button className="w-full mt-4" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? t('auth.creating') : t('auth.registerButton')}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-gray-500">{t('auth.hasAccount')} <Link href="/admin/login" className="underline">{t('auth.loginLink')}</Link></p>
                </CardFooter>
            </Card>
        </div>
    )
}
