/* eslint-disable @next/next/no-img-element */
"use client"

import type { KeyboardEvent, ReactNode } from "react"
import {
  Aperture,
  Clapperboard,
  Coffee,
  Megaphone,
  Music,
  Smartphone,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Templates — the "what you can make" examples. A `TemplateItem` seeds the
 * prompt dock (prompt text + optional model/settings) when its Try action fires.
 * `TemplateCard` and `ExamplePresets` render them; the Explore tab on Home uses
 * `ExamplePresets`.
 */

const ART = {
  productSpot: "/presets/product-spot.svg",
  verticalReel: "/presets/vertical-reel.svg",
  editorialPortrait: "/presets/editorial-portrait.svg",
  campaignKeyVisual: "/presets/campaign-key-visual.svg",
  eventAftermovie: "/presets/event-aftermovie.svg",
  brandStillLife: "/presets/brand-still-life.svg",
} as const

/** Shared by the hero until the user has three finished outputs of their own. */
export const HERO_ART = [
  ART.editorialPortrait,
  ART.productSpot,
  ART.eventAftermovie,
] as const

export interface TemplateItem {
  id: string
  title: string
  subtitle: string
  /** Free-form filter category used by the picker tabs. */
  category: string
  kind: "image" | "video"
  images: [string, string, string]
  icon: LucideIcon
  /** What the Try action puts in the dock. */
  prompt: string
  /** Catalog model id to switch to, when the template needs a specific one. */
  modelId?: string
  settings?: Record<string, unknown>
}

/** Ejemplos de Vision Studios: each one loads a production-ready prompt and the
    model/settings it was written for. The user can still switch model after. */
export const TEMPLATES: TemplateItem[] = [
  {
    id: "product-spot",
    title: "Spot de producto",
    subtitle: "Tu producto como protagonista",
    category: "commercial",
    kind: "video",
    images: [ART.productSpot, ART.brandStillLife, ART.campaignKeyVisual],
    icon: Clapperboard,
    prompt:
      "Presentación comercial de producto: una botella de vidrio sube sobre un pedestal de piedra oscura, giro lento de cámara de 180 grados, luz de contorno ámbar, polvo fino flotando bajo un solo foco cenital, poca profundidad de campo, elegante y en calma.",
    modelId: "seedance-2.5",
    settings: {
      aspectRatio: "16:9",
      duration: 8,
      resolution: "720p",
      generateAudio: true,
    },
  },
  {
    id: "vertical-reel",
    title: "Reel vertical",
    subtitle: "Arranque 9:16 para Instagram y TikTok",
    category: "social",
    kind: "video",
    images: [ART.verticalReel, ART.eventAftermovie, ART.productSpot],
    icon: Smartphone,
    prompt:
      "Arranque vertical para redes: caminata con cámara en mano por el Malecón a la hora dorada, la ciudad en silueta, olas brillando con el sol, barrido rápido hacia un primer plano de la persona sonriendo a cámara, natural y con energía.",
    modelId: "kling-3-pro",
    settings: { aspectRatio: "9:16", duration: 5, sound: true },
  },
  {
    id: "editorial-portrait",
    title: "Retrato editorial",
    subtitle: "Retrato de revista para tu marca",
    category: "photo",
    kind: "image",
    images: [ART.editorialPortrait, ART.brandStillLife, ART.campaignKeyVisual],
    icon: Aperture,
    prompt:
      "Retrato editorial de un músico con abrigo verde oscuro frente a una pared gris carbón, una sola luz dura desde la izquierda, lente de 85 mm, poca profundidad de campo, piel con textura real, mirada tranquila y segura, grano de película.",
    modelId: "soul-cinema",
    settings: { aspectRatio: "3:4", resolution: "1080p" },
  },
  {
    id: "campaign-key-visual",
    title: "Arte de campaña",
    subtitle: "Cartel con espacio para el texto",
    category: "brand",
    kind: "image",
    images: [ART.campaignKeyVisual, ART.productSpot, ART.verticalReel],
    icon: Megaphone,
    prompt:
      "Arte de campaña para un festival de verano: fondo ámbar plano y fuerte, un gran sol verde poniéndose sobre olas oscuras estilizadas a la derecha, espacio vacío y limpio a la izquierda para el título, estilo de cartel gráfico, sin letras.",
    modelId: "ideogram-4",
    settings: { aspectRatio: "4:3", resolution: "2k" },
  },
  {
    id: "event-aftermovie",
    title: "Aftermovie de evento",
    subtitle: "La energía de la fiesta en una toma",
    category: "events",
    kind: "video",
    images: [ART.eventAftermovie, ART.verticalReel, ART.editorialPortrait],
    icon: Music,
    prompt:
      "Toma de aftermovie en un concierto de noche: la cámara sube como grúa sobre un público con las manos arriba, rayos de luz verde y ámbar atravesando el humo, confeti en cámara lenta, contraste de cine.",
    modelId: "seedance-2-fast",
    settings: { aspectRatio: "16:9", duration: 6, generateAudio: true },
  },
  {
    id: "brand-still-life",
    title: "Foto de producto",
    subtitle: "Menú, cafetería y empaques",
    category: "photo",
    kind: "image",
    images: [ART.brandStillLife, ART.productSpot, ART.editorialPortrait],
    icon: Coffee,
    prompt:
      "Bodegón para una cafetería de barrio: taza de café de cerámica humeante sobre una mesa de madera cálida, un menú doblado al lado, luz suave de ventana desde la derecha, pared verde oscuro detrás, apetitoso y natural.",
    modelId: "soul-2",
    settings: { aspectRatio: "4:3" },
  },
]

function gradientFromSeed(seed: string): string {
  let hash = 0
  for (const c of seed) hash = (hash * 31 + c.charCodeAt(0)) >>> 0
  const start = hash % 360
  const end = (start + 36 + ((hash >>> 8) % 72)) % 360
  return `linear-gradient(135deg, hsl(${start} 62% 52%) 0%, hsl(${end} 76% 27%) 100%)`
}

function GradientBadge({ as: Glyph, seed }: { as: LucideIcon; seed: string }) {
  return (
    <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-white/25 text-white shadow-[0_5px_3px_rgba(0,0,0,0.08),inset_0_3px_5px_rgba(255,255,255,0.24)]">
      <span
        aria-hidden
        className="absolute inset-0"
        style={{ backgroundImage: gradientFromSeed(seed) }}
      />
      <span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 mix-blend-overlay"
      />
      <Glyph className="relative size-5" />
    </span>
  )
}

const TRIPTYCH = [
  "rounded-l-2xl rounded-r-sm",
  "rounded-sm",
  "rounded-r-2xl rounded-l-sm",
] as const

export interface TemplateCardProps {
  template: TemplateItem
  variant?: "single" | "triptych"
  onTry: (template: TemplateItem) => void
  tryLabel?: ReactNode
}

export function TemplateCard({
  template,
  variant = "single",
  onTry,
  tryLabel = "Usar",
}: TemplateCardProps) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.currentTarget !== event.target) return
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onTry(template)
    }
  }
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Usar ejemplo: ${template.title}`}
      className="relative flex cursor-pointer flex-col gap-2 rounded-[20px] bg-white/5 p-2 shadow-[0_2px_6px_rgba(0,0,0,0.15)] transition-[transform,background-color] duration-200 hover:z-[1] hover:-translate-y-0.5 hover:bg-white/8 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:hover:translate-y-0"
      onClick={() => onTry(template)}
      onKeyDown={onKeyDown}
    >
      <div className="flex h-60 items-stretch gap-1.5">
        {variant === "triptych" ? (
          template.images.map((src, i) => (
            <div
              key={i}
              className={cn(
                "min-w-0 flex-1 overflow-hidden border border-white/10",
                TRIPTYCH[i]
              )}
            >
              <img
                src={src}
                alt={`${template.title}, toma ${i + 1}`}
                className="size-full object-cover"
              />
            </div>
          ))
        ) : (
          <div className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-white/10">
            <img
              src={template.images[0]}
              alt={template.title}
              className="size-full object-cover"
            />
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 px-2 py-1">
        <GradientBadge as={template.icon} seed={template.id} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-foreground">
            {template.title}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {template.subtitle}
          </span>
        </div>
        <Button
          size="sm"
          className="rounded-full font-semibold"
          onClick={(event) => {
            event.stopPropagation()
            onTry(template)
          }}
        >
          {tryLabel}
        </Button>
      </div>
    </div>
  )
}

export interface ExamplePresetsProps {
  items: TemplateItem[]
  onUse: (template: TemplateItem) => void
  tryLabel?: ReactNode
  className?: string
}

/** The Explore grid: two columns of `TemplateCard`s. */
export function ExamplePresets({
  items,
  onUse,
  tryLabel = "Usar",
  className = "w-full max-w-[900px]",
}: ExamplePresetsProps) {
  return (
    <div
      className={cn("grid w-full grid-cols-1 gap-5 sm:grid-cols-2", className)}
    >
      {items.map((t) => (
        <TemplateCard
          key={t.id}
          template={t}
          onTry={onUse}
          tryLabel={tryLabel}
        />
      ))}
    </div>
  )
}
