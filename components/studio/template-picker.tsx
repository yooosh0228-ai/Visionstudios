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

/** 402 Vision Studios briefs: each one loads a production-ready prompt and the
    model/settings it was written for. The user can still switch model after. */
export const TEMPLATES: TemplateItem[] = [
  {
    id: "product-spot",
    title: "Product spot",
    subtitle: "Hero reveal for a client's product",
    category: "commercial",
    kind: "video",
    images: [ART.productSpot, ART.brandStillLife, ART.campaignKeyVisual],
    icon: Clapperboard,
    prompt:
      "Commercial product reveal: a glass bottle rises onto a dark stone plinth, slow 180-degree orbit, hard rim light in warm amber, fine dust drifting through a single top spotlight, shallow depth of field, premium and quiet.",
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
    title: "Vertical reel",
    subtitle: "9:16 opener for Instagram and TikTok",
    category: "social",
    kind: "video",
    images: [ART.verticalReel, ART.eventAftermovie, ART.productSpot],
    icon: Smartphone,
    prompt:
      "Vertical social opener: handheld walk along a seafront boulevard at golden hour, city skyline in silhouette, waves catching the sun, quick whip pan into a close-up of the subject smiling at camera, energetic and natural.",
    modelId: "kling-3-pro",
    settings: { aspectRatio: "9:16", duration: 5, sound: true },
  },
  {
    id: "editorial-portrait",
    title: "Editorial portrait",
    subtitle: "Magazine-grade talent still",
    category: "photo",
    kind: "image",
    images: [ART.editorialPortrait, ART.brandStillLife, ART.campaignKeyVisual],
    icon: Aperture,
    prompt:
      "Editorial portrait of a musician in a deep green coat against a charcoal wall, single hard key light from the left, 85mm lens, shallow depth of field, rich skin tones, calm confident gaze, film grain.",
    modelId: "soul-cinema",
    settings: { aspectRatio: "3:4", resolution: "1080p" },
  },
  {
    id: "campaign-key-visual",
    title: "Campaign key visual",
    subtitle: "Poster art with room for type",
    category: "brand",
    kind: "image",
    images: [ART.campaignKeyVisual, ART.productSpot, ART.verticalReel],
    icon: Megaphone,
    prompt:
      "Campaign key visual for a summer festival: bold flat amber background, a large green sun setting over stylised dark waves on the right, clean empty space on the left for headline typography, graphic poster style.",
    modelId: "ideogram-4",
    settings: { aspectRatio: "4:3", resolution: "2k" },
  },
  {
    id: "event-aftermovie",
    title: "Event aftermovie",
    subtitle: "Concert energy in one shot",
    category: "events",
    kind: "video",
    images: [ART.eventAftermovie, ART.verticalReel, ART.editorialPortrait],
    icon: Music,
    prompt:
      "Aftermovie shot at a night concert: crane move rising over a crowd with raised hands, green and amber stage beams cutting through haze, confetti in slow motion, cinematic contrast.",
    modelId: "seedance-2-fast",
    settings: { aspectRatio: "16:9", duration: 6, generateAudio: true },
  },
  {
    id: "brand-still-life",
    title: "Brand still life",
    subtitle: "Menu, café and packaging shots",
    category: "photo",
    kind: "image",
    images: [ART.brandStillLife, ART.productSpot, ART.editorialPortrait],
    icon: Coffee,
    prompt:
      "Still life for a local café brand: ceramic cup of coffee with steam on a warm wooden table, a folded menu card beside it, soft window light from the right, deep green wall behind, appetising and natural.",
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
  tryLabel = "Try",
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
      aria-label={`Use template: ${template.title}`}
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
                alt={`${template.title} — shot ${i + 1}`}
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
  tryLabel = "Try",
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
