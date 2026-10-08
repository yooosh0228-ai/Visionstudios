"use client"

import { Grid3x3 } from "lucide-react"

import { Slider } from "@/components/ui/slider"

import { DENSITY_ROW_HEIGHTS } from "./use-justified-gallery"

/** Tile-size control: right = larger tiles. The engine re-lays out with scroll anchoring. */
export function DensityControl({
  value,
  onChange,
}: {
  value: number
  onChange: (level: number) => void
}) {
  return (
    <div
      className="flex w-32 shrink-0 items-center gap-2 text-muted-foreground"
      title="Tamaño de las miniaturas"
    >
      <Grid3x3 className="size-3.5 shrink-0" aria-hidden />
      <Slider
        aria-label="Tamaño de las miniaturas"
        min={0}
        max={DENSITY_ROW_HEIGHTS.length - 1}
        step={1}
        value={[value]}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0]! : v)}
      />
    </div>
  )
}
