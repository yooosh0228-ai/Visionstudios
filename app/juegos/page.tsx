import type { Metadata } from "next"

import { Juegos } from "@/components/juegos/juegos"

import "./juegos.css"

export const metadata: Metadata = {
  title: "Juegos dominicanos · Vision Studios",
  description:
    "Trivia dominicana en línea con tus panas, «Dilo sin decirlo» y la carrera de motoconchos. Gratis, desde el celular.",
  alternates: { canonical: "https://402visionstudios.com/juegos" },
}

export default function Pagina() {
  return <Juegos />
}
