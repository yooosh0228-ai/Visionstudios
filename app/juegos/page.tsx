import type { Metadata } from "next"

import { Juegos } from "@/components/juegos/juegos"
import { PaginaProximamente } from "@/components/sitio/proximamente"
import { getSession } from "@/generation/session"
import { TRENDS } from "@/lib/studio/trends"

import "./juegos.css"

export const metadata: Metadata = {
  title: "Juegos dominicanos · Vision Studios",
  description:
    "Trivia dominicana en línea con tus panas, «Dilo sin decirlo» y la carrera de motoconchos. Gratis, desde el celular.",
  alternates: { canonical: "https://402visionstudios.com/juegos" },
}

export const dynamic = "force-dynamic"

export default async function Pagina() {
  let session = null
  try {
    session = await getSession()
  } catch {
    session = null
  }
  // Los juegos todavía no están abiertos al público: solo el dueño entra.
  if (!session?.isOwner) return <PaginaProximamente fotos={TRENDS.slice(0, 6).map((t) => t.cover)} inicio={2} />
  return <Juegos />
}
