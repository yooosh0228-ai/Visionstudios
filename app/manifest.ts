import type { MetadataRoute } from "next"

/** Permite añadir el Estudio a la pantalla de inicio y abrirlo como app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Estudio Vision",
    short_name: "Estudio",
    description: "Crea imágenes y video para tu negocio.",
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
