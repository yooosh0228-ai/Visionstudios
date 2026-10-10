import type { Metadata } from "next"

import { Sitio } from "@/components/sitio/sitio"
import { sitioPublico } from "@/lib/vs/datos"

// La portada se arma en el servidor y se guarda un minuto; al editar el
// catálogo en el panel se vuelve a armar de inmediato.
export const revalidate = 60

export const metadata: Metadata = {
  title: "Vision Studios — Apps, páginas, marca y video en Santiago",
  description:
    "Estudio de Santiago de los Caballeros. Diseñamos y programamos apps, páginas, identidad de marca y video para negocios, a la medida y desde cero.",
  alternates: { canonical: "https://402visionstudios.com/" },
  openGraph: {
    type: "website",
    locale: "es_DO",
    siteName: "Vision Studios",
    title: "Vision Studios — Tu negocio, en foco",
    description: "Apps, páginas, marca y video hechos a la medida para negocios de Santiago.",
    url: "https://402visionstudios.com/",
    images: [{ url: "https://402visionstudios.com/og.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
}

export default async function Inicio() {
  const { ajustes, trabajos, ofertas } = await sitioPublico()
  return <Sitio ajustes={ajustes} trabajos={trabajos} ofertas={ofertas} />
}
