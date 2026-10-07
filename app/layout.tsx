import type { Metadata, Viewport } from "next"
import { IBM_Plex_Mono, IBM_Plex_Sans, Poppins } from "next/font/google"

import { cn } from "@/lib/utils"

import "./globals.css"

// 402 Vision Studios type; styles/theme.css maps them onto --hf-type-family-*-base.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
})
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
})
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Vision Studios · Estudio",
  description:
    "El estudio de Vision Studios: imágenes y video para tu marca, y agentes especialistas que trabajan para tu negocio.",
  applicationName: "Vision Studios",
}

export const viewport: Viewport = { themeColor: "#141819" }

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      data-theme="default-dark"
      className={cn(
        "dark font-sans antialiased",
        poppins.variable,
        plexSans.variable,
        plexMono.variable
      )}
    >
      <body className="min-h-svh bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}
