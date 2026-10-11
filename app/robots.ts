import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/cuenta", "/entrar", "/api/"],
    },
    sitemap: "https://402visionstudios.com/sitemap.xml",
  }
}
