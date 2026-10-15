/**
 * Trends: maquetas de un toque. Cada una dice qué modelo usa, si pide una foto
 * (selfie o producto), si pide un texto corto y cómo arma la descripción que va
 * al modelo. La persona solo escoge, sube su foto y toca Generar.
 *
 * Las descripciones van en inglés porque así responden mejor los modelos; la
 * persona nunca las ve.
 */
import type { GenerationPlane, MediaItem } from "@/generation/catalog"

const CDN = "https://d8j0ntlcm91z4.cloudfront.net/user_3Fy5zinm57MfSWOTmON75ozgJVz/"
const muestra = (id: string) => `${CDN}${id}_min.webp`

export type TrendCategory = "foto" | "negocio" | "video" | "bulto"

export const TREND_CATEGORIES: { id: "todo" | TrendCategory; label: string }[] =
  [
    { id: "todo", label: "Pa' tripear" },
    { id: "bulto", label: "Pa'l bulto" },
    { id: "foto", label: "Con tu foto" },
    { id: "video", label: "Videos" },
    { id: "negocio", label: "Pa' tu negocio" },
  ]

export type TrendPhoto = {
  /** Qué se le pide a la persona: «Tu selfie», «Foto de tu producto». */
  label: string
  hint: string
  /** Cómo entra la foto al modelo. */
  role: "reference" | "start"
}

export type TrendText = {
  label: string
  placeholder: string
  max: number
  /** Valor que se usa si la persona lo deja vacío. */
  fallback: string
}

export type Trend = {
  id: string
  title: string
  subtitle: string
  category: TrendCategory
  kind: "image" | "video"
  /** Muestra de la tarjeta (3:4). */
  cover: string
  /** Foto «antes» de ejemplo (la referencia que se habría subido). */
  before?: string
  /** Video de muestra que corre en la tarjeta, si hay. */
  coverVideo?: string
  /** Etiqueta pequeña sobre la tarjeta. */
  badge?: string
  model: string
  settings: Record<string, unknown>
  photo?: TrendPhoto
  text?: TrendText
  prompt: (text: string) => string
}

const KEEP_FACE =
  "Use the person in the reference photo as the subject. Keep the exact same face, identity, skin tone, hairstyle and body type; do not beautify or change their features."

const SELFIE: TrendPhoto = {
  label: "Tu selfie",
  hint: "Una foto tuya de frente, con buena luz. Sale mejor si se te ve la cara completa.",
  role: "reference",
}

const SELFIE_SETTINGS = { aspectRatio: "3:4", resolution: "1k" }

/**
 * Pa'l bulto: fotos para aparentar. Las muestras se generan en Soul con los
 * prompts de la guía; mientras una trend no tenga muestra (cover vacío), no se
 * muestra en ninguna parte.
 */
const BULTO: Trend[] = [
  {
    id: "carro-nuevo",
    title: "Del Accord al Mercedes",
    subtitle: "Mismo barrio, otro carro y otra pinta",
    category: "bulto",
    kind: "image",
    cover: "/trends/carro-despues.webp",
    before: "/trends/carro-antes.webp",
    badge: "🔥 El más usado",
    model: "grok-imagine-2",
    settings: SELFIE_SETTINGS,
    photo: SELFIE,
    prompt: () =>
      `${KEEP_FACE} Same Dominican neighborhood street as the photo, but the person now leans proudly on a brand-new glossy black luxury German sedan, wearing a sharp designer outfit, clean sneakers and a watch, golden afternoon light, realistic phone photo, no visible logos or license plate text.`,
  },
  {
    id: "rolex-diamantes",
    title: "Rolex con diamantes",
    subtitle: "Tu muñeca, otro nivel y otro lugar",
    category: "bulto",
    kind: "image",
    cover: "/trends/reloj-despues.webp",
    before: "/trends/reloj-antes.webp",
    badge: "Pa'l bulto",
    model: "grok-imagine-2",
    settings: SELFIE_SETTINGS,
    photo: {
      label: "Foto de tu muñeca o tu brazo",
      hint: "Tómala como sea, en tu casa. Nosotros cambiamos el resto.",
      role: "reference",
    },
    prompt: () =>
      "Use the arm and hand from the reference photo, same skin tone and shape. Now wearing a luxury gold watch fully set with diamonds on the wrist, crisp cuff of an elegant shirt, inside a clean modern luxury penthouse with warm light and marble, shallow depth of field, realistic photo, no brand names or logos.",
  },
]

const TODAS: Trend[] = [
  {
    id: "noche-de-pelota",
    title: "Noche de pelota",
    subtitle: "Tú en las gradas, celebrando el jonrón",
    category: "foto",
    kind: "image",
    cover: muestra("hf_20261015_065355_67a18948-6c3f-4468-bafd-d09ca896d762"),
    before: muestra("hf_20261015_065427_4db788d2-77b7-4f07-8006-b031e3b06c31"),
    badge: "Trend",
    model: "grok-imagine-2",
    settings: SELFIE_SETTINGS,
    photo: SELFIE,
    prompt: () =>
      `${KEEP_FACE} Candid phone photo with flash at night in the stands of a packed baseball stadium in Santiago, Dominican Republic. The person wears a vintage golden-yellow button-up baseball jersey with black and white piping and a black baseball cap, both arms raised celebrating a home run, joyful shouting face, fans cheering around, stadium lights behind, slight motion blur, realistic, no logos.`,
  },
  {
    id: "figura-coleccion",
    title: "Figura de colección",
    subtitle: "Tu muñeco a escala, con su caja",
    category: "foto",
    kind: "image",
    cover: muestra("hf_20261015_064519_d962471c-005c-413c-95aa-0576e0e6d7df"),
    before: muestra("hf_20261015_065357_68bbd343-50ae-44ea-a4ca-2ac023be2ba0"),
    badge: "Viral",
    model: "grok-imagine-2",
    settings: SELFIE_SETTINGS,
    photo: SELFIE,
    prompt: () =>
      `${KEEP_FACE} Photorealistic photo of a 1/7 scale collectible PVC figurine of this person in the same outfit, standing on a round clear acrylic base on a wooden desk. Behind it a colorful collector box with an illustrated portrait of the same person, and a computer monitor showing the 3D sculpting model of the figure. Soft indoor light, shallow depth of field.`,
  },
  {
    id: "muneco-en-caja",
    title: "Muñeco en caja",
    subtitle: "Tu juguete con accesorios y tu nombre",
    category: "foto",
    kind: "image",
    cover: muestra("hf_20261015_234808_8d2123d8-2790-4304-87c6-d8ef0252ae24"),
    before:
      "https://d2ol7oe51mr4n9.cloudfront.net/user_3Fy5zinm57MfSWOTmON75ozgJVz/1c7c48f6-acc8-44f4-ae17-a0430990f9fc.png",
    model: "grok-imagine-2",
    settings: SELFIE_SETTINGS,
    photo: SELFIE,
    text: {
      label: "Nombre en la caja",
      placeholder: "Ej.: YOSH",
      max: 16,
      fallback: "EDICIÓN SANTIAGO",
    },
    prompt: (texto) =>
      `${KEEP_FACE} Photorealistic product photo of an action figure toy of this person inside a blister pack box, with small accessories in separate plastic slots that match their style. The box is bold green and black with the big white title text "${texto}" at the top. Studio lighting, clean background.`,
  },
  {
    id: "portada-revista",
    title: "Portada de revista",
    subtitle: "Sales en la portada, con tu nombre",
    category: "foto",
    kind: "image",
    cover: muestra("hf_20261015_064518_fbe0365a-fd7f-44fd-ac41-7944287be46a"),
    before: muestra("hf_20261015_065356_9ab833b5-1051-452e-b989-4222628baeaa"),
    model: "grok-imagine-2",
    settings: SELFIE_SETTINGS,
    photo: SELFIE,
    text: {
      label: "Tu nombre",
      placeholder: "Ej.: Ana Rodríguez",
      max: 24,
      fallback: "La nueva cara de Santiago",
    },
    prompt: (texto) =>
      `${KEEP_FACE} Glossy fashion magazine cover photograph of this person in an elegant outfit, professional editorial studio lighting, looking at camera. Big masthead title "VISION" at the top and the cover line "${texto}" in white. High-end print look.`,
  },
  {
    id: "carnaval",
    title: "Carnaval",
    subtitle: "Con tu careta y el disfraz completo",
    category: "foto",
    kind: "image",
    cover: muestra("hf_20261015_064447_079aa092-61ab-4348-b50e-f74a4227b672"),
    model: "grok-imagine-2",
    settings: SELFIE_SETTINGS,
    photo: SELFIE,
    prompt: () =>
      `${KEEP_FACE} Street photo during carnival in La Vega, Dominican Republic. The person wears a vivid hand-made carnival costume covered in colorful ribbons, small mirrors and bells, holding an ornate horned papier-mâché devil mask beside the face, big smile, confetti in the air, crowd and colorful street behind, bright afternoon sun, realistic.`,
  },
  {
    id: "malecon",
    title: "Atardecer en el Malecón",
    subtitle: "Retrato de hora dorada frente al mar",
    category: "foto",
    kind: "image",
    cover: muestra("hf_20261015_064448_d49fb799-a376-483d-a6ad-042d128e2009"),
    model: "grok-imagine-2",
    settings: SELFIE_SETTINGS,
    photo: SELFIE,
    prompt: () =>
      `${KEEP_FACE} Golden hour portrait leaning on the sea wall of a Caribbean malecón, ocean and palm trees behind, warm sunset backlight in the hair, white linen shirt, relaxed happy expression, 85mm lens, shallow depth of field, film grain.`,
  },
  {
    id: "dibujo-animado",
    title: "Tu versión animada",
    subtitle: "Como en una película dibujada a mano",
    category: "foto",
    kind: "image",
    cover: muestra("hf_20261015_064526_8f388554-cee1-4153-9f74-f5bf91cddacc"),
    before: muestra("hf_20261015_222525_4ff665a0-f1ec-4bed-a020-aaf36ffd86f8"),
    coverVideo: `${CDN}hf_20261015_222547_76386d9e-2736-4b3d-99a6-6be419fe6e7d.mp4`,
    badge: "Con video",
    model: "grok-imagine-2",
    settings: SELFIE_SETTINGS,
    photo: SELFIE,
    prompt: () =>
      `Turn the person in the reference photo into a hand-drawn 2D animated film character, keeping their recognizable face, hairstyle and outfit. Soft watercolor backgrounds and clean ink lines, warm nostalgic feeling, sitting outside a small colorful Dominican corner store at sunset playing dominoes, original art style.`,
  },
  {
    id: "foto-de-perfil",
    title: "Foto de perfil pro",
    subtitle: "De estudio, para WhatsApp y LinkedIn",
    category: "foto",
    kind: "image",
    cover: muestra("hf_20261015_064446_f6e5e6c0-158e-4474-bf75-33ca989d2e66"),
    before: muestra("hf_20261015_065358_d4cb361a-d90a-4099-8552-f77b85b7ce2c"),
    model: "grok-imagine-2",
    settings: SELFIE_SETTINGS,
    photo: SELFIE,
    prompt: () =>
      `${KEEP_FACE} Professional studio headshot, smart casual outfit, friendly confident smile, dark charcoal seamless background, soft key light with subtle rim light, sharp eyes, realistic skin texture, profile photo quality.`,
  },
  {
    id: "graduacion",
    title: "Graduación",
    subtitle: "Con toga, birrete y tu título en la mano",
    category: "foto",
    kind: "image",
    cover: muestra("hf_20261015_222524_821a0b7a-5ecf-4df8-a3f5-b2977e703015"),
    before: muestra("hf_20261015_222612_60e2b535-7364-4301-90c6-9cab38e5fb8a"),
    badge: "Nuevo",
    model: "grok-imagine-2",
    settings: SELFIE_SETTINGS,
    photo: SELFIE,
    prompt: () =>
      `${KEEP_FACE} Proud graduation photo in cap and gown holding a diploma, golden hour on a university campus with palm trees, confetti, joyful smile, professional photo, shallow depth of field.`,
  },
  {
    id: "punta-cana",
    title: "De vacaciones en Punta Cana",
    subtitle: "De la oficina a la playa en un toque",
    category: "foto",
    kind: "image",
    cover: muestra("hf_20261015_222524_b9f38b2a-697d-4659-9836-175b8ce7b858"),
    before: muestra("hf_20261015_222612_2126d77d-1321-4b2a-8096-55d095d72a6a"),
    model: "grok-imagine-2",
    settings: SELFIE_SETTINGS,
    photo: SELFIE,
    prompt: () =>
      `${KEEP_FACE} Vacation photo on a white sand Caribbean beach in Punta Cana, linen shirt and sunglasses, turquoise water, palm tree, holding a coconut, sunny, editorial travel photo, realistic.`,
  },
  {
    id: "corte-fresco",
    title: "Corte fresco",
    subtitle: "Prueba un recorte antes de ir al barbero",
    category: "foto",
    kind: "image",
    cover: muestra("hf_20261015_222523_2f93c605-73a7-412d-bb51-4e55465191b4"),
    before: muestra("hf_20261015_222611_5c5eb239-3152-4c47-9e56-ead2f54cb8e4"),
    model: "grok-imagine-2",
    settings: SELFIE_SETTINGS,
    photo: SELFIE,
    text: {
      label: "¿Qué corte? (opcional)",
      placeholder: "Ej.: low fade con diseño",
      max: 60,
      fallback: "a sharp low fade with a clean line-up",
    },
    prompt: (texto) =>
      `${KEEP_FACE} Only change the hair to ${texto}. Close portrait in a modern Dominican barbershop, neon sign glow, mirror reflections, confident look, realistic, high detail.`,
  },
  {
    id: "dale-vida",
    title: "Dale vida a tu foto",
    subtitle: "Tu foto se mueve: 5 segundos de video",
    category: "video",
    kind: "video",
    cover: muestra("hf_20261015_064448_d49fb799-a376-483d-a6ad-042d128e2009"),
    badge: "Video",
    model: "seedance-2.5",
    settings: {
      aspectRatio: "9:16",
      duration: 5,
      resolution: "720p",
      generateAudio: true,
      bitrateMode: "standard",
    },
    photo: {
      label: "La foto que quieres mover",
      hint: "Cualquier foto: tuya, de tu negocio o una que generaste aquí.",
      role: "start",
    },
    text: {
      label: "¿Qué pasa en el video? (opcional)",
      placeholder: "Ej.: sonríe y saluda a la cámara",
      max: 120,
      fallback: "",
    },
    prompt: (texto) =>
      texto
        ? `Bring this photo to life: ${texto}. Natural, realistic motion, gentle handheld camera, keep the same people and place.`
        : "Bring this photo to life with natural, realistic motion: subtle smiles, hair and clothes moving with the breeze, gentle handheld camera push-in, keep the same people and place.",
  },
  {
    id: "paisaje-en-video",
    title: "Paisaje en video",
    subtitle: "Toma de dron de lo que te imagines",
    category: "video",
    kind: "video",
    cover: muestra("hf_20261015_064448_0ba01e0f-fb12-4979-a870-08f8725fc4b8"),
    badge: "Video",
    model: "seedance-2.5",
    settings: {
      aspectRatio: "9:16",
      duration: 5,
      resolution: "720p",
      generateAudio: true,
      bitrateMode: "standard",
    },
    text: {
      label: "¿Qué lugar?",
      placeholder: "Ej.: las montañas de Jarabacoa al amanecer",
      max: 120,
      fallback: "the misty green mountains of Jarabacoa at sunrise",
    },
    prompt: (texto) =>
      `Cinematic aerial drone shot slowly gliding over ${texto}, golden light, gentle clouds, epic scale, smooth motion, realistic.`,
  },
  {
    id: "cartel-negocio",
    title: "Cartel para tu negocio",
    subtitle: "Listo para estados e historias",
    category: "negocio",
    kind: "image",
    cover: muestra("hf_20261015_064447_6c412213-6d82-4c76-810a-d98c2d212160"),
    model: "ideogram-4",
    settings: { aspectRatio: "3:4", resolution: "1k" },
    text: {
      label: "Nombre y qué vendes",
      placeholder: "Ej.: Panadería La Esquina, pan caliente",
      max: 80,
      fallback: "Panadería La Esquina, pan caliente desde las 6",
    },
    prompt: (texto) =>
      `Bold vertical promotional poster for a small Dominican business: ${texto}. The business name in big clean letters at the top, an appetizing hero photo of what they sell, warm light, a short tagline at the bottom, modern graphic design, high contrast. All text in Spanish, spelled exactly.`,
  },
  {
    id: "mascota-negocio",
    title: "Mascota de tu negocio",
    subtitle: "Un personaje 3D para tu marca",
    category: "negocio",
    kind: "image",
    cover: muestra("hf_20261015_064527_844e0aee-56ec-4690-a4b0-ea06a56ac1f7"),
    model: "grok-imagine-2",
    settings: { aspectRatio: "3:4", resolution: "1k" },
    text: {
      label: "¿Qué negocio es?",
      placeholder: "Ej.: un car wash",
      max: 60,
      fallback: "a car wash",
    },
    prompt: (texto) =>
      `Cute 3D mascot character for ${texto}: friendly smiling character with big eyes that clearly represents the business, holding a typical tool of the trade, glossy Pixar-like render, soft studio light, clean light background.`,
  },
  {
    id: "foto-de-producto",
    title: "Foto de producto",
    subtitle: "Tu producto en un estudio de lujo",
    category: "negocio",
    kind: "image",
    cover: muestra("hf_20261015_064447_23bef359-075a-4419-874a-0fcb35c00f28"),
    before: muestra("hf_20261015_065356_5947d0df-89a4-439b-935c-efe3b70c78af"),
    model: "grok-imagine-2",
    settings: SELFIE_SETTINGS,
    photo: {
      label: "Foto de tu producto",
      hint: "Tómala con el celular; no importa el fondo.",
      role: "reference",
    },
    prompt: () =>
      "Premium advertising photo of the exact product from the reference photo, keep its shape, label and colors unchanged, on a black stone pedestal, single spotlight from above, dramatic rim light, fine mist, dark green background, reflections, commercial quality.",
  },
]

/** Solo las que ya tienen muestra. */
export const TRENDS: Trend[] = [...BULTO, ...TODAS].filter((t) => t.cover)

/** Las trends con foto de referencia permiten cambiar el lugar de fondo. */
export function aceptaLugar(trend: Trend): boolean {
  return trend.kind === "image" && trend.photo?.role === "reference"
}

export function getTrend(id: string): Trend | undefined {
  return TRENDS.find((t) => t.id === id)
}

/** Lo que va al modelo: descripción con el texto de la persona y su foto. */
export function trendPlane(
  trend: Trend,
  input: {
    text?: string
    photo?: { url: string; name?: string } | null
    /** Lugar de fondo que la persona escribió (opcional). */
    lugar?: string
  }
): GenerationPlane {
  const lugar = (input.lugar ?? "").trim().replace(/\s+/g, " ").slice(0, 100).replace(/"/g, "'")
  const raw = (input.text ?? "").trim().replace(/\s+/g, " ")
  const text = trend.text
    ? (raw.slice(0, trend.text.max) || trend.text.fallback).replace(/"/g, "'")
    : ""
  const media: MediaItem[] =
    trend.photo && input.photo
      ? [
          {
            id: input.photo.url,
            url: input.photo.url,
            role: trend.photo.role,
            kind: "image",
            ...(input.photo.name ? { name: input.photo.name } : {}),
          },
        ]
      : []
  return {
    model: trend.model,
    ...(trend.photo?.role === "start" && media.length
      ? { inputMode: "frames" }
      : {}),
    prompt: {
      text: lugar && aceptaLugar(trend)
        ? `${trend.prompt(text)} Replace the entire background and environment with: ${lugar}. Keep the person, pose, clothing details and lighting coherent with the new place.`
        : trend.prompt(text),
    },
    media: media.length ? { [trend.photo!.role]: media } : {},
    settings: { ...trend.settings },
  }
}
