/* eslint-disable @next/next/no-img-element */
"use client"

import { useId, useRef, useState } from "react"
import {
  Camera,
  Film,
  ImagePlus,
  Loader2,
  Sparkles,
  Type,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  TREND_CATEGORIES,
  TRENDS,
  aceptaLugar,
  type Trend,
  type TrendCategory,
} from "@/lib/studio/trends"
import { uploadAsset, type AssetSelection } from "@/lib/studio/uploads"
import { Deslizador } from "@/components/ui/deslizador"
import { cn } from "@/lib/utils"

/** Cuánto cuesta una trend para esta persona, ya calculado por el Estudio. */
export type TrendPrice =
  | { state: "free" }
  | { state: "ok"; cost: number }
  | { state: "short"; cost: number }
  | { state: "unpriced" }

function precio(p: TrendPrice): string {
  if (p.state === "free") return "Gratis para ti"
  if (p.state === "unpriced") return "No disponible"
  return `${new Intl.NumberFormat("es-DO", { maximumFractionDigits: 2 }).format(p.cost)} créditos`
}

function TrendCard({
  trend,
  price,
  onOpen,
}: {
  trend: Trend
  price: TrendPrice
  onOpen: (trend: Trend) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(trend)}
      aria-label={`${trend.title}: ${trend.subtitle}`}
      className="group relative flex aspect-[3/4] w-full flex-col justify-end overflow-hidden rounded-[22px] border border-white/10 bg-card text-left shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-transform duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.98] motion-reduce:transition-none"
    >
      <img
        src={trend.cover}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none"
      />
      {trend.coverVideo ? (
        <video
          src={trend.coverVideo}
          poster={trend.cover}
          muted
          loop
          autoPlay
          playsInline
          preload="metadata"
          aria-hidden
          className="absolute inset-0 size-full object-cover motion-reduce:hidden"
        />
      ) : null}
      <span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"
      />
      {trend.before ? (
        <span className="absolute top-12 left-2.5 flex w-[46%] flex-col overflow-hidden rounded-xl border-2 border-white/80 shadow-[0_6px_16px_rgba(0,0,0,0.5)]">
          <img
            src={trend.before}
            alt=""
            loading="lazy"
            className="aspect-[3/4] w-full object-cover"
          />
          <span className="bg-black/70 py-0.5 text-center text-[10px] font-semibold tracking-wide text-white uppercase">
            Antes
          </span>
        </span>
      ) : null}
      <span className="absolute top-2.5 left-2.5 flex gap-1.5">
        {trend.badge ? (
          <span className="rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white uppercase backdrop-blur-md">
            {trend.badge}
          </span>
        ) : null}
      </span>
      <span className="absolute top-2.5 right-2.5 flex size-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-md">
        {trend.kind === "video" ? (
          <Film className="size-4" />
        ) : trend.photo ? (
          <Camera className="size-4" />
        ) : (
          <Type className="size-4" />
        )}
      </span>
      <span className="relative flex flex-col gap-1 p-3 sm:p-4">
        <span className="text-[15px] leading-tight font-semibold text-white sm:text-base">
          {trend.title}
        </span>
        <span className="line-clamp-2 text-xs text-white/75">
          {trend.subtitle}
        </span>
        <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-md">
          <Sparkles className="size-3" /> {precio(price)}
        </span>
      </span>
    </button>
  )
}

/** La vitrina de trends: filtros arriba y tarjetas grandes de un toque. */
export function TrendGallery({
  priceOf,
  onOpen,
  className,
}: {
  priceOf: (trend: Trend) => TrendPrice
  onOpen: (trend: Trend) => void
  className?: string
}) {
  const [filtro, setFiltro] = useState<"todo" | TrendCategory>("todo")
    return (
    <section className={cn("flex w-full flex-col gap-4", className)}>
      <div
        role="tablist"
        aria-label="Tipos de trend"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0"
      >
        {TREND_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={filtro === c.id}
            onClick={() => setFiltro(c.id)}
            className={cn(
              "h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              filtro === c.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-white/10 bg-white/5 text-foreground hover:bg-white/10"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
      {(filtro === "todo"
        ? TREND_CATEGORIES.filter((c) => c.id !== "todo")
        : TREND_CATEGORIES.filter((c) => c.id === filtro)
      ).map((c) => {
        const fila = TRENDS.filter((t) => t.category === c.id)
        if (!fila.length) return null
        return (
          <div key={c.id} className="flex flex-col gap-2">
            {filtro === "todo" ? (
              <h3 className="text-base font-bold">{c.label}</h3>
            ) : null}
            <Deslizador
              etiqueta={c.label}
              className="-mx-4 sm:mx-0"
              pistaClassName="scroll-px-4 px-4 sm:scroll-px-0 sm:px-0"
            >
              {fila.map((t) => (
                <div
                  key={t.id}
                  className="w-[72vw] max-w-[300px] shrink-0 snap-start sm:w-[280px]"
                >
                  <TrendCard trend={t} price={priceOf(t)} onOpen={onOpen} />
                </div>
              ))}
            </Deslizador>
          </div>
        )
      })}
    </section>
  )
}

export type TrendPhotoValue = { url: string; name?: string }

/**
 * La hoja de una trend: muestra, la foto que pide (subirla o escoger una que ya
 * esté), el texto corto si lo pide, el costo y el botón de Generar.
 */
export function TrendSheet({
  trend,
  open,
  onOpenChange,
  price,
  recent,
  initialPhoto,
  busy,
  onGenerate,
  onTopUp,
}: {
  trend: Trend | null
  open: boolean
  onOpenChange: (open: boolean) => void
  price: TrendPrice
  /** Fotos que la persona ya tiene a mano (subidas o generadas). */
  recent: AssetSelection[]
  initialPhoto?: TrendPhotoValue | null
  busy: boolean
  onGenerate: (input: {
    text: string
    photo: TrendPhotoValue | null
    lugar: string
  }) => void
  onTopUp: () => void
}) {
  const [photo, setPhoto] = useState<TrendPhotoValue | null>(
    initialPhoto ?? null
  )
  const [text, setText] = useState("")
  const [lugar, setLugar] = useState("")
  const lugarId = useId()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const textId = useId()

  // Cada vez que se abre otra trend (o con otra foto), empieza limpia.
  const [abierta, setAbierta] = useState<string | null>(null)
  const clave = open && trend ? `${trend.id}|${initialPhoto?.url ?? ""}` : null
  if (clave !== abierta) {
    setAbierta(clave)
    if (clave) {
      setPhoto(initialPhoto ?? null)
      setText("")
      setLugar("")
      setError(null)
    }
  }

  if (!trend) return null

  const subir = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("Escoge una foto (JPG, PNG o HEIC).")
      return
    }
    setUploading(true)
    setError(null)
    try {
      const item = await uploadAsset(file)
      setPhoto({ url: item.src, name: item.name })
    } catch (caught) {
      setError(
        caught instanceof Error && caught.message
          ? caught.message
          : "No se pudo subir la foto. Intenta de nuevo."
      )
    } finally {
      setUploading(false)
      if (input.current) input.current.value = ""
    }
  }

  const faltaFoto = !!trend.photo && !photo
  const corto = price.state === "short"
  const imagenes = recent.filter((r) => r.kind === "image").slice(0, 8)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{trend.title}</DialogTitle>
          <DialogDescription>{trend.subtitle}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] items-start gap-3">
              <figure className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10">
                {trend.coverVideo ? (
                  <video
                    src={trend.coverVideo}
                    poster={trend.cover}
                    controls
                    loop
                    playsInline
                    className="size-full object-cover"
                    aria-label={`Video de ejemplo de ${trend.title}, con sonido`}
                  />
                ) : (
                  <img
                    src={trend.cover}
                    alt={`Ejemplo de ${trend.title}`}
                    className="size-full object-cover"
                  />
                )}
                {trend.before ? (
                  <img
                    src={trend.before}
                    alt="Foto de antes"
                    className="pointer-events-none absolute top-2 left-2 w-[46%] rounded-lg border-2 border-white/80 object-cover shadow-lg"
                  />
                ) : null}
                <figcaption className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white">
                  {trend.before ? "Antes → Después" : "Ejemplo"}
                </figcaption>
              </figure>

              {trend.photo ? (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-semibold">
                    {trend.photo.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => input.current?.click()}
                    disabled={uploading || busy}
                    className={cn(
                      "relative flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed text-center text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      photo
                        ? "border-primary/60"
                        : "border-white/20 bg-white/5 hover:bg-white/10"
                    )}
                  >
                    {photo ? (
                      <>
                        <img
                          src={photo.url}
                          alt="Tu foto"
                          className="absolute inset-0 size-full object-cover"
                        />
                        <span className="absolute right-2 bottom-2 rounded-full bg-black/60 px-2 py-1 text-[11px] text-white">
                          Cambiar
                        </span>
                      </>
                    ) : uploading ? (
                      <>
                        <Loader2 className="size-6 animate-spin" />
                        Subiendo…
                      </>
                    ) : (
                      <>
                        <ImagePlus className="size-7 text-primary" />
                        <span className="px-3 font-semibold">
                          Toca para subir
                        </span>
                        <span className="px-3 text-xs text-muted-foreground">
                          o toma la foto ahora
                        </span>
                      </>
                    )}
                  </button>
                  {photo && !uploading ? (
                    <button
                      type="button"
                      onClick={() => setPhoto(null)}
                      className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3" /> Quitar foto
                    </button>
                  ) : null}
                  <input
                    ref={input}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    tabIndex={-1}
                    aria-label={trend.photo.label}
                    onChange={(e) => void subir(e.target.files?.[0])}
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No necesitas foto: escribe lo que se pide abajo y toca
                  Generar.
                </p>
              )}
            </div>

            {trend.photo ? (
              <p className="-mt-2 text-xs text-muted-foreground">
                {trend.photo.hint}
              </p>
            ) : null}

            {trend.photo && imagenes.length ? (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  O usa una que ya tienes
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                  {imagenes.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setPhoto({ url: r.src, name: r.name })}
                      aria-label="Usar esta foto"
                      aria-pressed={photo?.url === r.src}
                      className={cn(
                        "size-14 shrink-0 overflow-hidden rounded-xl border-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                        photo?.url === r.src
                          ? "border-primary"
                          : "border-transparent"
                      )}
                    >
                      <img
                        src={r.src}
                        alt=""
                        className="size-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {trend.text ? (
              <label htmlFor={textId} className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">{trend.text.label}</span>
                <input
                  id={textId}
                  value={text}
                  maxLength={trend.text.max}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={trend.text.placeholder}
                  className="h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-base outline-none placeholder:text-muted-foreground focus-visible:border-primary"
                />
              </label>
            ) : null}

            {aceptaLugar(trend) ? (
              <label htmlFor={lugarId} className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">
                  ¿Dónde quieres salir? <span className="font-normal text-muted-foreground">(opcional)</span>
                </span>
                <input
                  id={lugarId}
                  value={lugar}
                  maxLength={100}
                  onChange={(e) => setLugar(e.target.value)}
                  placeholder="Ej.: frente al Monumento de Santiago, en París, en Miami…"
                  className="h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-base outline-none placeholder:text-muted-foreground focus-visible:border-primary"
                />
              </label>
            ) : null}

            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <div className="flex flex-col gap-2">
              {corto ? (
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full text-base"
                  onClick={onTopUp}
                >
                  Te faltan créditos · Recargar
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="h-12 rounded-full text-base font-semibold"
                  disabled={
                    faltaFoto || uploading || busy || price.state === "unpriced"
                  }
                  onClick={() => onGenerate({ text, photo, lugar })}
                >
                  {busy ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Sparkles className="size-5" />
                  )}
                  {faltaFoto
                    ? "Sube tu foto para seguir"
                    : trend.kind === "video"
                      ? "Generar video"
                      : "Generar"}
                </Button>
              )}
              <p className="text-center text-xs text-muted-foreground">
                {precio(price)}
                {trend.kind === "video" ? " · tarda 1 a 3 minutos" : ""}
              </p>
            </div>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
