import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils"
import Providers from "./providers";

const fontSans = Montserrat({ subsets: ["latin", "cyrillic"], variable: "--font-sans", });

export const metadata: Metadata = {
  title: "Glim Admin",
  description: "Manage your Telegram Shop",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased text-foreground",
        fontSans.variable
      )}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
