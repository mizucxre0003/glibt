
import Script from "next/script"
import { TMAProvider } from "./providers"
import { Inter } from "next/font/google"
import "@/app/globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
    title: "Telegram Shop",
    description: "Shop Mini App",
}

export default function TMALayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <head>
                <Script
                    src="https://telegram.org/js/telegram-web-app.js"
                    strategy="beforeInteractive"
                />
            </head>
            <body className={inter.className}>
                <TMAProvider>
                    <main className="min-h-screen bg-background text-foreground">
                        {children}
                    </main>
                </TMAProvider>
            </body>
        </html>
    )
}
