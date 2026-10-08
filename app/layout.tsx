import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"

import { cn } from "@/lib/utils"

import "./globals.css"

// Tipografía de Vision Studios, servida desde el propio sitio (sin pedirle nada
// a Google): carga más rápido, funciona aunque Google Fonts falle y no comparte
// datos de quien entra. styles/theme.css las asigna a --hf-type-family-*-base.
const poppins = localFont({
  src: [
    { path: "./fonts/poppins-latin-500-normal.woff2", weight: "500" },
    { path: "./fonts/poppins-latin-600-normal.woff2", weight: "600" },
    { path: "./fonts/poppins-latin-700-normal.woff2", weight: "700" },
  ],
  variable: "--font-poppins",
  display: "swap",
})
const plexSans = localFont({
  src: [
    { path: "./fonts/ibm-plex-sans-latin-400-normal.woff2", weight: "400" },
    { path: "./fonts/ibm-plex-sans-latin-500-normal.woff2", weight: "500" },
    { path: "./fonts/ibm-plex-sans-latin-600-normal.woff2", weight: "600" },
  ],
  variable: "--font-ibm-plex-sans",
  display: "swap",
})
const plexMono = localFont({
  src: [
    { path: "./fonts/ibm-plex-mono-latin-400-normal.woff2", weight: "400" },
    { path: "./fonts/ibm-plex-mono-latin-500-normal.woff2", weight: "500" },
  ],
  variable: "--font-ibm-plex-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Estudio · Vision Studios",
  description:
    "Crea imágenes y video para tu negocio desde el navegador. Entra con Google y paga solo lo que generas.",
  applicationName: "Estudio Vision",
}

export const viewport: Viewport = { themeColor: "#141819" }

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es-DO"
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
