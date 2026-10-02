import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { AppShell } from "@/components/app-shell"
import { ThemeProvider } from "@/components/theme-provider"
import { EnvironmentProvider } from "@/features/environments/context"
import { strings } from "@/lib/strings"
import { cn } from "@/lib/utils"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: strings.app.title,
  description: strings.app.description,
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  manifest: "/site.webmanifest",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, geist.variable)}
    >
      <body>
        <ThemeProvider>
          <EnvironmentProvider>
            <AppShell>{children}</AppShell>
          </EnvironmentProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
