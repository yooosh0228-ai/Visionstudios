import type { Metadata } from "next"

import { Demo } from "@/components/demo/demo"

import "./demo.css"

export const metadata: Metadata = {
  title: "Demo de tu app · Vision Studios",
  description: "Pon tu logo y tus colores y mira una muestra de tu negocio en una app. Después la hacemos a tu medida.",
  alternates: { canonical: "https://402visionstudios.com/demo" },
}

export default function Pagina() {
  return <Demo />
}
