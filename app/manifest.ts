import type { MetadataRoute } from "next"

/** Permite añadir Vision Studios a la pantalla de inicio y abrirlo como app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vision Studios",
    short_name: "Vision",
    description:
      "Apps, páginas, marca y video para tu negocio. Tu cuenta, tus proyectos y el Estudio.",
    lang: "es-DO",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#141819",
    theme_color: "#141819",
    icons: [
      { src: "/icono-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icono-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icono-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
