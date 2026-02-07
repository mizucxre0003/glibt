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

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
    const router = useRouter()
    const { t } = useLanguage()
    const [error, setError] = useState<string | null>(null)
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    })

    const onSubmit = async (data: LoginFormValues) => {
        setError(null)
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            const json = await res.json()

            if (!res.ok) {
                throw new Error(json.error || "Failed to login")
            }

            setToken(json.token)
            router.push("/admin/dashboard")
        } catch (err: any) {
            setError(err.message)
        }
    }

    return (
        <div className="flex h-screen items-center justify-center">
            <Card>
                <CardHeader>
                    <CardTitle>{t('auth.loginTitle')}</CardTitle>
                    <CardDescription>{t('auth.loginDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="grid w-full items-center gap-4">
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="email">{t('auth.emailLabel')}</Label>
                            <Input id="email" placeholder="name@example.com" {...register("email")} />
                            {errors.email && <p className="text-sm text-red-500">{t('auth.emailLabel')} is invalid</p>}
                        </div>
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="password">{t('auth.passwordLabel')}</Label>
                            <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
                            {errors.password && <p className="text-sm text-red-500">{t('auth.passwordLabel')} is required</p>}
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <Button className="w-full mt-4" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? t('auth.loggingIn') : t('auth.loginButton')}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-gray-500">{t('auth.noAccount')} <Link href="/admin/register" className="underline">{t('auth.registerLink')}</Link></p>
                </CardFooter>
            </Card>
        </div>
    )
}
