import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://402visionstudios.com"
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/juegos`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/demo`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/estudio`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/privacidad`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${base}/terminos`, changeFrequency: "yearly", priority: 0.1 },
  ]
}
